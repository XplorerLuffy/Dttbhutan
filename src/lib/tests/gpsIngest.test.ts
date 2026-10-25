import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ingestPosition, secretMatches, type IngestDb } from "../gps/ingest";
import { haversineDistanceKm, totalTrackDistanceKm } from "../gps/distance";

type Pos = { id: string; deviceId: string; tripId: string | null; recordedAt: Date; latitude: number; longitude: number };

function fakeDb(opts: { status?: string; trip?: { id: string; startedAt: Date | null } } = {}) {
  const positions: Pos[] = [];
  const db: IngestDb = {
    findDevice: async (id) => (id === "dev-1" ? { id: "d1", vehicleId: "v1", status: opts.status ?? "ACTIVE" } : null),
    findActiveTrip: async () => opts.trip ?? null,
    findPosition: async (deviceId, recordedAt) => positions.find((p) => p.deviceId === deviceId && +p.recordedAt === +recordedAt) ?? null,
    createPosition: async (d) => {
      const p = { id: `p${positions.length}`, ...d } as Pos;
      positions.push(p);
      return p;
    },
  };
  return { db, positions };
}
const input = (over = {}) => ({ deviceIdentifier: "dev-1", latitude: 27.47, longitude: 89.63, recordedAt: new Date("2026-10-25T02:30:00Z"), ...over });

describe("ingestPosition", () => {
  it("stores a position (201) and attaches the active trip", async () => {
    const { db, positions } = fakeDb({ trip: { id: "t1", startedAt: new Date("2026-10-25T00:00:00Z") } });
    const r = await ingestPosition(db, input());
    assert.equal(r.status, 201);
    assert.equal(positions[0].tripId, "t1");
  });
  it("answers 404 for an unknown device and writes nothing", async () => {
    const { db, positions } = fakeDb();
    assert.equal((await ingestPosition(db, input({ deviceIdentifier: "nope" }))).status, 404);
    assert.equal(positions.length, 0);
  });
  it("refuses an INACTIVE device (403)", async () => {
    const { db, positions } = fakeDb({ status: "INACTIVE" });
    assert.equal((await ingestPosition(db, input())).status, 403);
    assert.equal(positions.length, 0);
  });
  it("treats the same device+recordedAt as a duplicate (200) and stores one row", async () => {
    const { db, positions } = fakeDb();
    assert.equal((await ingestPosition(db, input())).status, 201);
    const again = await ingestPosition(db, input({ latitude: 27.48 }));
    assert.equal(again.status, 200);
    assert.equal(positions.length, 1);
  });
  it("does not attach a position recorded before the trip started", async () => {
    const { db, positions } = fakeDb({ trip: { id: "t1", startedAt: new Date("2026-10-25T03:00:00Z") } });
    await ingestPosition(db, input());
    assert.equal(positions[0].tripId, null);
  });
  it("attaches when the trip has no recorded start (legacy rows)", async () => {
    const { db, positions } = fakeDb({ trip: { id: "t1", startedAt: null } });
    await ingestPosition(db, input());
    assert.equal(positions[0].tripId, "t1");
  });
});

describe("secretMatches", () => {
  it("accepts only an exact match and never an empty secret", () => {
    assert.equal(secretMatches("s3cret", "s3cret"), true);
    assert.equal(secretMatches("s3cret", "s3cret "), false);
    assert.equal(secretMatches("s3cret", null), false);
    assert.equal(secretMatches(undefined, "anything"), false);
    assert.equal(secretMatches("", ""), false);
  });
});

// Mileage regression: the report sums consecutive points sorted by time. A
// repeated point must not change distance, and arrival order must not matter
// once points are sorted (the report orders by recordedAt).
describe("mileage maths (unchanged by this work)", () => {
  const pts = [
    { latitude: 27.47, longitude: 89.63 },
    { latitude: 27.48, longitude: 89.64 },
    { latitude: 27.49, longitude: 89.65 },
  ];
  it("ignores a duplicated point", () => {
    const withDup = [pts[0], pts[1], pts[1], pts[2]];
    assert.ok(Math.abs(totalTrackDistanceKm(withDup) - totalTrackDistanceKm(pts)) < 1e-9);
  });
  it("matches the leg-by-leg haversine sum and skips dropout legs over 50 km", () => {
    assert.ok(Math.abs(totalTrackDistanceKm(pts) - (haversineDistanceKm(pts[0], pts[1]) + haversineDistanceKm(pts[1], pts[2]))) < 1e-9);
    assert.equal(totalTrackDistanceKm([pts[0], { latitude: 28.5, longitude: 90.5 }]), 0);
  });
});
