import assert from "node:assert/strict";
import net from "node:net";
import { afterEach, beforeEach, describe, it } from "node:test";
import { encodeFrame } from "../src/protocol/frame";
import { MSG, encodeLocation, encodeLocationBatch } from "../src/protocol/messages";
import { SimDevice } from "../src/simulator";
import { codeFor, sleep, startGps, startWebsite } from "./helpers";

const A = "013900000001";
const B = "013900000002";

let site: Awaited<ReturnType<typeof startWebsite>>;
let g: Awaited<ReturnType<typeof startGps>>;
const open: SimDevice[] = [];

async function device(phone: string): Promise<SimDevice> {
  const d = new SimDevice(phone, "127.0.0.1", g.gps.port());
  await d.connect();
  open.push(d);
  return d;
}
async function login(phone: string): Promise<SimDevice> {
  const d = await device(phone);
  assert.equal(await d.authenticate(codeFor(phone)), 0);
  return d;
}
const fix = (over: Record<string, unknown> = {}) => ({
  latitude: 27.4712,
  longitude: 89.6339,
  speedKmh: 40,
  heading: 90,
  recordedAt: new Date(),
  ...over,
});

beforeEach(async () => {
  site = await startWebsite();
  site.addDevice(A, "operator-a");
  site.addDevice(B, "operator-b");
  g = await startGps(site.base);
});
afterEach(async () => {
  for (const d of open.splice(0)) d.close();
  await g.gps.stop(500);
  await site.close();
});

describe("registration and authentication", () => {
  it("registers a known device and accepts the code it was given", async () => {
    const d = await device(A);
    const reg = await d.register();
    assert.equal(reg.result, 0);
    assert.equal(reg.authCode, codeFor(A));
    assert.equal(await d.authenticate(reg.authCode!), 0);
  });
  it("refuses to register a device the website does not know", async () => {
    const d = await device("013999999999");
    assert.equal((await d.register()).result, 2);
  });
  it("refuses a wrong authentication code and drops the connection", async () => {
    const d = await device(A);
    assert.equal(await d.authenticate("NOTTHECODE"), 1);
    await sleep(100);
    assert.equal(g.gps.connections().length, 0);
    assert.equal(g.gps.counters.authFailed, 1);
  });
  it("refuses another device's code (codes are bound to the phone number)", async () => {
    const d = await device(A);
    assert.equal(await d.authenticate(codeFor(B)), 1);
  });
  it("refuses a deactivated device even with a valid code", async () => {
    site.addDevice("013900000003", "operator-a", "INACTIVE");
    const d = await device("013900000003");
    assert.equal(await d.authenticate(codeFor("013900000003")), 1);
  });
  it("does not accept positions before authentication", async () => {
    const d = await device(A);
    d.send(MSG.LOCATION, encodeLocation(fix()));
    await sleep(200);
    assert.equal(site.positions.length, 0);
    assert.equal(g.gps.counters.preAuthDropped, 1);
  });
  it("closes a connection that never authenticates", async () => {
    await g.gps.stop(100);
    g = await startGps(site.base, { authTimeoutMs: 1000 });
    const d = await device(A);
    await sleep(1300);
    assert.equal(d.socket.destroyed, true);
  });
  it("closes an idle connection", async () => {
    await g.gps.stop(100);
    g = await startGps(site.base, { idleTimeoutMs: 1000 });
    const d = await login(A);
    await sleep(1300);
    assert.equal(d.socket.destroyed, true);
  });
  it("lets a reconnecting device replace its stale connection", async () => {
    const first = await login(A);
    const second = await login(A);
    await sleep(100);
    assert.equal(first.socket.destroyed, true);
    assert.equal(second.socket.destroyed, false);
    assert.equal(g.gps.connections().filter((c) => c.phone === A).length, 1);
  });
});

describe("heartbeat and location flow", () => {
  it("acknowledges a heartbeat", async () => {
    const d = await login(A);
    const serial = d.send(MSG.HEARTBEAT);
    assert.equal(await d.waitForAck(MSG.HEARTBEAT, serial), 0);
  });
  it("stores a valid position through the authenticated ingest and acknowledges it", async () => {
    const d = await login(A);
    const t = new Date(Date.now() - 5000);
    t.setMilliseconds(0);
    assert.equal(await d.sendLocation(fix({ recordedAt: t })), 0);
    assert.equal(site.positions.length, 1);
    assert.equal(site.positions[0].deviceId, `dev-${A}`);
    assert.equal(site.positions[0].recordedAt.getTime(), t.getTime());
    assert.ok(Math.abs(site.positions[0].latitude - 27.4712) < 1e-6);
  });
  it("stores a retransmitted position once", async () => {
    const d = await login(A);
    const t = new Date(Date.now() - 5000);
    t.setMilliseconds(0);
    const body = encodeLocation(fix({ recordedAt: t }));
    // Same frame twice (same serial): re-acknowledged without reprocessing.
    const s1 = d.send(MSG.LOCATION, body, 50);
    assert.equal(await d.waitForAck(MSG.LOCATION, s1), 0);
    d.send(MSG.LOCATION, body, 50);
    // Same position with a new serial (a device re-sending a stored point): the website's dedupe holds.
    const s2 = d.send(MSG.LOCATION, body);
    assert.equal(await d.waitForAck(MSG.LOCATION, s2), 0);
    assert.equal(site.positions.length, 1);
    assert.equal(site.calls.ingest, 2);
  });
  it("accepts stored positions in a 0x0704 batch, out of order, once each", async () => {
    const d = await login(A);
    const base = Date.now() - 60_000;
    const mk = (offset: number) => encodeLocation(fix({ recordedAt: new Date(Math.floor((base + offset) / 1000) * 1000) }));
    const serial = d.send(MSG.LOCATION_BATCH, encodeLocationBatch(1, [mk(20_000), mk(0), mk(10_000), mk(10_000)]));
    assert.equal(await d.waitForAck(MSG.LOCATION_BATCH, serial), 0);
    assert.equal(site.positions.length, 3);
  });
  it("acknowledges but does not store an unlocated fix", async () => {
    const d = await login(A);
    assert.equal(await d.sendLocation(fix({ located: false })), 0);
    assert.equal(site.positions.length, 0);
    assert.equal(g.gps.counters.positionsUnlocated, 1);
  });
  it("discards a position whose clock is far in the future (a time-zone mix-up) and says so", async () => {
    const d = await login(A);
    // A device on GMT+6 sending local time would look 2 h ahead under the GMT+8 assumption.
    const wrongZone = fix({ recordedAt: new Date(Date.now() + 2 * 3600_000) });
    assert.equal(await d.sendLocation(wrongZone), 0);
    assert.equal(site.positions.length, 0);
    assert.equal(g.gps.counters.positionsImplausible, 1);
  });
  it("discards 0,0 and stale positions", async () => {
    const d = await login(A);
    assert.equal(await d.sendLocation(fix({ latitude: 0, longitude: 0 })), 0);
    assert.equal(await d.sendLocation(fix({ recordedAt: new Date(Date.now() - 90 * 86_400_000) })), 0);
    assert.equal(site.positions.length, 0);
  });
  it("answers 'not supported' to message types it does not handle", async () => {
    const d = await login(A);
    const serial = d.send(0x0900, Buffer.from([0x01, 0x02]));
    assert.equal(await d.waitForAck(0x0900, serial), 3);
  });
  it("does not acknowledge a position the website could not confirm, then accepts the resend", async () => {
    const d = await login(A);
    site.setFailure(503);
    const body = encodeLocation(fix({ recordedAt: new Date(Math.floor((Date.now() - 3000) / 1000) * 1000) }));
    const serial = d.send(MSG.LOCATION, body);
    await assert.rejects(d.waitForAck(MSG.LOCATION, serial, 600), /timed out/);
    assert.equal(site.positions.length, 0);
    assert.equal(g.gps.counters.positionsNotAcked, 1);
    site.setFailure(null);
    assert.equal(await d.waitForAck(MSG.LOCATION, d.send(MSG.LOCATION, body)), 0);
    assert.equal(site.positions.length, 1);
  });
  it("does not trust a 200 that is not a stored-position response", async () => {
    // A wrong ingest URL behind a proxy that answers 200 with a page must not count as stored.
    await g.gps.stop(100);
    const decoy = (await import("node:http")).createServer((_q, r) => r.writeHead(200).end("<html>ok</html>"));
    await new Promise<void>((r) => decoy.listen(0, "127.0.0.1", r));
    const port = (decoy.address() as net.AddressInfo).port;
    g = await startGps(site.base, { ingestUrl: `http://127.0.0.1:${port}/api/gps/ingest` });
    try {
      const d = await login(A);
      const serial = d.send(MSG.LOCATION, encodeLocation(fix()));
      await assert.rejects(d.waitForAck(MSG.LOCATION, serial, 500), /timed out/);
    } finally {
      decoy.close();
    }
  });
  it("attaches a position to the active trip only if recorded after the trip started", async () => {
    const started = new Date(Math.floor((Date.now() - 600_000) / 1000) * 1000);
    site.trips.set(`veh-${A}`, { id: "trip-1", startedAt: started });
    const d = await login(A);
    await d.sendLocation(fix({ recordedAt: new Date(started.getTime() - 120_000) })); // stored point from before the trip
    await d.sendLocation(fix({ recordedAt: new Date(started.getTime() + 120_000) }));
    assert.deepEqual(site.positions.map((p) => p.tripId), [null, "trip-1"]);
  });
});

describe("tenant isolation", () => {
  it("never lets one authenticated device write another device's position", async () => {
    const a = await login(A);
    // Device A's connection sends a frame whose header names device B.
    const forged = encodeFrame({ messageId: MSG.LOCATION, phone: B, serial: 9, body: encodeLocation(fix()) });
    a.sendRaw(forged);
    await sleep(300);
    assert.equal(site.positions.length, 0);
    assert.equal(g.gps.counters.phoneMismatch, 1);
    // And A's own positions go only to A's record.
    await a.sendLocation(fix());
    assert.deepEqual([...new Set(site.positions.map((p) => p.deviceId))], [`dev-${A}`]);
  });
  it("keeps two simultaneous devices' positions apart", async () => {
    const [a, b] = await Promise.all([login(A), login(B)]);
    const t = (n: number) => new Date(Math.floor((Date.now() - 10_000 + n * 1000) / 1000) * 1000);
    await Promise.all([a.sendLocation(fix({ recordedAt: t(0), latitude: 27.1 })), b.sendLocation(fix({ recordedAt: t(0), latitude: 27.9 }))]);
    const byDevice = new Map(site.positions.map((p) => [p.deviceId, p.latitude]));
    assert.ok(Math.abs(byDevice.get(`dev-${A}`)! - 27.1) < 1e-6);
    assert.ok(Math.abs(byDevice.get(`dev-${B}`)! - 27.9) < 1e-6);
  });
  it("handles many concurrent connections", async () => {
    const phones = Array.from({ length: 25 }, (_, i) => `0139000001${String(i).padStart(2, "0")}`);
    phones.forEach((p) => site.addDevice(p, "operator-a"));
    const devs = await Promise.all(phones.map((p) => login(p)));
    const acks = await Promise.all(devs.map((d, i) => d.sendLocation(fix({ recordedAt: new Date(Math.floor((Date.now() - 5000 - i) / 1000) * 1000) }))));
    assert.ok(acks.every((a) => a === 0));
    assert.equal(site.positions.length, 25);
  });
});

describe("hostile and broken input", () => {
  it("copes with a frame split across many TCP writes and two frames in one write", async () => {
    const d = await login(A);
    const t1 = new Date(Math.floor((Date.now() - 9000) / 1000) * 1000);
    const t2 = new Date(t1.getTime() + 1000);
    const f1 = encodeFrame({ messageId: MSG.LOCATION, phone: A, serial: 101, body: encodeLocation(fix({ recordedAt: t1 })) });
    for (const byte of f1) {
      d.sendRaw(Buffer.from([byte]));
    }
    assert.equal(await d.waitForAck(MSG.LOCATION, 101), 0);
    const f2 = encodeFrame({ messageId: MSG.LOCATION, phone: A, serial: 102, body: encodeLocation(fix({ recordedAt: t2 })) });
    const f3 = encodeFrame({ messageId: MSG.HEARTBEAT, phone: A, serial: 103 });
    d.sendRaw(Buffer.concat([f2, f3]));
    assert.equal(await d.waitForAck(MSG.LOCATION, 102), 0);
    assert.equal(await d.waitForAck(MSG.HEARTBEAT, 103), 0);
    assert.equal(site.positions.length, 2);
  });
  it("ignores a corrupted frame and keeps serving the connection", async () => {
    const d = await login(A);
    const bad = encodeFrame({ messageId: MSG.HEARTBEAT, phone: A, serial: 5 });
    bad[bad.length - 2] ^= 0xff; // break the checksum
    d.sendRaw(bad);
    const serial = d.send(MSG.HEARTBEAT);
    assert.equal(await d.waitForAck(MSG.HEARTBEAT, serial), 0);
    assert.equal(g.gps.counters.framesBad.checksum, 1);
  });
  it("disconnects a peer that sends nothing but garbage frames", async () => {
    const d = await device(A);
    for (let i = 0; i < 12; i++) d.sendRaw(Buffer.from([0x7e, 0x01, 0x02, 0x03, 0x7e]));
    await sleep(300);
    assert.equal(d.socket.destroyed, true);
  });
  it("drops a connection that streams an oversized frame without ever closing it", async () => {
    const d = await device(A);
    d.sendRaw(Buffer.concat([Buffer.from([0x7e]), Buffer.alloc(6000, 0x41)]));
    await sleep(300);
    assert.equal(d.socket.destroyed, true);
    assert.equal(g.gps.counters.framesBad.overflow, 1);
  });
  it("rate-limits a peer flooding messages", async () => {
    await g.gps.stop(100);
    g = await startGps(site.base, { maxMessagesPerSecond: 5 });
    const d = await login(A);
    for (let i = 0; i < 100; i++) d.sendRaw(encodeFrame({ messageId: MSG.HEARTBEAT, phone: A, serial: 200 + i }));
    await sleep(500);
    assert.ok(g.gps.counters.rateLimited > 0);
    assert.equal(d.socket.destroyed, true);
  });
  it("enforces the per-address connection limit", async () => {
    await g.gps.stop(100);
    g = await startGps(site.base, { maxConnectionsPerIp: 2 });
    const [d1, d2] = [await device(A), await device(B)];
    const d3 = new SimDevice("013900000009", "127.0.0.1", g.gps.port());
    await d3.connect();
    open.push(d3);
    await sleep(200);
    assert.equal(d3.socket.destroyed, true);
    assert.equal(d1.socket.destroyed || d2.socket.destroyed, false);
    assert.equal(g.gps.counters.connectionsRefused, 1);
  });
  it("rejects the website secret being wrong without storing anything", async () => {
    await g.gps.stop(100);
    g = await startGps(site.base, { ingestSecret: "wrong" });
    const d = new SimDevice(A, "127.0.0.1", g.gps.port());
    await d.connect();
    open.push(d);
    d.send(MSG.AUTH, Buffer.from(codeFor(A)));
    await sleep(300);
    assert.equal(site.positions.length, 0);
  });
});

describe("shutdown", () => {
  it("closes every connection and stops listening", async () => {
    const d = await login(A);
    await g.gps.stop(500);
    await sleep(50);
    assert.equal(d.socket.destroyed, true);
    assert.equal(g.gps.listening, false);
  });
});
