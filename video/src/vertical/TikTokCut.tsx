import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { COLORS, FPS, seconds } from "../theme";
import { SceneScaleContext } from "../timing";
import { VERTICAL_VO } from "../data/verticalVoiceover";
import { Hook, Platform, Backend, Turn, Assistant, Knowledge, Answer, Everywhere, CallToAction } from "./beats";

/**
 * The vertical cut: 1080x1920, about fifty seconds, for TikTok.
 *
 * Not a crop of the landscape film — a different film from the same material.
 * Three things had to change and none of them are cosmetic:
 *
 *   It opens on the product, moving, at frame one. The landscape film earns
 *   its slow open; a vertical feed does not give you eight seconds of black.
 *
 *   The pictures are captures of the site at phone width, not desktop
 *   screenshots shrunk. A 16:9 capture in a 9:16 frame is a third of the
 *   height with nothing legible in it.
 *
 *   Every line is on screen as well as in the ear, because most people meet
 *   a TikTok muted, and the picture and caption both stay inside the area
 *   TikTok's own interface does not cover.
 *
 * It ends by asking for work, which the landscape film does not, because that
 * is what this one is for.
 */
type Beat = {
  name: string;
  /** Matches an id in VERTICAL_VO. */
  vo: string;
  duration: number;
  /** Seconds of picture before the voice starts on it. */
  lead: number;
  Scene: React.FC;
};

export const BEATS: Beat[] = [
  { name: "The hook", vo: "hook", duration: 3.4, lead: 0.15, Scene: Hook },
  { name: "The platform", vo: "platform", duration: 7.3, lead: 0.3, Scene: Platform },
  { name: "The backend", vo: "backend", duration: 7.0, lead: 0.3, Scene: Backend },
  { name: "The turn", vo: "turn", duration: 2.5, lead: 0.3, Scene: Turn },
  { name: "The assistant", vo: "ai", duration: 5.3, lead: 0.3, Scene: Assistant },
  { name: "Its knowledge", vo: "knowledge", duration: 9.0, lead: 0.3, Scene: Knowledge },
  { name: "The answer", vo: "rag", duration: 7.7, lead: 0.3, Scene: Answer },
  { name: "On every page", vo: "everywhere", duration: 2.0, lead: 0.3, Scene: Everywhere },
  { name: "The ask", vo: "cta", duration: 6.0, lead: 0.3, Scene: CallToAction },
];

const STARTS = BEATS.reduce<number[]>((acc, b, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + BEATS[i - 1].duration);
  return acc;
}, []);

export const VERTICAL_SECONDS = STARTS[STARTS.length - 1] + BEATS[BEATS.length - 1].duration;
export const VERTICAL_FRAMES = seconds(VERTICAL_SECONDS);

/** Beats are written at the length they get, so nothing is time-scaled here —
 * but the context still has to be provided, because the components underneath
 * read their timings through it. */
const SCALE = 1;

/** Each line of narration, trimmed out of the single take and placed on its
 * beat. Same reasoning as the landscape film: one placement cannot serve nine
 * beats once each carries a pause of its own. */
const VoiceoverTrack: React.FC = () => (
  <>
    {BEATS.map((beat, i) => {
      const line = VERTICAL_VO.find((l) => l.id === beat.vo);
      if (!line) throw new Error(`No line "${beat.vo}" — re-run build-vertical-vo.mjs`);

      const room = beat.duration - beat.lead - (line.end - line.start);
      if (room < 0) {
        throw new Error(
          `Beat "${beat.name}" is ${beat.duration}s but its line needs ` +
            `${(beat.lead + line.end - line.start).toFixed(2)}s.`
        );
      }

      return (
        <Sequence
          key={beat.vo}
          name={`VO: ${beat.vo}`}
          from={seconds(STARTS[i] + beat.lead)}
          durationInFrames={seconds(line.end - line.start)}
        >
          <Audio
            src={staticFile("audio/vertical-vo.mp3")}
            startFrom={seconds(line.start)}
            endAt={seconds(line.end)}
          />
        </Sequence>
      );
    })}
  </>
);

const MUSIC_BED = 0.7;
const MUSIC_DUCKED = 0.24;

/** Ducked from the same table the voice is placed from, so the two cannot
 * drift apart. Rounded to two decimals because Remotion compiles this into one
 * ffmpeg expression with a branch per distinct value. */
const Score: React.FC = () => {
  const speech = BEATS.map((beat, i) => {
    const line = VERTICAL_VO.find((l) => l.id === beat.vo)!;
    const start = STARTS[i] + beat.lead;
    return [start, start + (line.end - line.start)] as const;
  });

  return (
    <Audio
      src={staticFile("audio/vertical-music.mp3")}
      volume={(f) => {
        const at = f / FPS;
        const talking = speech.reduce((acc, [start, end]) => {
          const rise = interpolate(at, [start - 0.3, start], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const fall = interpolate(at, [end, end + 0.5], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return Math.max(acc, Math.min(rise, fall));
        }, 0);

        const bed = MUSIC_BED + (MUSIC_DUCKED - MUSIC_BED) * talking;
        const out = interpolate(at, [VERTICAL_SECONDS - 1.6, VERTICAL_SECONDS - 0.1], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return Math.round(bed * out * 100) / 100;
      }}
    />
  );
};

/**
 * A fast cut between beats — three frames, not thirteen.
 *
 * The landscape film breathes between chapters. Fifty seconds does not have
 * that to spend, and on a phone a long dip reads as buffering.
 */
const Cut: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = 4;
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

export const TikTokCut: React.FC = () => (
  <AbsoluteFill style={{ background: COLORS.ink }}>
    {BEATS.map(({ name, duration, Scene }, i) => (
      <Sequence key={name} name={name} from={seconds(STARTS[i])} durationInFrames={seconds(duration)}>
        <SceneScaleContext.Provider value={SCALE}>
          <Scene />
        </SceneScaleContext.Provider>
      </Sequence>
    ))}
    <Cut />
    <Score />
    <VoiceoverTrack />
  </AbsoluteFill>
);
