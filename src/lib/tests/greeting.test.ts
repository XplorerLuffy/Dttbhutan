import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bhutanHour, greetingForHour, initialsOf } from "../greeting";

describe("greetingForHour", () => {
  it("morning 5-11, afternoon 12-16, evening 17-4", () => {
    const at = (h: number) => greetingForHour(h);
    assert.equal(at(5), "Good morning");
    assert.equal(at(11), "Good morning");
    assert.equal(at(12), "Good afternoon");
    assert.equal(at(16), "Good afternoon");
    assert.equal(at(17), "Good evening");
    assert.equal(at(23), "Good evening");
    assert.equal(at(0), "Good evening");
    assert.equal(at(4), "Good evening");
  });
  it("gives every hour of the day a greeting", () => {
    for (let h = 0; h < 24; h++) assert.match(greetingForHour(h), /^Good (morning|afternoon|evening)$/);
  });
});

describe("bhutanHour", () => {
  it("is UTC+6, wrapping past midnight", () => {
    assert.equal(bhutanHour(new Date("2026-11-20T06:00:00Z")), 12);
    assert.equal(bhutanHour(new Date("2026-11-20T20:30:00Z")), 2);
    assert.equal(bhutanHour(new Date("2026-11-20T18:00:00Z")), 0);
  });
});

describe("initialsOf", () => {
  it("uses the first and last words", () => {
    assert.equal(initialsOf("Jambayang Singye"), "JS");
    assert.equal(initialsOf("Karma Wangchuk Dorji"), "KD");
    assert.equal(initialsOf("  pema  "), "P");
    assert.equal(initialsOf("zoë núñez"), "ZN");
  });
  it("copes with an empty name", () => {
    assert.equal(initialsOf(""), "?");
    assert.equal(initialsOf("   "), "?");
  });
});
