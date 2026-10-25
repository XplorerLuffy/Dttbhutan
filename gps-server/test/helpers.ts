import http from "node:http";
import type { AddressInfo } from "node:net";
import { ingestPosition, secretMatches, type IngestDb } from "../../src/lib/gps/ingest";
import { authCodeFor } from "../src/auth";
import type { Config } from "../src/config";
import { silentLogger } from "../src/logger";
import { GpsServer } from "../src/server";
import { HttpDeviceRegistry, HttpPositionSink, WebsiteHealth } from "../src/website";

export const INGEST_SECRET = "ingest-secret-for-tests";
export const AUTH_SECRET = "device-auth-secret-for-tests-0123456789";

export type FakeDevice = { id: string; vehicleId: string; status: "ACTIVE" | "INACTIVE"; operator: string };
export type StoredPosition = { deviceId: string; tripId: string | null; latitude: number; longitude: number; recordedAt: Date };

/**
 * An in-memory stand-in for the Vercel + Supabase side. It runs the real
 * ingestPosition()/secretMatches() code from src/lib/gps/ingest.ts behind the
 * same two HTTP contracts the real routes expose; only the Prisma glue in the
 * route files is replaced.
 */
export async function startWebsite() {
  const devices = new Map<string, FakeDevice>();
  const positions: StoredPosition[] = [];
  const trips = new Map<string, { id: string; startedAt: Date | null }>();
  let failWith: number | null = null;
  const calls = { ingest: 0, device: 0 };

  const db: IngestDb = {
    async findDevice(identifier) {
      const d = devices.get(identifier);
      return d ? { id: d.id, vehicleId: d.vehicleId, status: d.status } : null;
    },
    async findActiveTrip(vehicleId) {
      return trips.get(vehicleId) ?? null;
    },
    async findPosition(deviceId, recordedAt) {
      const p = positions.find((x) => x.deviceId === deviceId && x.recordedAt.getTime() === recordedAt.getTime());
      return p ? { id: `pos-${positions.indexOf(p)}`, tripId: p.tripId } : null;
    },
    async createPosition(data) {
      positions.push({ deviceId: data.deviceId, tripId: data.tripId, latitude: data.latitude, longitude: data.longitude, recordedAt: data.recordedAt });
      return { id: `pos-${positions.length - 1}`, tripId: data.tripId };
    },
  };

  const server = http.createServer((req, res) => {
    const reply = (status: number, body: unknown) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    };
    if (failWith) return reply(failWith, { error: "down" });
    if (!secretMatches(INGEST_SECRET, (req.headers["x-ingest-secret"] as string) ?? null)) return reply(401, { error: "Unauthorized" });
    const url = new URL(req.url ?? "/", "http://x");
    if (req.method === "GET" && url.pathname === "/api/gps/device") {
      calls.device++;
      const d = devices.get(url.searchParams.get("deviceIdentifier") ?? "");
      return reply(200, { registered: Boolean(d), active: d?.status === "ACTIVE" });
    }
    if (req.method === "POST" && url.pathname === "/api/gps/ingest") {
      calls.ingest++;
      let raw = "";
      req.on("data", (c) => (raw += c));
      req.on("end", async () => {
        const b = JSON.parse(raw);
        const result = await ingestPosition(db, { ...b, recordedAt: new Date(b.recordedAt) });
        reply(result.status, result.body);
      });
      return;
    }
    reply(404, {});
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  return {
    base,
    devices,
    positions,
    trips,
    calls,
    addDevice(phone: string, operator: string, status: "ACTIVE" | "INACTIVE" = "ACTIVE") {
      devices.set(phone, { id: `dev-${phone}`, vehicleId: `veh-${phone}`, status, operator });
    },
    setFailure(code: number | null) {
      failWith = code;
    },
    close: () => new Promise<void>((r) => server.close(() => r())),
  };
}

export function testConfig(base: string, over: Partial<Config> = {}): Config {
  return {
    listenHost: "127.0.0.1",
    listenPort: 0,
    healthHost: "127.0.0.1",
    healthPort: 0,
    ingestUrl: `${base}/api/gps/ingest`,
    deviceCheckUrl: `${base}/api/gps/device`,
    ingestSecret: INGEST_SECRET,
    deviceAuthSecret: AUTH_SECRET,
    maxConnections: 50,
    maxConnectionsPerIp: 50,
    authTimeoutMs: 5000,
    idleTimeoutMs: 5000,
    maxMessagesPerSecond: 100,
    tzOffsetMinutes: 480,
    maxFutureSkewMs: 600_000,
    maxAgeMs: 30 * 86_400_000,
    httpTimeoutMs: 1000,
    logLevel: "error",
    ...over,
  };
}

export async function startGps(base: string, over: Partial<Config> = {}) {
  const cfg = testConfig(base, over);
  const health = new WebsiteHealth();
  const gps = new GpsServer({
    cfg,
    log: silentLogger,
    sink: new HttpPositionSink(cfg, silentLogger, health, []),
    registry: new HttpDeviceRegistry(cfg, silentLogger, health, 60_000, 0),
  });
  await gps.start();
  return { gps, cfg, health };
}

export const codeFor = (phone: string) => authCodeFor(AUTH_SECRET, phone);
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
