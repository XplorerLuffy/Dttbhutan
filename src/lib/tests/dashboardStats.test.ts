import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { profileCompletion } from "../profileCompletion";
import { travelStats, type BookingLike } from "../travelStats";

describe("profileCompletion", () => {
  it("is 100% with name, email and phone", () => {
    const c = profileCompletion({ name: "Pema Dorji", email: "p@example.com", phone: "+975 17 123 456" });
    assert.deepEqual(c, { percent: 100, filled: 3, total: 3, missing: [], complete: true });
  });
  it("is 67% without a phone, and says what is missing", () => {
    const c = profileCompletion({ name: "Pema", email: "p@example.com", phone: null });
    assert.equal(c.percent, 67);
    assert.deepEqual(c.missing, ["Phone number"]);
    assert.equal(c.complete, false);
  });
  it("treats blank and whitespace as missing", () => {
    assert.equal(profileCompletion({ name: "  ", email: "p@example.com", phone: "" }).percent, 33);
    assert.equal(profileCompletion({}).percent, 0);
  });
});

const NOW = new Date("2026-11-20T10:00:00Z");
const day = (n: number) => new Date(NOW.getTime() + n * 86_400_000);
const b = (status: BookingLike["status"], endInDays: number): BookingLike => ({ status, endDate: day(endInDays) });

describe("travelStats", () => {
  it("counts nothing for a traveler with no bookings", () => {
    assert.deepEqual(travelStats([], NOW), { total: 0, upcoming: 0, completed: 0, saved: 0 });
  });
  it("leaves cancelled bookings out of every count", () => {
    const s = travelStats([b("CANCELLED", 30), b("CANCELLED", -30), b("CONFIRMED", 30)], NOW);
    assert.deepEqual(s, { total: 1, upcoming: 1, completed: 0, saved: 0 });
  });
  it("upcoming is confirmed and not yet over; pending is not upcoming but is a trip", () => {
    const s = travelStats([b("CONFIRMED", 30), b("PENDING", 30), b("CONFIRMED", 0.01)], NOW);
    assert.equal(s.upcoming, 2);
    assert.equal(s.total, 3);
  });
  it("a trip under way (ends later) is still upcoming", () => {
    assert.equal(travelStats([b("CONFIRMED", 2)], NOW).upcoming, 1);
  });
  it("completed is marked completed, or confirmed and past its end", () => {
    const s = travelStats([b("COMPLETED", -10), b("CONFIRMED", -1), b("CONFIRMED", 5), b("PENDING", -1)], NOW);
    assert.equal(s.completed, 2);
    assert.equal(s.upcoming, 1);
    assert.equal(s.total, 4);
  });
  it("a booking is never both upcoming and completed", () => {
    const list = [b("CONFIRMED", 5), b("CONFIRMED", -5), b("COMPLETED", -9), b("COMPLETED", 5)];
    const s = travelStats(list, NOW);
    assert.ok(s.upcoming + s.completed <= s.total);
  });
  it("passes saved trips through, 0 by default", () => {
    assert.equal(travelStats([], NOW).saved, 0);
    assert.equal(travelStats([], NOW, 4).saved, 4);
  });
});
