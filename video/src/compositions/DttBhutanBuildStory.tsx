import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { COLORS, FPS, seconds } from "../theme";
import { SceneScaleContext } from "../timing";
import { VOICEOVER } from "../data/voiceoverTiming";

import { Idea } from "../scenes/Idea";
import { WebsiteFoundation } from "../scenes/WebsiteFoundation";
import { Design } from "../scenes/Design";
import { TravelExperience } from "../scenes/TravelExperience";
import { Backend } from "../scenes/Backend";
import { Database } from "../scenes/Database";
import { Authentication } from "../scenes/Authentication";
import { AIIntroduction } from "../scenes/AIIntroduction";
import { AIBuild } from "../scenes/AIBuild";
import { Knowledge } from "../scenes/Knowledge";
import { RAG } from "../scenes/RAG";
import { Memory } from "../scenes/Memory";
import { Integration } from "../scenes/Integration";
import { Finale } from "../scenes/Finale";

/**
 * The film, cut to the narration.
 *
 * `written` is how long the scene was choreographed for — the brief's original
 * timings. `duration` is how long it gets in this two-minute cut. Scenes read
 * their own timings through SceneScaleContext, so the ratio between the two
 * speeds a scene up without rewriting a single one of its moves.
 *
 * `duration` is not chosen freely: it is what the voiceover line needs, plus a
 * beat before the voice starts and a beat after it stops. VOICEOVER holds when
 * each line is actually spoken (measured off the audio by
 * build-vo-timing.mjs), and `lead` is the pause before it, so the picture is
 * always on screen slightly before the sentence about it. That is what makes
 * this a cut rather than a compression: the chapters are the length the
 * sentences are.
 */
type Chapter = {
  name: string;
  /** Matches an id in VOICEOVER. */
  vo: string;
  /** Seconds this chapter runs in the cut. */
  duration: number;
  /** Seconds the scene was originally choreographed for. */
  written: number;
  /** Seconds of picture before the voice starts on it. */
  lead: number;
  Scene: React.FC;
};

export const CHAPTERS: Chapter[] = [
  { name: "The idea", vo: "idea", duration: 8.0, written: 10, lead: 1.2, Scene: Idea },
  { name: "Starting the website", vo: "foundation", duration: 8.6, written: 12, lead: 0.4, Scene: WebsiteFoundation },
  { name: "Designing the experience", vo: "design", duration: 8.2, written: 13, lead: 0.5, Scene: Design },
  { name: "Building the travel experience", vo: "travel", duration: 10.4, written: 15, lead: 0.4, Scene: TravelExperience },
  { name: "Backend", vo: "backend", duration: 8.2, written: 15, lead: 0.4, Scene: Backend },
  { name: "Database", vo: "database", duration: 7.0, written: 13, lead: 0.4, Scene: Database },
  { name: "Authentication and users", vo: "auth", duration: 6.4, written: 10, lead: 0.4, Scene: Authentication },
  { name: "The website was working / the AI idea", vo: "pivot", duration: 9.6, written: 22, lead: 0.5, Scene: AIIntroduction },
  { name: "Building the AI assistant", vo: "aibuild", duration: 7.6, written: 15, lead: 0.4, Scene: AIBuild },
  { name: "Teaching the AI about Bhutan", vo: "knowledge", duration: 10.8, written: 20, lead: 0.4, Scene: Knowledge },
  { name: "RAG", vo: "rag", duration: 7.8, written: 15, lead: 0.4, Scene: RAG },
  { name: "Memory and context", vo: "memory", duration: 5.0, written: 12, lead: 0.6, Scene: Memory },
  { name: "Integrating AI into DTT Bhutan", vo: "integration", duration: 7.4, written: 13, lead: 0.4, Scene: Integration },
  { name: "Final product and titles", vo: "finale", duration: 15.0, written: 35, lead: 0.6, Scene: Finale },
];

/** Running start time of each chapter. */
const STARTS = CHAPTERS.reduce<number[]>((acc, c, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + CHAPTERS[i - 1].duration);
  return acc;
}, []);

export const TOTAL_SECONDS = STARTS[STARTS.length - 1] + CHAPTERS[CHAPTERS.length - 1].duration;
export const TOTAL_FRAMES = seconds(TOTAL_SECONDS);

/**
 * Each line of the narration, placed on its own chapter.
 *
 * The recording is one continuous take, so a single placement cannot serve
 * fourteen chapters: the chapters carry a beat of silence before and after
 * each line, and those beats accumulate — measured, one offset drifted by
 * nearly seven seconds by the end of the film. So the take is cut into its
 * fourteen lines (at the pauses build-vo-timing.mjs measured) and each is put
 * where its chapter is, which is what "cut to the narration" has to mean.
 *
 * The cuts fall in the middle of a real pause, so there is a fifth of a second
 * of silence either side of every line and nothing is clipped.
 */
const VoiceoverTrack: React.FC = () => (
  <>
    {CHAPTERS.map((chapter, i) => {
      const line = VOICEOVER.find((l) => l.id === chapter.vo);
      if (!line) throw new Error(`No voiceover line "${chapter.vo}" — re-run build-vo-timing.mjs`);

      const room = chapter.duration - chapter.lead - (line.end - line.start);
      if (room < 0) {
        throw new Error(
          `Chapter "${chapter.name}" is ${chapter.duration}s but its line needs ` +
            `${(chapter.lead + line.end - line.start).toFixed(2)}s — lengthen it or shorten the line.`
        );
      }

      return (
        <Sequence
          key={chapter.vo}
          name={`VO: ${chapter.vo}`}
          from={seconds(STARTS[i] + chapter.lead)}
          durationInFrames={seconds(line.end - line.start)}
        >
          <Audio
            src={staticFile("audio/voiceover.mp3")}
            startFrom={seconds(line.start)}
            endAt={seconds(line.end)}
          />
        </Sequence>
      );
    })}
  </>
);

/** Music level when nothing is being said, and while it is. The narration is
 * normalised to about -18 LUFS and the score to -22; these bring the score to
 * roughly -25 between lines and -34 under them, which is the separation that
 * lets a voice sit on top of music without either being strained. */
const MUSIC_BED = 0.75;
const MUSIC_DUCKED = 0.26;
/** Seconds the score takes to get out of the way, and to come back. A duck
 * faster than this is audible as a pump; slower and the first words land on
 * full music. */
const DUCK_IN = 0.35;
const DUCK_OUT = 0.6;

/**
 * The score, ducked under the narration.
 *
 * The duck is computed rather than ridden by ear: the composition already knows
 * exactly when every line is spoken, so the envelope is built from the same
 * table the voice track is placed from and cannot drift away from it.
 */
const Score: React.FC = () => {
  const speech = CHAPTERS.map((chapter, i) => {
    const line = VOICEOVER.find((l) => l.id === chapter.vo)!;
    const start = STARTS[i] + chapter.lead;
    return [start, start + (line.end - line.start)] as const;
  });

  return (
    <Audio
      src={staticFile("audio/music.mp3")}
      volume={(f) => {
        const at = f / FPS;

        // How much any line of narration is "on" right now, 0 to 1.
        const talking = speech.reduce((acc, [start, end]) => {
          const rise = interpolate(at, [start - DUCK_IN, start], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const fall = interpolate(at, [end, end + DUCK_OUT], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return Math.max(acc, Math.min(rise, fall));
        }, 0);

        const bed = MUSIC_BED + (MUSIC_DUCKED - MUSIC_BED) * talking;

        const fadeIn = interpolate(at, [0, 2.2], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        const fadeOut = interpolate(at, [TOTAL_SECONDS - 2.6, TOTAL_SECONDS - 0.2], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        // Rounded on purpose. Remotion compiles this function into a single
        // ffmpeg volume expression with one branch per distinct value, and a
        // value that changes on every one of 3,600 frames builds an expression
        // ffmpeg refuses to parse. Two decimals is finer than the ear and
        // keeps the expression to about a hundred branches.
        return Math.round(bed * fadeIn * fadeOut * 100) / 100;
      }}
    />
  );
};

/**
 * A short dip to black across each cut.
 *
 * Scenes run back to back with no overlap, so without this every chapter change
 * is a hard cut. A quarter second of black at each boundary is what makes
 * fourteen pieces read as chapters of one film — and at this length it lands in
 * the pause between two sentences rather than across a word.
 */
const Dissolve: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = seconds(0.26);

  const opacity = STARTS.slice(1).reduce((acc, start) => {
    const at = seconds(start);
    const here = interpolate(frame, [at - fade, at, at + fade], [0, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return Math.max(acc, here);
  }, 0);

  return <AbsoluteFill style={{ background: COLORS.ink, opacity, pointerEvents: "none" }} />;
};

export const DttBhutanBuildStory: React.FC = () => (
  <AbsoluteFill style={{ background: COLORS.ink }}>
    {CHAPTERS.map(({ name, duration, written, Scene }, i) => (
      <Sequence key={name} name={name} from={seconds(STARTS[i])} durationInFrames={seconds(duration)}>
        {/* The scene keeps its own choreography; only the clock changes. */}
        <SceneScaleContext.Provider value={duration / written}>
          <Scene />
        </SceneScaleContext.Provider>
      </Sequence>
    ))}

    <Dissolve />

    <Score />

    <VoiceoverTrack />
  </AbsoluteFill>
);
