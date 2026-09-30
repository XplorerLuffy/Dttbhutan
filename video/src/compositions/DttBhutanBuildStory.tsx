import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { COLORS, seconds } from "../theme";

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
 * The film, in the order it was built.
 *
 * The timings are the brief's, to the second. They are written here as start
 * and end times rather than durations so the table can be read against the
 * script without arithmetic, and so a scene that grows cannot silently push
 * everything after it out of sync.
 *
 * Two of the brief's sixteen beats share a scene each, which is why there are
 * fourteen files: "The website was working" (88–98s) opens AIIntroduction,
 * because the pivot and the idea it leads to are one thought and a cut between
 * them would break it; and "Final product" (185–205s) and the closing titles
 * (205–220s) are both Finale, for the same reason.
 */
type Chapter = { name: string; start: number; end: number; Scene: React.FC };

export const CHAPTERS: Chapter[] = [
  { name: "The idea", start: 0, end: 10, Scene: Idea },
  { name: "Starting the website", start: 10, end: 22, Scene: WebsiteFoundation },
  { name: "Designing the experience", start: 22, end: 35, Scene: Design },
  { name: "Building the travel experience", start: 35, end: 50, Scene: TravelExperience },
  { name: "Backend", start: 50, end: 65, Scene: Backend },
  { name: "Database", start: 65, end: 78, Scene: Database },
  { name: "Authentication and users", start: 78, end: 88, Scene: Authentication },
  { name: "The website was working / the AI idea", start: 88, end: 110, Scene: AIIntroduction },
  { name: "Building the AI assistant", start: 110, end: 125, Scene: AIBuild },
  { name: "Teaching the AI about Bhutan", start: 125, end: 145, Scene: Knowledge },
  { name: "RAG", start: 145, end: 160, Scene: RAG },
  { name: "Memory and context", start: 160, end: 172, Scene: Memory },
  { name: "Integrating AI into DTT Bhutan", start: 172, end: 185, Scene: Integration },
  { name: "Final product and titles", start: 185, end: 220, Scene: Finale },
];

export const TOTAL_SECONDS = CHAPTERS[CHAPTERS.length - 1].end;
export const TOTAL_FRAMES = seconds(TOTAL_SECONDS);

/**
 * A short dip to black across each cut.
 *
 * Scenes are rendered back to back with no overlap, so without this every
 * chapter change is a hard cut. Half a second of black at each boundary is what
 * makes fourteen separate pieces read as chapters of one film rather than a
 * playlist — and it covers the moment a new set of captures is decoded.
 */
const Dissolve: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = seconds(0.42);

  const opacity = CHAPTERS.slice(1).reduce((acc, chapter) => {
    const at = seconds(chapter.start);
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
    {CHAPTERS.map(({ name, start, end, Scene }) => (
      <Sequence
        key={name}
        name={name}
        from={seconds(start)}
        durationInFrames={seconds(end - start)}
      >
        <Scene />
      </Sequence>
    ))}
    <Dissolve />
  </AbsoluteFill>
);
