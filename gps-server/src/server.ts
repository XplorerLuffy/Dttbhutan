import net from "node:net";
import { authCodeFor, authCodeMatches } from "./auth";
import type { Config } from "./config";
import type { Logger } from "./logger";
import { FrameError, FrameSplitter, encodeFrame, parseFrame, type Frame } from "./protocol/frame";
import {
  MSG,
  RESULT,
  parseAuthCode,
  parseLocation,
  parseLocationBatch,
  parseRegistration,
  platformCommonReply,
  registerReply,
} from "./protocol/messages";
import type { DeviceRegistry, PositionSink } from "./website";

type Outcome = "ok" | "fail" | "bad" | "unsupported" | "retry";
const OUTCOME_CODE: Record<Exclude<Outcome, "retry">, number> = {
  ok: RESULT.OK,
  fail: RESULT.FAILED,
  bad: RESULT.BAD_MESSAGE,
  unsupported: RESULT.NOT_SUPPORTED,
};

export type ServerDeps = { cfg: Config; log: Logger; sink: PositionSink; registry: DeviceRegistry };

export type ConnectionInfo = {
  phone: string | null;
  remote: string;
  connectedAt: string;
  lastMessageAt: string | null;
  messages: number;
  positionsStored: number;
};

class Conn {
  readonly splitter: FrameSplitter;
  phone: string | null = null;
  readonly connectedAt = Date.now();
  lastMessageAt: number | null = null;
  messages = 0;
  positionsStored = 0;
  badFramesInARow = 0;
  windowStart = Date.now();
  windowCount = 0;
  platformSerial = 0;
  closing = false;
  authTimer?: NodeJS.Timeout;
  idleTimer?: NodeJS.Timeout;
  /** Last replies by (message id, serial), so a device retransmission is re-acknowledged, not reprocessed. */
  readonly recent = new Map<string, number>();

  constructor(
    readonly socket: net.Socket,
    readonly ip: string
  ) {
    this.splitter = new FrameSplitter(4096);
  }
}

export class GpsServer {
  private readonly cfg: Config;
  private readonly log: Logger;
  private readonly sink: PositionSink;
  private readonly registry: DeviceRegistry;
  private server?: net.Server;
  private readonly conns = new Set<Conn>();
  private readonly byPhone = new Map<string, Conn>();
  private readonly perIp = new Map<string, number>();
  private inFlight = 0;
  private stopping = false;

  readonly counters = {
    connectionsAccepted: 0,
    connectionsRefused: 0,
    framesOk: 0,
    framesBad: {} as Record<string, number>,
    preAuthDropped: 0,
    phoneMismatch: 0,
    rateLimited: 0,
    authFailed: 0,
    positionsStored: 0,
    positionsUnlocated: 0,
    positionsImplausible: 0,
    positionsRefused: 0,
    positionsNotAcked: 0,
  };

  constructor(deps: ServerDeps) {
    this.cfg = deps.cfg;
    this.log = deps.log;
    this.sink = deps.sink;
    this.registry = deps.registry;
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = net.createServer((s) => this.onConnection(s));
      this.server.once("error", reject);
      this.server.listen(this.cfg.listenPort, this.cfg.listenHost, () => {
        this.server!.off("error", reject);
        this.server!.on("error", (e) => this.log.error("listener error", { error: e.message }));
        resolve();
      });
    });
  }

  get listening(): boolean {
    return Boolean(this.server?.listening) && !this.stopping;
  }

  port(): number {
    return (this.server?.address() as net.AddressInfo).port;
  }

  connections(): ConnectionInfo[] {
    return [...this.conns].map((c) => ({
      phone: c.phone,
      remote: c.ip,
      connectedAt: new Date(c.connectedAt).toISOString(),
      lastMessageAt: c.lastMessageAt ? new Date(c.lastMessageAt).toISOString() : null,
      messages: c.messages,
      positionsStored: c.positionsStored,
    }));
  }

  /** Stop accepting, let in-flight work finish (bounded), then close every socket. */
  async stop(graceMs = 10_000): Promise<void> {
    this.stopping = true;
    const closed = new Promise<void>((r) => (this.server ? this.server.close(() => r()) : r()));
    const deadline = Date.now() + graceMs;
    while (this.inFlight > 0 && Date.now() < deadline) await new Promise((r) => setTimeout(r, 50));
    for (const c of this.conns) this.close(c, "shutdown");
    await closed;
  }

  private onConnection(socket: net.Socket) {
    const ip = socket.remoteAddress ?? "unknown";
    const ipCount = this.perIp.get(ip) ?? 0;
    if (this.stopping || this.conns.size >= this.cfg.maxConnections || ipCount >= this.cfg.maxConnectionsPerIp) {
      this.counters.connectionsRefused++;
      socket.destroy();
      return;
    }
    this.counters.connectionsAccepted++;
    this.perIp.set(ip, ipCount + 1);
    socket.setNoDelay(true);
    socket.setKeepAlive(true, 60_000);

    const conn = new Conn(socket, ip);
    this.conns.add(conn);
    conn.authTimer = setTimeout(() => this.close(conn, "auth_timeout"), this.cfg.authTimeoutMs);
    this.touchIdle(conn);

    socket.on("data", (chunk) => {
      socket.pause();
      this.inFlight++;
      this.onData(conn, chunk)
        .catch((e) => {
          this.log.error("unhandled error processing data", { error: e instanceof Error ? e.message : "unknown" });
          this.close(conn, "internal_error");
        })
        .finally(() => {
          this.inFlight--;
          if (!conn.closing) socket.resume();
        });
    });
    socket.on("error", () => this.close(conn, "socket_error"));
    socket.on("close", () => this.cleanup(conn));
  }

  private touchIdle(conn: Conn) {
    clearTimeout(conn.idleTimer);
    conn.idleTimer = setTimeout(() => this.close(conn, "idle_timeout"), this.cfg.idleTimeoutMs);
  }

  private close(conn: Conn, reason: string) {
    if (conn.closing) return;
    conn.closing = true;
    this.log.info("closing connection", { reason, phone: conn.phone ?? undefined, remote: conn.ip });
    conn.socket.destroy();
    this.cleanup(conn);
  }

  private cleanup(conn: Conn) {
    clearTimeout(conn.authTimer);
    clearTimeout(conn.idleTimer);
    if (!this.conns.delete(conn)) return;
    const n = (this.perIp.get(conn.ip) ?? 1) - 1;
    if (n <= 0) this.perIp.delete(conn.ip);
    else this.perIp.set(conn.ip, n);
    if (conn.phone && this.byPhone.get(conn.phone) === conn) this.byPhone.delete(conn.phone);
  }

  private async onData(conn: Conn, chunk: Buffer) {
    const frames = conn.splitter.push(chunk);
    for (const raw of frames) {
      if (conn.closing) return;
      await this.onFrame(conn, raw);
    }
    if (conn.splitter.overflow) {
      this.countBad("overflow");
      this.close(conn, "frame_overflow");
    }
  }

  private countBad(code: string) {
    this.counters.framesBad[code] = (this.counters.framesBad[code] ?? 0) + 1;
  }

  private async onFrame(conn: Conn, raw: Buffer) {
    // Per-connection rate limit: bounded work per second, however fast a peer sends.
    const now = Date.now();
    if (now - conn.windowStart >= 1000) {
      conn.windowStart = now;
      conn.windowCount = 0;
    }
    conn.windowCount++;
    if (conn.windowCount > this.cfg.maxMessagesPerSecond) {
      this.counters.rateLimited++;
      if (conn.windowCount > this.cfg.maxMessagesPerSecond * 5) this.close(conn, "rate_limit");
      return;
    }

    let frame: Frame;
    try {
      frame = parseFrame(raw);
    } catch (err) {
      const code = err instanceof FrameError ? err.code : "parse";
      this.countBad(code);
      if (++conn.badFramesInARow >= 10) this.close(conn, "too_many_bad_frames");
      return;
    }
    conn.badFramesInARow = 0;
    this.counters.framesOk++;
    conn.messages++;
    conn.lastMessageAt = Date.now();
    this.touchIdle(conn);

    if (frame.subpack) {
      // Sub-packaged (multi-part) messages are not reassembled; say so rather than guess.
      if (conn.phone) this.reply(conn, frame, RESULT.NOT_SUPPORTED);
      return;
    }

    if (conn.phone === null) {
      if (frame.messageId === MSG.REGISTER) return this.onRegister(conn, frame);
      if (frame.messageId === MSG.AUTH) return this.onAuth(conn, frame);
      this.counters.preAuthDropped++;
      return;
    }

    if (frame.phone !== conn.phone) {
      this.counters.phoneMismatch++;
      this.log.warn("message for a different terminal on an authenticated connection", { phone: conn.phone });
      if (++conn.badFramesInARow >= 3) this.close(conn, "phone_mismatch");
      return;
    }

    const key = `${frame.messageId}:${frame.serial}`;
    const seen = conn.recent.get(key);
    if (seen !== undefined && frame.messageId !== MSG.HEARTBEAT) {
      this.reply(conn, frame, seen);
      return;
    }

    switch (frame.messageId) {
      case MSG.HEARTBEAT:
        return this.reply(conn, frame, RESULT.OK);
      case MSG.REGISTER:
        return this.onRegister(conn, frame);
      case MSG.AUTH:
        return this.reply(conn, frame, RESULT.OK);
      case MSG.LOCATION:
        return this.finish(conn, frame, key, await this.processLocation(conn, frame.body));
      case MSG.LOCATION_BATCH:
        return this.finish(conn, frame, key, await this.processBatch(conn, frame.body));
      case MSG.TERMINAL_COMMON_REPLY:
        return; // answers to messages we never send
      default:
        return this.reply(conn, frame, RESULT.NOT_SUPPORTED);
    }
  }

  private finish(conn: Conn, frame: Frame, key: string, outcome: Outcome) {
    if (outcome === "retry") {
      // Not confirmed stored: stay silent so the device keeps the data and resends.
      this.counters.positionsNotAcked++;
      return;
    }
    const code = OUTCOME_CODE[outcome];
    conn.recent.set(key, code);
    if (conn.recent.size > 128) conn.recent.delete(conn.recent.keys().next().value!);
    this.reply(conn, frame, code);
  }

  private send(conn: Conn, messageId: number, body: Buffer) {
    if (conn.closing || conn.socket.destroyed) return;
    conn.platformSerial = (conn.platformSerial + 1) & 0xffff;
    conn.socket.write(encodeFrame({ messageId, phone: conn.phone ?? "000000000000", serial: conn.platformSerial, body }));
  }

  private reply(conn: Conn, frame: Frame, result: number) {
    if (conn.closing || conn.socket.destroyed) return;
    conn.platformSerial = (conn.platformSerial + 1) & 0xffff;
    conn.socket.write(
      encodeFrame({
        messageId: MSG.PLATFORM_COMMON_REPLY,
        phone: frame.phone,
        serial: conn.platformSerial,
        body: platformCommonReply(frame.serial, frame.messageId, result),
      })
    );
  }

  private async onRegister(conn: Conn, frame: Frame) {
    let manufacturer = "";
    try {
      manufacturer = parseRegistration(frame.body).manufacturerId;
    } catch {
      this.countBad("bad_body");
      return;
    }
    const state = await this.registry.lookup(frame.phone);
    if (state === "error") return; // website unreachable: say nothing, the device retries
    const out = (result: number, code?: string) =>
      conn.socket.write(
        encodeFrame({
          messageId: MSG.REGISTER_REPLY,
          phone: frame.phone,
          serial: ++conn.platformSerial & 0xffff,
          body: registerReply(frame.serial, result, code),
        })
      );
    if (state === "unknown") {
      this.log.warn("registration refused: not a registered active device", { phone: frame.phone });
      out(2);
      return;
    }
    this.log.info("terminal registered", { phone: frame.phone, manufacturer });
    out(0, authCodeFor(this.cfg.deviceAuthSecret, frame.phone));
  }

  private async onAuth(conn: Conn, frame: Frame) {
    let code: string;
    try {
      code = parseAuthCode(frame.body);
    } catch {
      this.countBad("bad_body");
      return;
    }
    if (!authCodeMatches(this.cfg.deviceAuthSecret, frame.phone, code)) {
      this.counters.authFailed++;
      this.log.warn("authentication failed", { phone: frame.phone, remote: conn.ip });
      this.reply(conn, frame, RESULT.FAILED);
      this.close(conn, "auth_failed");
      return;
    }
    const state = await this.registry.lookup(frame.phone);
    if (state === "error") return; // cannot verify right now; device will retry
    if (state !== "active") {
      this.counters.authFailed++;
      this.log.warn("authentication refused: device not active", { phone: frame.phone });
      this.reply(conn, frame, RESULT.FAILED);
      this.close(conn, "not_active");
      return;
    }
    const previous = this.byPhone.get(frame.phone);
    if (previous && previous !== conn) this.close(previous, "replaced_by_new_connection");
    conn.phone = frame.phone;
    this.byPhone.set(frame.phone, conn);
    clearTimeout(conn.authTimer);
    this.log.info("terminal authenticated", { phone: frame.phone, remote: conn.ip });
    this.reply(conn, frame, RESULT.OK);
  }

  private async processBatch(conn: Conn, body: Buffer): Promise<Outcome> {
    let batch;
    try {
      batch = parseLocationBatch(body);
    } catch {
      this.countBad("bad_body");
      return "bad";
    }
    for (const block of batch.blocks) {
      const outcome = await this.processLocation(conn, block);
      if (outcome === "retry") return "retry";
    }
    return "ok";
  }

  private async processLocation(conn: Conn, body: Buffer): Promise<Outcome> {
    let loc;
    try {
      loc = parseLocation(body, this.cfg.tzOffsetMinutes);
    } catch {
      this.countBad("bad_body");
      return "bad";
    }
    if (loc.coordinatesEncrypted) {
      this.counters.positionsImplausible++;
      return "unsupported";
    }
    if (!loc.located) {
      this.counters.positionsUnlocated++;
      return "ok";
    }
    const now = Date.now();
    const t = loc.recordedAt.getTime();
    const implausible =
      Math.abs(loc.latitude) > 90 ||
      Math.abs(loc.longitude) > 180 ||
      (loc.latitude === 0 && loc.longitude === 0) ||
      loc.heading > 359 ||
      t > now + this.cfg.maxFutureSkewMs ||
      t < now - this.cfg.maxAgeMs;
    if (implausible) {
      this.counters.positionsImplausible++;
      this.log.warn("position discarded as implausible", { phone: conn.phone ?? undefined });
      return "ok";
    }
    const result = await this.sink.send({
      deviceIdentifier: conn.phone!,
      latitude: loc.latitude,
      longitude: loc.longitude,
      speedKmh: loc.speedKmh,
      heading: loc.heading,
      recordedAt: loc.recordedAt.toISOString(),
    });
    if (result === "persisted") {
      conn.positionsStored++;
      this.counters.positionsStored++;
      return "ok";
    }
    if (result === "rejected") {
      this.counters.positionsRefused++;
      return "fail";
    }
    return "retry";
  }
}
