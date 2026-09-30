import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { COLORS, FPS, seconds } from "../theme";
import { SceneScaleContext } from "../timing";
import { CLIENT_VO, CLIENT_VO_DURATION } from "../data/clientVoiceover";
import {
  Hook,
  TheStart,
  Building,
  UnderTheHood,
  TheAiIdea,
  Assistant,
  HowItWorks,
  FinalResult,
  PersonalBrand,
  TheEnd,
} from "./beats";

/**
 * The client story: 1920x1080, exactly 72 seconds, for jambayang.com.
 *
 * The client wrote this one as a shot list — ten beats, each with the words
 * to put on screen and the words to say over them — and asked for it in their
 * own voice, in 16:9, at exactly 72 seconds. All three are held to here: the
 * narration is theirs, spoken and unedited, and TOTAL_FRAMES is asserted at
 * 2160 below rather than left to arithmetic.
 *
 * Where this departs from their table is the beat boundaries, and only there.
 * Their table put, for instance, eight seconds on "the start" and eleven on
 * the assistant; their own lines for those beats take 8.79 and 4.56 seconds to
 * say. Holding the table would have run narration across cuts in half the
 * film. So each beat is instead as long as its line takes, plus a `lead` of
 * picture before the voice and a `hold` of picture after it — the 4.89 seconds
 * the 72-second running time leaves over the 67.11 seconds of speech, spent
 * where the pictures need it: on the assistant answering, on the finished
 * site, and on the closing card. The order, the words and the running time are
 * exactly as asked.
 */
type Beat = {
  name: string;
  /** Ids in CLIENT_VO, in the order they are spoken on this beat. */
  lines: string[];
  /** Seconds of picture before the first word. */
  lead: number;
  /** Seconds of picture after the last word. */
  hold: number;
  Scene: React.FC;
};

export const BEATS: Beat[] = [
  { name: "The hook", lines: ["hook"], lead: 0.5, hold: 0, Scene: Hook },
  { name: "The start", lines: ["start"], lead: 0.15, hold: 0, Scene: TheStart },
  { name: "Building the website", lines: ["building"], lead: 0.15, hold: 0, Scene: Building },
  { name: "Under the hood", lines: ["hood1", "hood2"], lead: 0.15, hold: 0, Scene: UnderTheHood },
  { name: "The AI idea", lines: ["aiIdea"], lead: 0.15, hold: 0, Scene: TheAiIdea },
  { name: "AI travel assistant", lines: ["assistant"], lead: 0.15, hold: 1.7, Scene: Assistant },
  { name: "How it works", lines: ["howItWorks"], lead: 0.15, hold: 0, Scene: HowItWorks },
  { name: "The final result", lines: ["result"], lead: 0.15, hold: 0.45, Scene: FinalResult },
  { name: "Personal brand", lines: ["brand1", "brand2"], lead: 0.15, hold: 0, Scene: PersonalBrand },
  { name: "The end", lines: ["end"], lead: 0.15, hold: 0.89, Scene: TheEnd },
];

const line = (id: string) => {
  const found = CLIENT_VO.find((l) => l.id === id);
  if (!found) throw new Error(`No narration line "${id}" — re-run build-client-vo.mjs`);
  return found;
};

/** How long a beat runs: its lead, its lines as spoken, and its hold. */
const beatSeconds = (beat: Beat) =>
  beat.lead + beat.lines.reduce((acc, id) => acc + (line(id).end - line(id).start), 0) + beat.hold;

const STARTS = BEATS.reduce<number[]>((acc, _, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + beatSeconds(BEATS[i - 1]));
  return acc;
}, []);

export const TOTAL_SECONDS = STARTS[STARTS.length - 1] + beatSeconds(BEATS[BEATS.length - 1]);
export const TOTAL_FRAMES = seconds(TOTAL_SECONDS);

/**
 * The client asked for exactly 72 seconds, so the arithmetic above is checked
 * rather than trusted. Changing any lead or hold without changing another by
 * the same amount fails here, at import, instead of shipping a 71.4-second
 * film that nobody measures.
 */
if (Math.abs(TOTAL_SECONDS - 72) > 0.005) {
  throw new Error(
    `The client story must be exactly 72s; the beat table adds up to ${TOTAL_SECONDS.toFixed(3)}s. ` +
      `Speech is ${CLIENT_VO_DURATION.toFixed(2)}s, so the leads and holds must total ` +
      `${(72 - CLIENT_VO_DURATION).toFixed(2)}s.`
  );
}

/** Beats are written at the length they get, so nothing is time-scaled. */
const SCALE = 1;

/**
 * Each line of narration, trimmed out of the single take and placed on its
 * beat.
 *
 * One `<Audio>` for the whole file would drift: the take has pauses of its own
 * between sentences, and the beats do not. Placing each line means a cut lands
 * where a sentence ends, which is the only arrangement in which the picture
 * and the voice agree for 72 seconds.
 */
const VoiceoverTrack: React.FC = () => (
  <>
    {BEATS.flatMap((beat, i) => {
      let at = STARTS[i] + beat.lead;
      return beat.lines.map((id) => {
        const l = line(id);
        const from = at;
        at += l.end - l.start;
        return (
          <Sequence
            key={`${beat.name}-${id}`}
            name={`VO: ${id}`}
            from={seconds(from)}
            durationInFrames={seconds(l.end - l.start)}
          >
            <Audio
              src={staticFile("audio/client-vo.mp3")}
              startFrom={seconds(l.start)}
              endAt={seconds(l.end)}
            />
          </Sequence>
        );
      });
    })}
  </>
);

/** Every window in which someone is speaking, as [start, end] in seconds. */
const SPEECH: [number, number][] = BEATS.flatMap((beat, i) => {
  let at = STARTS[i] + beat.lead;
  return beat.lines.map((id) => {
    const l = line(id);
    const span: [number, number] = [at, at + (l.end - l.start)];
    at = span[1];
    return span;
  });
});

const MUSIC_BED = 0.62;
const MUSIC_DUCKED = 0.2;

/**
 * The score, ducked under the voice from the same table the voice is placed
 * from, so the two cannot drift apart.
 *
 * Rounded to two decimals on purpose: Remotion compiles this function into a
 * single ffmpeg volume expression with a branch per distinct value, and a
 * value that changes every frame builds an expression ffmpeg refuses to parse.
 */
const Score: React.FC = () => (
  <Audio
    src={staticFile("audio/client-music.mp3")}
    volume={(frame) => {
      const at = frame / FPS;
      const talking = SPEECH.reduce((acc, [start, end]) => {
        const rise = interpolate(at, [start - 0.35, start], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const fall = interpolate(at, [end, end + 0.55], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return Math.max(acc, Math.min(rise, fall));
      }, 0);

      const bed = MUSIC_BED + (MUSIC_DUCKED - MUSIC_BED) * talking;
      const inn = interpolate(at, [0, 1.2], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      const out = interpolate(at, [TOTAL_SECONDS - 2.2, TOTAL_SECONDS - 0.05], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      return Math.round(bed * inn * out * 100) / 100;
    }}
  />
);

/** A short dip to black between beats. Long enough to read as a cut, short
 * enough that nobody waits through it. */
const Cut: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = 5;
  const opacity = STARTS.slice(1).reduce((acc, start) => {
    const at = seconds(start);
    return Math.max(
      acc,
      interpolate(frame, [at - fade, at, at + fade], [0, 1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    );
  }, 0);
  return <AbsoluteFill style={{ background: COLORS.ink, opacity, pointerEvents: "none" }} />;
};

export const ClientStory: React.FC = () => (
  <AbsoluteFill style={{ background: COLORS.ink }}>
    {BEATS.map((beat, i) => (
      <Sequence
        key={beat.name}
        name={beat.name}
        from={seconds(STARTS[i])}
        durationInFrames={seconds(beatSeconds(beat))}
      >
        <SceneScaleContext.Provider value={SCALE}>
          <beat.Scene />
        </SceneScaleContext.Provider>
      </Sequence>
    ))}
    <Cut />
    <Score />
    <VoiceoverTrack />
  </AbsoluteFill>
);
