import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FrameSplitter, parseFrame } from "../src/protocol/frame";
import {
  encodeLocation,
  encodeLocationBatch,
  parseBcdTime,
  parseLocation,
  parseLocationBatch,
  parseRegistration,
} from "../src/protocol/messages";

const hex = (s: string) => Buffer.from(s.replace(/\s/g, ""), "hex");

// Assembled by hand from Tables 16/17 (see the commit notes): alarm 0, status 3
// (ACC on + located), lat 27.471200, lon 89.633900, altitude 2300 m, speed 35.5
// km/h, heading 45, time 26-10-25 10:30:00 (GMT+8).
const LOCATION_FRAME = hex("7e0200001c0139123443210007000000000000000301a32d600557b46c08fc0163002d2610251030008b7e");
const LOCATION_BODY = hex("000000000000000301a32d600557b46c08fc0163002d261025103000");

describe("0x0200 location report", () => {
  it("decodes a hand-assembled frame", () => {
    const f = parseFrame(new FrameSplitter().push(LOCATION_FRAME)[0]);
    assert.equal(f.messageId, 0x0200);
    assert.equal(f.serial, 7);
    const loc = parseLocation(f.body, 480);
    assert.equal(loc.latitude, 27.4712);
    assert.equal(loc.longitude, 89.6339);
    assert.equal(loc.altitudeM, 2300);
    assert.equal(loc.speedKmh, 35.5);
    assert.equal(loc.heading, 45);
    assert.equal(loc.located, true);
    assert.equal(loc.accOn, true);
    assert.equal(loc.recordedAt.toISOString(), "2026-10-25T02:30:00.000Z"); // 10:30 at GMT+8
  });
  it("applies a different device time zone only when configured", () => {
    assert.equal(parseLocation(LOCATION_BODY, 0).recordedAt.toISOString(), "2026-10-25T10:30:00.000Z");
    assert.equal(parseLocation(LOCATION_BODY, 360).recordedAt.toISOString(), "2026-10-25T04:30:00.000Z"); // Bhutan, GMT+6
  });
  it("uses status bits 2 and 3 for south and west", () => {
    const south = parseLocation(encodeLocation({ latitude: -12.5, longitude: 30.25, recordedAt: new Date() }), 480);
    assert.equal(south.latitude, -12.5);
    assert.equal(south.longitude, 30.25);
    const west = parseLocation(encodeLocation({ latitude: 12.5, longitude: -30.25, recordedAt: new Date() }), 480);
    assert.equal(west.latitude, 12.5);
    assert.equal(west.longitude, -30.25);
  });
  it("reports an unlocated fix and a clear ACC bit", () => {
    const loc = parseLocation(encodeLocation({ latitude: 27, longitude: 89, recordedAt: new Date(), located: false }), 480);
    assert.equal(loc.located, false);
    assert.equal(loc.accOn, false);
  });
  it("flags encrypted coordinates (status bit 5) instead of using them", () => {
    const b = Buffer.from(LOCATION_BODY);
    b.writeUInt32BE(b.readUInt32BE(4) | (1 << 5), 4);
    assert.equal(parseLocation(b, 480).coordinatesEncrypted, true);
  });
  it("reads the odometer extra (id 0x01, 1/10 km) and skips unknown extras", () => {
    const withOdo = Buffer.concat([LOCATION_BODY, hex("01 04 00 01 e2 40"), hex("30 01 1f")]);
    const loc = parseLocation(withOdo, 480);
    assert.equal(loc.odometerKm, 12345.6);
    assert.equal(loc.extrasMalformed, false);
  });
  it("keeps the basic fix but flags a truncated extra", () => {
    const loc = parseLocation(Buffer.concat([LOCATION_BODY, hex("01 04 00 01")]), 480);
    assert.equal(loc.latitude, 27.4712);
    assert.equal(loc.extrasMalformed, true);
  });
  it("rejects a body shorter than the 28-byte basic block", () => {
    assert.throws(() => parseLocation(LOCATION_BODY.subarray(0, 27), 480));
  });
  it("rejects an impossible date", () => {
    assert.throws(() => parseBcdTime(hex("26 02 30 10 00 00"), 480)); // 30 Feb
    assert.throws(() => parseBcdTime(hex("26 13 01 10 00 00"), 480)); // month 13
    assert.throws(() => parseBcdTime(hex("26 10 25 24 00 00"), 480)); // hour 24
    assert.throws(() => parseBcdTime(hex("26 1a 25 10 00 00"), 480)); // not BCD
  });
});

describe("0x0704 batch (stored positions)", () => {
  it("splits blocks and reports the type", () => {
    const b = parseLocationBatch(encodeLocationBatch(1, [LOCATION_BODY, LOCATION_BODY]));
    assert.equal(b.type, 1);
    assert.equal(b.blocks.length, 2);
    assert.deepEqual(b.blocks[0], LOCATION_BODY);
  });
  it("rejects a count that does not match the blocks, trailing bytes, or a bad length", () => {
    const good = encodeLocationBatch(0, [LOCATION_BODY]);
    const wrongCount = Buffer.from(good);
    wrongCount.writeUInt16BE(2, 0);
    assert.throws(() => parseLocationBatch(wrongCount));
    assert.throws(() => parseLocationBatch(Buffer.concat([good, Buffer.from([0])])));
    const badLen = Buffer.from(good);
    badLen.writeUInt16BE(500, 3);
    assert.throws(() => parseLocationBatch(badLen));
    assert.throws(() => parseLocationBatch(hex("0000 00")));
  });
});

describe("0x0100 registration", () => {
  it("needs the fixed part of the body", () => {
    assert.throws(() => parseRegistration(Buffer.alloc(10)));
    assert.equal(parseRegistration(Buffer.concat([hex("0011 0022"), Buffer.from("DTT01"), Buffer.alloc(20)])).manufacturerId, "DTT01");
  });
});
