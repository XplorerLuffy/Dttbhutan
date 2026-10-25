import type { Config } from "./config";
import type { Logger } from "./logger";

/** What the TCP server needs from the website. Interfaces so tests can swap in fakes. */
export type PositionPayload = {
  deviceIdentifier: string;
  latitude: number;
  longitude: number;
  speedKmh: number;
  heading: number;
  recordedAt: string;
};

/**
 * - persisted:  the website confirmed it stored (or already had) the position.
 * - rejected:   the website permanently refused it (unknown/inactive device,
 *               validation error); resending the same bytes cannot help.
 * - transient:  not confirmed (network, timeout, 5xx, wrong secret). The TCP
 *               server must NOT acknowledge, so the device keeps and resends it.
 */
export type SinkResult = "persisted" | "rejected" | "transient";
export type DeviceState = "active" | "unknown" | "error";

export interface PositionSink {
  send(p: PositionPayload): Promise<SinkResult>;
}
export interface DeviceRegistry {
  lookup(phone: string): Promise<DeviceState>;
}

export class WebsiteHealth {
  lastOkAt = 0;
  lastErrorAt = 0;
  ok() {
    this.lastOkAt = Date.now();
  }
  fail() {
    this.lastErrorAt = Date.now();
  }
  /** Not ready while the most recent website call failed, for up to a minute. */
  get healthy() {
    return !(this.lastErrorAt > this.lastOkAt && Date.now() - this.lastErrorAt < 60_000);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class HttpPositionSink implements PositionSink {
  constructor(
    private readonly cfg: Config,
    private readonly log: Logger,
    private readonly health: WebsiteHealth,
    private readonly retryDelaysMs: number[] = [250, 1000]
  ) {}

  async send(p: PositionPayload): Promise<SinkResult> {
    for (let attempt = 0; ; attempt++) {
      const result = await this.once(p);
      if (result !== "transient" || attempt >= this.retryDelaysMs.length) return result;
      await sleep(this.retryDelaysMs[attempt]);
    }
  }

  private async once(p: PositionPayload): Promise<SinkResult> {
    try {
      const res = await fetch(this.cfg.ingestUrl, {
        method: "POST",
        headers: { "content-type": "application/json", "x-ingest-secret": this.cfg.ingestSecret },
        body: JSON.stringify(p),
        signal: AbortSignal.timeout(this.cfg.httpTimeoutMs),
      });
      if (res.status === 200 || res.status === 201) {
        // A 2xx only counts if the body proves a row exists; a proxy's
        // friendly 200 page must not be mistaken for a stored position.
        const json = (await res.json().catch(() => null)) as { id?: unknown } | null;
        if (json && typeof json.id === "string") {
          this.health.ok();
          return "persisted";
        }
        this.log.error("ingest returned 2xx without a position id", { status: res.status });
        this.health.fail();
        return "transient";
      }
      if (res.status === 401) {
        this.log.error("ingest rejected our secret (401) - check GPS_INGEST_SECRET");
        this.health.fail();
        return "transient";
      }
      if (res.status === 403 || res.status === 404 || res.status === 400) {
        this.health.ok();
        this.log.warn("ingest refused a position", { status: res.status });
        return "rejected";
      }
      this.log.warn("ingest failed", { status: res.status });
      this.health.fail();
      return "transient";
    } catch (err) {
      this.log.warn("ingest unreachable", { error: err instanceof Error ? err.name : "unknown" });
      this.health.fail();
      return "transient";
    }
  }
}

/** Asks the website whether a phone number is a registered, active tracker; caches the answer briefly. */
export class HttpDeviceRegistry implements DeviceRegistry {
  private cache = new Map<string, { state: DeviceState; until: number }>();

  constructor(
    private readonly cfg: Config,
    private readonly log: Logger,
    private readonly health: WebsiteHealth,
    private readonly positiveTtlMs = 60_000,
    private readonly negativeTtlMs = 15_000
  ) {}

  async lookup(phone: string): Promise<DeviceState> {
    const hit = this.cache.get(phone);
    if (hit && hit.until > Date.now()) return hit.state;
    try {
      const url = new URL(this.cfg.deviceCheckUrl);
      url.searchParams.set("deviceIdentifier", phone);
      const res = await fetch(url, {
        headers: { "x-ingest-secret": this.cfg.ingestSecret },
        signal: AbortSignal.timeout(this.cfg.httpTimeoutMs),
      });
      if (!res.ok) {
        this.log.warn("device check failed", { status: res.status });
        this.health.fail();
        return "error";
      }
      const json = (await res.json()) as { registered?: boolean; active?: boolean };
      this.health.ok();
      const state: DeviceState = json.registered && json.active ? "active" : "unknown";
      this.cache.set(phone, { state, until: Date.now() + (state === "active" ? this.positiveTtlMs : this.negativeTtlMs) });
      if (this.cache.size > 5000) this.cache.clear();
      return state;
    } catch (err) {
      this.log.warn("device check unreachable", { error: err instanceof Error ? err.name : "unknown" });
      this.health.fail();
      return "error";
    }
  }
}
