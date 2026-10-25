import { FrameError } from "./frame";

export const MSG = {
  TERMINAL_COMMON_REPLY: 0x0001,
  HEARTBEAT: 0x0002,
  REGISTER: 0x0100,
  AUTH: 0x0102,
  LOCATION: 0x0200,
  LOCATION_BATCH: 0x0704,
  PLATFORM_COMMON_REPLY: 0x8001,
  REGISTER_REPLY: 0x8100,
} as const;

export const RESULT = { OK: 0, FAILED: 1, BAD_MESSAGE: 2, NOT_SUPPORTED: 3 } as const;

export function platformCommonReply(answerSerial: number, answerId: number, result: number): Buffer {
  const b = Buffer.alloc(5);
  b.writeUInt16BE(answerSerial, 0);
  b.writeUInt16BE(answerId, 2);
  b.writeUInt8(result, 4);
  return b;
}

/** 0x8100. Result 0 = success and carries the authentication code (§7.5). */
export function registerReply(answerSerial: number, result: number, authCode?: string): Buffer {
  const head = Buffer.alloc(3);
  head.writeUInt16BE(answerSerial, 0);
  head.writeUInt8(result, 2);
  return result === 0 && authCode ? Buffer.concat([head, Buffer.from(authCode, "ascii")]) : head;
}

export type Registration = { manufacturerId: string };

/**
 * 0x0100. Only the manufacturer id is read, and only to log it. The spec text
 * lays the fixed part out as 2+2+5+8+7+1 = 25 bytes (JT808-2011); JT808-2013
 * uses a 20-byte terminal model. Both start with province, city and the
 * 5-byte manufacturer id, so those offsets are the same either way. The
 * platform identifies the device from the header phone number, not this body.
 */
export function parseRegistration(body: Buffer): Registration {
  if (body.length < 25) throw new FrameError("bad_body", "registration body too short");
  return { manufacturerId: body.subarray(4, 9).toString("ascii").replace(/[^\x20-\x7e]/g, "") };
}

export function parseAuthCode(body: Buffer): string {
  if (body.length === 0 || body.length > 64) throw new FrameError("bad_body", "authentication code length");
  return body.toString("ascii");
}

export type Location = {
  alarmFlags: number;
  statusFlags: number;
  latitude: number;
  longitude: number;
  altitudeM: number;
  speedKmh: number;
  heading: number;
  /** The timestamp as reported, interpreted in the configured device time zone. */
  recordedAt: Date;
  located: boolean;
  accOn: boolean;
  coordinatesEncrypted: boolean;
  odometerKm?: number;
  extrasMalformed: boolean;
};

function bcdByte(b: number): number {
  const hi = b >> 4;
  const lo = b & 0x0f;
  if (hi > 9 || lo > 9) throw new FrameError("bad_bcd");
  return hi * 10 + lo;
}

/** BCD[6] YY-MM-DD-hh-mm-ss in the device's local zone (the spec says GMT+8) -> UTC instant. */
export function parseBcdTime(bytes: Buffer, tzOffsetMinutes: number): Date {
  const [yy, mo, dd, hh, mi, ss] = [...bytes].map(bcdByte);
  const utc = Date.UTC(2000 + yy, mo - 1, dd, hh, mi, ss);
  const d = new Date(utc);
  // Date.UTC rolls 31 Feb into March; a real device never sends that.
  if (mo < 1 || mo > 12 || d.getUTCMonth() !== mo - 1 || d.getUTCDate() !== dd || hh > 23 || mi > 59 || ss > 59) {
    throw new FrameError("bad_body", "invalid timestamp");
  }
  return new Date(utc - tzOffsetMinutes * 60_000);
}

export function encodeBcdTime(date: Date, tzOffsetMinutes: number): Buffer {
  const d = new Date(date.getTime() + tzOffsetMinutes * 60_000);
  const parts = [d.getUTCFullYear() % 100, d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()];
  return Buffer.from(parts.map((n) => ((Math.floor(n / 10) & 0x0f) << 4) | n % 10));
}

/**
 * 0x0200 body (Tables 16-19). Offsets: alarm 0, status 4, latitude 8,
 * longitude 12, altitude 16, speed 18, heading 20 (WORD), time 22. The spec's
 * table prints the heading at 20 and the time at 21; the fields' own sizes
 * (WORD, BCD[6]) put the time at 22, which is what is used and tested.
 */
export function parseLocation(body: Buffer, tzOffsetMinutes: number): Location {
  if (body.length < 28) throw new FrameError("bad_body", "location body shorter than 28 bytes");
  const alarmFlags = body.readUInt32BE(0);
  const statusFlags = body.readUInt32BE(4);
  let latitude = body.readUInt32BE(8) / 1e6;
  let longitude = body.readUInt32BE(12) / 1e6;
  const altitudeM = body.readUInt16BE(16);
  const speedKmh = body.readUInt16BE(18) / 10;
  const heading = body.readUInt16BE(20);
  const recordedAt = parseBcdTime(body.subarray(22, 28), tzOffsetMinutes);

  if (statusFlags & (1 << 2)) latitude = -latitude;
  if (statusFlags & (1 << 3)) longitude = -longitude;

  let odometerKm: number | undefined;
  let extrasMalformed = false;
  let i = 28;
  while (i < body.length) {
    if (i + 2 > body.length) {
      extrasMalformed = true;
      break;
    }
    const id = body[i];
    const len = body[i + 1];
    if (i + 2 + len > body.length) {
      extrasMalformed = true;
      break;
    }
    if (id === 0x01 && len === 4) odometerKm = body.readUInt32BE(i + 2) / 10;
    i += 2 + len;
  }

  return {
    alarmFlags,
    statusFlags,
    latitude,
    longitude,
    altitudeM,
    speedKmh,
    heading,
    recordedAt,
    located: (statusFlags & (1 << 1)) !== 0,
    accOn: (statusFlags & 1) !== 0,
    coordinatesEncrypted: (statusFlags & (1 << 5)) !== 0,
    odometerKm,
    extrasMalformed,
  };
}

export function encodeLocation(args: {
  latitude: number;
  longitude: number;
  recordedAt: Date;
  speedKmh?: number;
  heading?: number;
  located?: boolean;
  accOn?: boolean;
  alarmFlags?: number;
  odometerKm?: number;
  tzOffsetMinutes?: number;
}): Buffer {
  const base = Buffer.alloc(28);
  let status = 0;
  if (args.accOn) status |= 1;
  if (args.located !== false) status |= 1 << 1;
  if (args.latitude < 0) status |= 1 << 2;
  if (args.longitude < 0) status |= 1 << 3;
  base.writeUInt32BE(args.alarmFlags ?? 0, 0);
  base.writeUInt32BE(status, 4);
  base.writeUInt32BE(Math.round(Math.abs(args.latitude) * 1e6), 8);
  base.writeUInt32BE(Math.round(Math.abs(args.longitude) * 1e6), 12);
  base.writeUInt16BE(0, 16);
  base.writeUInt16BE(Math.round((args.speedKmh ?? 0) * 10), 18);
  base.writeUInt16BE(Math.round(args.heading ?? 0) % 360, 20);
  encodeBcdTime(args.recordedAt, args.tzOffsetMinutes ?? 480).copy(base, 22);
  if (args.odometerKm === undefined) return base;
  const extra = Buffer.alloc(6);
  extra[0] = 0x01;
  extra[1] = 4;
  extra.writeUInt32BE(Math.round(args.odometerKm * 10), 2);
  return Buffer.concat([base, extra]);
}

/**
 * 0x0704 (§8.6): count WORD, type BYTE (0 normal, 1 stored "blind area"
 * data), then count blocks of [length WORD][0x0200 body].
 */
export function parseLocationBatch(body: Buffer): { type: number; blocks: Buffer[] } {
  if (body.length < 3) throw new FrameError("bad_body", "batch too short");
  const count = body.readUInt16BE(0);
  const type = body[2];
  if (count === 0 || count > 200) throw new FrameError("bad_body", "batch count out of range");
  const blocks: Buffer[] = [];
  let i = 3;
  for (let n = 0; n < count; n++) {
    if (i + 2 > body.length) throw new FrameError("bad_body", "batch truncated");
    const len = body.readUInt16BE(i);
    i += 2;
    if (len < 28 || i + len > body.length) throw new FrameError("bad_body", "batch block length");
    blocks.push(body.subarray(i, i + len));
    i += len;
  }
  if (i !== body.length) throw new FrameError("bad_body", "batch has trailing bytes");
  return { type, blocks };
}

export function encodeLocationBatch(type: number, blocks: Buffer[]): Buffer {
  const head = Buffer.alloc(3);
  head.writeUInt16BE(blocks.length, 0);
  head[2] = type;
  const parts: Buffer[] = [head];
  for (const b of blocks) {
    const len = Buffer.alloc(2);
    len.writeUInt16BE(b.length, 0);
    parts.push(len, b);
  }
  return Buffer.concat(parts);
}
