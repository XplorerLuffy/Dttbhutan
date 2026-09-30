/**
 * Works out when each line of the voiceover is spoken.
 *
 * Run from video/: node build-vo-timing.mjs
 *
 * The chapters are cut to the narration rather than the narration squeezed into
 * the chapters, so the film needs to know where each paragraph falls in
 * public/audio/voiceover.mp3. Two sources, checked against each other:
 *
 *   1. An estimate from the text — every paragraph's share of the spoken
 *      characters, scaled to the file's real duration. Close, but it drifts,
 *      because "Fifty-nine pages, ninety-eight components" takes longer to say
 *      than its character count suggests.
 *   2. The pauses ffmpeg can actually hear. A paragraph break in this voice is
 *      a gap of a quarter second or more, and there are more of those than
 *      there are paragraphs — sentences pause too — so the estimate is used to
 *      pick which gap each break is.
 *
 * Each estimated boundary snaps to the nearest real gap within a second and a
 * half; anything further out keeps the estimate and is reported, because a
 * silent wrong guess is the thing worth avoiding here.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const AUDIO = "public/audio/voiceover.mp3";

/** The script, one entry per chapter, in order. `text` must match what was
 * actually generated — it is what the estimate is built from. */
const LINES = [
  ["idea", "I wanted to build something for travelers discovering Bhutan. So I started building DTT Bhutan."],
  ["foundation", "I started with the foundation — the website itself. Fifty-nine pages, ninety-eight components, built on Next.js."],
  ["design", "The goal was simple: make discovering Bhutan feel intuitive. The header, the hero, the tours, the destinations, the travel guide."],
  ["travel", "Then I built the actual travel experience. Twenty-nine tour packages. All twenty dzongkhags. Day-by-day itineraries — and a custom tour builder for everything else."],
  ["backend", "Behind the interface, the backend that powers it. Forty API routes, each one validated before it ever touches the database."],
  ["database", "The data had to be structured too. Thirty-four models in Prisma, on PostgreSQL, hosted on Supabase."],
  ["auth", "Accounts and roles — travellers, guides, hotels, transport operators, and the agency itself."],
  ["pivot", "The website was working. But I wasn't finished.\n\nI wanted visitors to have someone they could ask. So I built an AI travel assistant."],
  ["aibuild", "I built it as its own AI layer. One interface, three providers, and eight tools that read real data."],
  ["knowledge", "I didn't want it answering from general AI knowledge. So I built a knowledge layer around Bhutan travel information — fifty-seven documents, chunked, embedded, and searchable."],
  ["rag", "Ask it about the Sustainable Development Fee, and it searches that knowledge first — then answers from what it actually found."],
  ["memory", "It keeps track of the conversation, too."],
  ["integration", "Finally, I brought it into the website. DTT Bhutan now had its own AI travel assistant."],
  ["finale", "From an idea… to a website… to an AI travel assistant built into it.\n\nDTT Bhutan. Built for travelers discovering Bhutan."],
];

const duration = Number(
  execFileSync("ffprobe", [
    "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", AUDIO,
  ]).toString().trim()
);

// Every pause of a quarter second or more.
// ffmpeg reports silencedetect on stderr, so that is the stream to read.
const detect = execFileSync(
  "bash",
  [
    "-c",
    `ffmpeg -hide_banner -i "${AUDIO}" -af silencedetect=noise=-36dB:d=0.24 -f null - 2>&1`,
  ],
  { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }
);
const gaps = [];
{
  const starts = [...detect.matchAll(/silence_start: ([0-9.]+)/g)].map((m) => Number(m[1]));
  const ends = [...detect.matchAll(/silence_end: ([0-9.]+)/g)].map((m) => Number(m[1]));
  for (let i = 0; i < Math.min(starts.length, ends.length); i++) {
    gaps.push({ start: starts[i], end: ends[i], length: ends[i] - starts[i] });
  }
}

/** Speaking time is closer to syllables than to characters, and a digit or an
 * abbreviation is spoken far longer than it is written. Letters count once,
 * and the rest is handled by the snap. */
const weight = (text) => text.replace(/\s+/g, " ").trim().length;
const weights = LINES.map(([, text]) => weight(text));
const totalWeight = weights.reduce((a, b) => a + b, 0);

let cursor = 0;
const rows = LINES.map(([id, text], i) => {
  const estimate = cursor;
  cursor += (weights[i] / totalWeight) * duration;

  if (i === 0) return { id, text, start: 0, snappedTo: "start of file" };

  // The gap nearest the estimate, preferring the longer of two close ones.
  const near = gaps
    .filter((g) => Math.abs(g.start - estimate) <= 1.5)
    .sort((a, b) => Math.abs(a.start - estimate) - Math.abs(b.start - estimate));
  const pick = near[0];

  return {
    id,
    text,
    start: pick ? +( (pick.start + pick.end) / 2 ).toFixed(2) : +estimate.toFixed(2),
    snappedTo: pick ? `gap of ${pick.length.toFixed(2)}s at ${pick.start.toFixed(2)}` : "NO GAP NEARBY — estimate kept",
  };
});

console.log(`voiceover: ${duration.toFixed(2)}s, ${gaps.length} pauses found\n`);
rows.forEach((r, i) => {
  const end = i + 1 < rows.length ? rows[i + 1].start : duration;
  const flag = r.snappedTo.startsWith("NO GAP") ? "  <-- check" : "";
  console.log(
    `${r.id.padEnd(12)} ${r.start.toFixed(2).padStart(6)} -> ${end.toFixed(2).padStart(6)}  (${(end - r.start)
      .toFixed(2)
      .padStart(5)}s)  ${r.snappedTo}${flag}`
  );
});

fs.writeFileSync(
  "src/data/voiceoverTiming.ts",
  `/**
 * When each line of the voiceover is spoken, in seconds into
 * public/audio/voiceover.mp3.
 *
 * GENERATED by video/build-vo-timing.mjs — do not edit by hand. The chapter
 * table reads it so the visuals are cut to the narration rather than the other
 * way round. Re-run after regenerating the voiceover.
 */
export type VoiceoverLine = { id: string; start: number; end: number; text: string };

export const VOICEOVER_DURATION = ${duration.toFixed(3)};

export const VOICEOVER: VoiceoverLine[] = ${JSON.stringify(
    rows.map((r, i) => ({
      id: r.id,
      start: r.start,
      end: i + 1 < rows.length ? rows[i + 1].start : +duration.toFixed(2),
      text: r.text.replace(/\n+/g, " "),
    })),
    null,
    2
  )};
`
);
console.log("\nwrote src/data/voiceoverTiming.ts");
