import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  MAX_ROOMS,
  canAddRoom,
  defaultRooms,
  newRoom,
  totals,
  validateRooms,
  withAdults,
  withBeds,
} from "../guestRooms";

describe("defaultRooms", () => {
  it("spreads a party evenly, one bed each room", () => {
    assert.deepEqual(defaultRooms(2, 1).map((r) => [r.adults, r.beds]), [[2, 1]]);
    assert.deepEqual(defaultRooms(5, 2).map((r) => r.adults), [3, 2]);
    assert.deepEqual(defaultRooms(4, 4).map((r) => r.adults), [1, 1, 1, 1]);
  });
  it("never makes more rooms than people", () => {
    assert.equal(defaultRooms(2, 6).length, 2);
  });
});

describe("controls clamp instead of reaching a bad value", () => {
  it("adults stay between 1 and 4, and beds follow adults down", () => {
    const r = withBeds(newRoom(2), 2);
    assert.equal(r.beds, 2);
    assert.equal(withAdults(r, 0).adults, 1);
    assert.equal(withAdults(r, 1).beds, 1);
    assert.equal(withAdults(r, 9).adults, 4);
  });
  it("beds stay between 1 and 2, and never above the adults", () => {
    const solo = newRoom(1);
    assert.equal(withBeds(solo, 2).beds, 1);
    assert.equal(withBeds(newRoom(3), 5).beds, 2);
    assert.equal(withBeds(newRoom(3), 0).beds, 1);
  });
});

describe("validateRooms", () => {
  it("accepts a normal configuration", () => {
    assert.deepEqual(validateRooms([newRoom(2)], 8), []);
  });
  it("rejects no rooms, too many rooms, bad counts and over-capacity", () => {
    assert.ok(validateRooms([], null).length > 0);
    assert.ok(validateRooms(Array.from({ length: MAX_ROOMS + 1 }, () => newRoom(1)), null).some((e) => /contact us/.test(e)));
    assert.ok(validateRooms([{ id: "x", adults: 0, beds: 1 }], null).some((e) => /at least one adult/.test(e)));
    assert.ok(validateRooms([{ id: "x", adults: 2, beds: 0 }], null).some((e) => /at least one bed/.test(e)));
    assert.ok(validateRooms([{ id: "x", adults: 3, beds: 3 }], null).some((e) => /contact us/.test(e)));
    assert.ok(validateRooms([{ id: "x", adults: 1, beds: 2 }], null).some((e) => /more beds than adults/.test(e)));
    assert.ok(validateRooms([newRoom(4), newRoom(4), newRoom(2)], 8).some((e) => /at most 8/.test(e)));
  });
  it("lets any group size through when the trip has no maximum", () => {
    assert.deepEqual(validateRooms([newRoom(4), newRoom(4), newRoom(4), newRoom(4)], null), []);
  });
});

describe("rooms and totals", () => {
  it("counts travelers and rooms live", () => {
    assert.deepEqual(totals([newRoom(2), newRoom(1)]), { travelers: 3, rooms: 2 });
  });
  it("stops offering another room at 4 rooms or at the trip's maximum", () => {
    const four = Array.from({ length: 4 }, () => newRoom(1));
    assert.equal(canAddRoom(four, null), false);
    assert.equal(canAddRoom([newRoom(4), newRoom(4)], 8), false);
    assert.equal(canAddRoom([newRoom(2)], 8), true);
  });
});
