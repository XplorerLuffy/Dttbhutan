import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveDepartureBooking, type DepartureFacts } from "../departureBooking";
import { safeNextPath } from "../safeNext";

const itin = { id: "i1", pricePerPerson: 1000, maxGroupSize: 12 as number | null };
const dep = (over: Partial<DepartureFacts> = {}): DepartureFacts => ({
  itineraryId: "i1",
  startDate: new Date("2026-11-16T00:00:00Z"),
  endDate: new Date("2026-11-20T00:00:00Z"),
  priceOverride: null,
  status: "OPEN",
  ...over,
});
const NOW = new Date("2026-11-10T09:00:00Z");

describe("resolveDepartureBooking", () => {
  it("uses the departure's dates and the package price when there is no override", () => {
    const r = resolveDepartureBooking(dep(), itin, 2, NOW);
    assert.deepEqual(r, { ok: true, startDate: new Date("2026-11-16T00:00:00Z"), endDate: new Date("2026-11-20T00:00:00Z"), pricePerPerson: 1000 });
  });
  it("prefers the departure's own price (a peak week)", () => {
    const r = resolveDepartureBooking(dep({ priceOverride: 1450 }), itin, 2, NOW);
    assert.equal(r.ok && r.pricePerPerson, 1450);
  });
  it("accepts a LIMITED departure, refuses SOLD_OUT and CANCELLED", () => {
    assert.equal(resolveDepartureBooking(dep({ status: "LIMITED" }), itin, 2, NOW).ok, true);
    assert.equal(resolveDepartureBooking(dep({ status: "SOLD_OUT" }), itin, 2, NOW).ok, false);
    assert.equal(resolveDepartureBooking(dep({ status: "CANCELLED" }), itin, 2, NOW).ok, false);
  });
  it("refuses a departure that belongs to another package", () => {
    assert.equal(resolveDepartureBooking(dep({ itineraryId: "other" }), itin, 2, NOW).ok, false);
  });
  it("allows booking on the start day, refuses once it has passed", () => {
    assert.equal(resolveDepartureBooking(dep(), itin, 2, new Date("2026-11-16T23:00:00Z")).ok, true);
    assert.equal(resolveDepartureBooking(dep(), itin, 2, new Date("2026-11-17T01:00:00Z")).ok, false);
  });
  it("enforces the maximum group size", () => {
    assert.equal(resolveDepartureBooking(dep(), itin, 12, NOW).ok, true);
    const r = resolveDepartureBooking(dep(), itin, 13, NOW);
    assert.equal(r.ok, false);
    assert.equal(resolveDepartureBooking(dep(), { ...itin, maxGroupSize: null }, 30, NOW).ok, true);
  });
});

describe("safeNextPath", () => {
  it("keeps a path on this site, with query and hash", () => {
    assert.equal(safeNextPath("/packages/x?departure=d1&adults=2#dates"), "/packages/x?departure=d1&adults=2#dates");
  });
  it("refuses anything that could leave the site", () => {
    for (const bad of ["//evil.com", "https://evil.com", "/\\evil.com", "javascript:alert(1)", "evil.com", "", "/a\nb"]) {
      assert.equal(safeNextPath(bad), null, bad);
    }
    assert.equal(safeNextPath(null), null);
    assert.equal(safeNextPath("/" + "a".repeat(600)), null);
  });
});
