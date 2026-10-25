/**
 * A pretend JT808 tracker, for local testing and the automated tests. It only
 * proves our server follows the spec document; it says nothing about how a
 * real device behaves.
 *
 *   npx tsx src/simulator.ts --host 127.0.0.1 --port 8808 --phone 012345678901 \
 *       --auth-secret <GPS_DEVICE_AUTH_SECRET> --count 5 --interval 1000
 *
 * With --auth-secret it computes the authentication code itself; otherwise it
 * registers first (0x0100) and uses the code the server returns.
 */
import net from "node:net";
import { pathToFileURL } from "node:url";
import { authCodeFor } from "./auth";
import { FrameSplitter, encodeFrame, parseFrame, type Frame } from "./protocol/frame";
import { MSG, encodeLocation } from "./protocol/messages";

export class SimDevice {
  socket!: net.Socket;
  serial = 0;
  readonly received: Frame[] = [];
  private readonly splitter = new FrameSplitter(8192);
  private waiters: Array<{ match: (f: Frame) => boolean; resolve: (f: Frame) => void }> = [];

  constructor(
    readonly phone: string,
    readonly host: string,
    readonly port: number
  ) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = net.connect(this.port, this.host, () => resolve());
      this.socket.once("error", reject);
      this.socket.on("data", (d) => {
        for (const raw of this.splitter.push(d)) {
          const f = parseFrame(raw);
          this.received.push(f);
          this.waiters = this.waiters.filter((w) => {
            if (w.match(f)) {
              w.resolve(f);
              return false;
            }
            return true;
          });
        }
      });
    });
  }

  nextSerial(): number {
    return ++this.serial & 0xffff;
  }

  sendRaw(bytes: Buffer) {
    this.socket.write(bytes);
  }

  send(messageId: number, body?: Buffer, serial = this.nextSerial()): number {
    this.socket.write(encodeFrame({ messageId, phone: this.phone, serial, body }));
    return serial;
  }

  waitFor(match: (f: Frame) => boolean, timeoutMs = 3000): Promise<Frame> {
    const already = this.received.find(match);
    if (already) return Promise.resolve(already);
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("timed out waiting for a reply")), timeoutMs);
      this.waiters.push({
        match,
        resolve: (f) => {
          clearTimeout(t);
          resolve(f);
        },
      });
    });
  }

  /** Waits for a 0x8001 platform reply to the message with this id and serial; returns the result byte. */
  async waitForAck(answerId: number, answerSerial: number, timeoutMs = 3000): Promise<number> {
    const f = await this.waitFor(
      (x) => x.messageId === MSG.PLATFORM_COMMON_REPLY && x.body.readUInt16BE(0) === answerSerial && x.body.readUInt16BE(2) === answerId,
      timeoutMs
    );
    return f.body[4];
  }

  async register(): Promise<{ result: number; authCode?: string }> {
    const body = Buffer.alloc(25 + 7);
    body.write("DTT00", 4, "ascii");
    const serial = this.send(MSG.REGISTER, body);
    const reply = await this.waitFor((f) => f.messageId === MSG.REGISTER_REPLY && f.body.readUInt16BE(0) === serial);
    const result = reply.body[2];
    return { result, authCode: result === 0 ? reply.body.subarray(3).toString("ascii") : undefined };
  }

  async authenticate(code: string): Promise<number> {
    const serial = this.send(MSG.AUTH, Buffer.from(code, "ascii"));
    return this.waitForAck(MSG.AUTH, serial);
  }

  async sendLocation(args: Parameters<typeof encodeLocation>[0]): Promise<number> {
    const serial = this.send(MSG.LOCATION, encodeLocation(args));
    return this.waitForAck(MSG.LOCATION, serial);
  }

  close() {
    this.socket?.destroy();
  }
}

function arg(name: string, fallback?: string): string {
  const i = process.argv.indexOf(`--${name}`);
  const v = i >= 0 ? process.argv[i + 1] : fallback;
  if (v === undefined) throw new Error(`--${name} is required`);
  return v;
}

async function cli() {
  const dev = new SimDevice(arg("phone"), arg("host", "127.0.0.1"), Number(arg("port", "8808")));
  await dev.connect();
  const secret = process.argv.includes("--auth-secret") ? arg("auth-secret") : undefined;
  let code: string;
  if (secret) code = authCodeFor(secret, dev.phone);
  else {
    const r = await dev.register();
    if (r.result !== 0 || !r.authCode) throw new Error(`registration refused (result ${r.result})`);
    code = r.authCode;
  }
  const authResult = await dev.authenticate(code);
  if (authResult !== 0) throw new Error(`authentication refused (result ${authResult})`);
  console.log("authenticated");

  // A short drive near Thimphu, one point per interval.
  const count = Number(arg("count", "5"));
  const interval = Number(arg("interval", "1000"));
  for (let i = 0; i < count; i++) {
    dev.send(MSG.HEARTBEAT);
    const ack = await dev.sendLocation({
      latitude: 27.4712 + i * 0.0005,
      longitude: 89.6339 + i * 0.0005,
      speedKmh: 30 + i,
      heading: 45,
      // Device clocks have one-second resolution, so each point gets its own second.
      recordedAt: new Date(Math.floor(Date.now() / 1000) * 1000 - (count - 1 - i) * 1000),
    });
    console.log(`position ${i + 1}/${count} acknowledged with result ${ack}`);
    await new Promise((r) => setTimeout(r, interval));
  }
  dev.close();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  cli().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
