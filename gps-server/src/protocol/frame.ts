/**
 * JT808 framing (spec §2.4): messages are delimited by 0x7E; inside a frame a
 * literal 0x7E is sent as 0x7D 0x02 and a literal 0x7D as 0x7D 0x01. The last
 * byte before the closing flag is an XOR checksum over everything between the
 * flags that precedes it (header + body).
 */
export const FLAG = 0x7e;
const ESC = 0x7d;

export class FrameError extends Error {
  constructor(
    public readonly code:
      | "bad_escape"
      | "too_short"
      | "checksum"
      | "length_mismatch"
      | "bad_bcd"
      | "encrypted"
      | "bad_body",
    message?: string
  ) {
    super(message ?? code);
  }
}

export function escape(data: Buffer): Buffer {
  const out: number[] = [];
  for (const b of data) {
    if (b === FLAG) out.push(ESC, 0x02);
    else if (b === ESC) out.push(ESC, 0x01);
    else out.push(b);
  }
  return Buffer.from(out);
}

export function unescape(data: Buffer): Buffer {
  const out: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const b = data[i];
    if (b === ESC) {
      const next = data[++i];
      if (next === 0x02) out.push(FLAG);
      else if (next === 0x01) out.push(ESC);
      else throw new FrameError("bad_escape");
    } else if (b === FLAG) {
      throw new FrameError("bad_escape", "unescaped flag inside frame");
    } else out.push(b);
  }
  return Buffer.from(out);
}

export function xorChecksum(data: Buffer): number {
  let x = 0;
  for (const b of data) x ^= b;
  return x;
}

/**
 * Cuts a TCP byte stream into frames. A TCP read may hold half a frame, one
 * frame, or several; this keeps the partial tail between pushes. The buffer is
 * bounded: a frame that grows past `maxFrameBytes` without a closing flag sets
 * `overflow`, and the caller is expected to drop the connection.
 */
export class FrameSplitter {
  private chunks: number[] = [];
  private inFrame = false;
  overflow = false;
  /** Bytes seen outside any frame (line noise, or the tail of a dropped frame). */
  strayBytes = 0;

  constructor(private readonly maxFrameBytes = 4096) {}

  /** Returns each complete frame's bytes between the flags, still escaped. */
  push(chunk: Buffer): Buffer[] {
    const frames: Buffer[] = [];
    for (const b of chunk) {
      if (b === FLAG) {
        if (this.inFrame && this.chunks.length > 0) {
          frames.push(Buffer.from(this.chunks));
          this.chunks = [];
          this.inFrame = false;
        } else {
          // Opening flag, or two flags in a row (an empty frame): (re)start.
          this.inFrame = true;
          this.chunks = [];
        }
      } else if (this.inFrame) {
        this.chunks.push(b);
        if (this.chunks.length > this.maxFrameBytes) {
          this.overflow = true;
          this.chunks = [];
          this.inFrame = false;
          return frames;
        }
      } else {
        this.strayBytes++;
      }
    }
    return frames;
  }
}

export type Header = {
  messageId: number;
  serial: number;
  /** Terminal mobile number, 12 BCD digits, exactly as sent (leading zeros kept). */
  phone: string;
  bodyLength: number;
  subpack?: { total: number; index: number };
};

export type Frame = Header & { body: Buffer };

function bcdToString(bytes: Buffer): string {
  let s = "";
  for (const b of bytes) {
    const hi = b >> 4;
    const lo = b & 0x0f;
    if (hi > 9 || lo > 9) throw new FrameError("bad_bcd");
    s += `${hi}${lo}`;
  }
  return s;
}

export function stringToBcd(digits: string): Buffer {
  if (!/^\d+$/.test(digits) || digits.length % 2 !== 0) throw new Error("BCD needs an even number of digits");
  const out = Buffer.alloc(digits.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = (Number(digits[2 * i]) << 4) | Number(digits[2 * i + 1]);
  return out;
}

/** Takes the bytes between the flags, still escaped. Validates checksum and length. */
export function parseFrame(escaped: Buffer): Frame {
  const data = unescape(escaped);
  if (data.length < 13) throw new FrameError("too_short");

  const checksum = data[data.length - 1];
  if (xorChecksum(data.subarray(0, data.length - 1)) !== checksum) throw new FrameError("checksum");

  const props = data.readUInt16BE(2);
  const bodyLength = props & 0x03ff;
  const encryption = (props >> 10) & 0x07;
  const hasSubpack = ((props >> 13) & 1) === 1;
  if (encryption !== 0) throw new FrameError("encrypted", "RSA-encrypted bodies are not supported");

  const headerLength = hasSubpack ? 16 : 12;
  if (data.length < headerLength + 1) throw new FrameError("too_short");
  if (data.length !== headerLength + bodyLength + 1) throw new FrameError("length_mismatch");

  return {
    messageId: data.readUInt16BE(0),
    bodyLength,
    phone: bcdToString(data.subarray(4, 10)),
    serial: data.readUInt16BE(10),
    subpack: hasSubpack ? { total: data.readUInt16BE(12), index: data.readUInt16BE(14) } : undefined,
    body: data.subarray(headerLength, headerLength + bodyLength),
  };
}

/** Builds a complete frame (flags included), as the platform sends it or a simulated device does. */
export function encodeFrame(args: { messageId: number; phone: string; serial: number; body?: Buffer }): Buffer {
  const body = args.body ?? Buffer.alloc(0);
  if (body.length > 0x03ff) throw new Error("body too long for a single JT808 frame");
  const header = Buffer.alloc(12);
  header.writeUInt16BE(args.messageId, 0);
  header.writeUInt16BE(body.length, 2);
  stringToBcd(args.phone.padStart(12, "0")).copy(header, 4);
  header.writeUInt16BE(args.serial & 0xffff, 10);
  const inner = Buffer.concat([header, body]);
  const withSum = Buffer.concat([inner, Buffer.from([xorChecksum(inner)])]);
  return Buffer.concat([Buffer.from([FLAG]), escape(withSum), Buffer.from([FLAG])]);
}
