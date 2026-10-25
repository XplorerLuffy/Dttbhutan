import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FrameError, FrameSplitter, encodeFrame, escape, parseFrame, unescape, xorChecksum } from "../src/protocol/frame";

const hex = (s: string) => Buffer.from(s.replace(/\s/g, ""), "hex");
// Hand-assembled from the spec's header table, not produced by our encoder:
// id 0002, props 0000, phone 013912344321, serial 0001, XOR checksum 7f.
const HEARTBEAT = hex("7e 0002 0000 013912344321 0001 7f 7e");

describe("escaping (spec 2.4.2)", () => {
  it("matches the spec's worked example", () => {
    assert.deepEqual(escape(hex("30 7e 08 7d 55")), hex("30 7d02 08 7d01 55"));
    assert.deepEqual(unescape(hex("30 7d02 08 7d01 55")), hex("30 7e 08 7d 55"));
  });
  it("rejects an invalid escape sequence", () => {
    assert.throws(() => unescape(hex("7d03")), (e) => e instanceof FrameError && e.code === "bad_escape");
    assert.throws(() => unescape(hex("7d")), (e) => e instanceof FrameError && e.code === "bad_escape");
  });
  it("round-trips every byte value", () => {
    const all = Buffer.from(Array.from({ length: 256 }, (_, i) => i));
    assert.deepEqual(unescape(escape(all)), all);
  });
});

describe("checksum and header", () => {
  it("parses a hand-built heartbeat", () => {
    const [raw] = new FrameSplitter().push(HEARTBEAT);
    const f = parseFrame(raw);
    assert.equal(f.messageId, 0x0002);
    assert.equal(f.phone, "013912344321");
    assert.equal(f.serial, 1);
    assert.equal(f.body.length, 0);
  });
  it("XORs everything before the checksum byte", () => {
    assert.equal(xorChecksum(hex("00020000013912344321 0001")), 0x7f);
  });
  it("rejects a wrong checksum", () => {
    const bad = hex("7e 0002 0000 013912344321 0001 7e 7e".replace("7e 7e", "00 7e"));
    const [raw] = new FrameSplitter().push(bad);
    assert.throws(() => parseFrame(raw), (e) => e instanceof FrameError && e.code === "checksum");
  });
  it("rejects a body length that disagrees with the frame", () => {
    const inner = hex("0002 0005 013912344321 0001"); // claims 5 body bytes, has none
    const framed = Buffer.concat([inner, Buffer.from([xorChecksum(inner)])]);
    assert.throws(() => parseFrame(framed), (e) => e instanceof FrameError && e.code === "length_mismatch");
  });
  it("rejects frames too short to hold a header", () => {
    assert.throws(() => parseFrame(hex("0002 0000 01")), (e) => e instanceof FrameError && e.code === "too_short");
  });
  it("rejects RSA-encrypted bodies (bits 10-12)", () => {
    const inner = hex("0200 0400 013912344321 0001");
    const framed = Buffer.concat([inner, Buffer.from([xorChecksum(inner)])]);
    assert.throws(() => parseFrame(framed), (e) => e instanceof FrameError && e.code === "encrypted");
  });
  it("rejects non-BCD phone digits", () => {
    const inner = hex("0002 0000 01af12344321 0001");
    const framed = Buffer.concat([inner, Buffer.from([xorChecksum(inner)])]);
    assert.throws(() => parseFrame(framed), (e) => e instanceof FrameError && e.code === "bad_bcd");
  });
  it("reads the optional sub-package header (bit 13)", () => {
    const body = Buffer.from([0xaa, 0xbb]);
    const inner = Buffer.concat([hex("0200 2002 013912344321 0009 0003 0002"), body]);
    const f = parseFrame(Buffer.concat([inner, Buffer.from([xorChecksum(inner)])]));
    assert.deepEqual(f.subpack, { total: 3, index: 2 });
    assert.deepEqual(f.body, body);
  });
  it("encodes frames that parse back, with escaping where needed", () => {
    const body = hex("7e 7d 01 02");
    const frame = encodeFrame({ messageId: 0x0900, phone: "000000000042", serial: 0x7e7d, body });
    const [raw] = new FrameSplitter().push(frame);
    const f = parseFrame(raw);
    assert.equal(f.serial, 0x7e7d);
    assert.deepEqual(f.body, body);
    assert.equal(f.phone, "000000000042");
  });
});

describe("stream splitting (TCP gives no message boundaries)", () => {
  it("reassembles a frame delivered one byte at a time", () => {
    const s = new FrameSplitter();
    const out: Buffer[] = [];
    for (const b of HEARTBEAT) out.push(...s.push(Buffer.from([b])));
    assert.equal(out.length, 1);
    assert.equal(parseFrame(out[0]).messageId, 2);
  });
  it("splits several frames in one read", () => {
    const three = Buffer.concat([HEARTBEAT, HEARTBEAT, HEARTBEAT]);
    assert.equal(new FrameSplitter().push(three).length, 3);
  });
  it("keeps a partial tail between reads", () => {
    const s = new FrameSplitter();
    const cut = 9;
    assert.equal(s.push(HEARTBEAT.subarray(0, cut)).length, 0);
    assert.equal(s.push(HEARTBEAT.subarray(cut)).length, 1);
  });
  it("ignores bytes outside frames and doubled flags", () => {
    const s = new FrameSplitter();
    const frames = s.push(Buffer.concat([hex("0102"), Buffer.from([0x7e]), HEARTBEAT]));
    assert.equal(frames.length, 1);
    assert.equal(parseFrame(frames[0]).messageId, 2);
    assert.equal(s.strayBytes, 2);
  });
  it("bounds memory: an endless frame sets overflow instead of growing", () => {
    const s = new FrameSplitter(64);
    s.push(Buffer.concat([Buffer.from([0x7e]), Buffer.alloc(200, 0x41)]));
    assert.equal(s.overflow, true);
  });
});
