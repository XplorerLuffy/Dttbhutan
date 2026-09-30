import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import { COLORS, FONTS, seconds } from "../theme";
import { BrowserFrame } from "../components/BrowserFrame";
import { SectionTitle } from "../components/SectionTitle";

/**
 * 22–35s. The homepage, section by section.
 *
 * The brief lists header, nav, hero, travel content, destinations, CTA and
 * footer — which is the homepage in order. Rather than cutting between seven
 * shots, the window tours the real full-page capture: it moves to a section,
 * rests on it while its name is up, then moves on. Resting matters; a
 * continuous pan over a page nine and a half thousand pixels tall is a blur,
 * and it also lets a label name something the window has already left.
 *
 * `pan` is measured off the running homepage, not guessed: the page is 9,938px
 * tall at 1440 wide in an 894px viewport, so a section beginning at y sits at
 * (y − 80) / 9,044 of the travel.
 *
 *     0   header & nav       853  Bhutan, Arranged Properly    6314  Twenty Dzongkhags
 *   133   hero              1777  Featured Collections         8507  Before You Go
 */
const STOPS: { label: string; pan: number }[] = [
  { label: "Header & navigation", pan: 0 },
  { label: "Hero", pan: 0.006 },
  { label: "Why book with us", pan: 0.086 },
  { label: "Featured tours", pan: 0.188 },
  { label: "Destinations", pan: 0.692 },
  { label: "Travel guide & footer", pan: 0.936 },
];

/** When the window arrives at each stop, and how long it rests there. */
const ARRIVE = (i: number) => 0.7 + i * 2.0;
const REST = 1.2;

export const Design: React.FC = () => {
  const frame = useCurrentFrame();

  // Two keyframes per stop — arrive, then hold — so the move between them is
  // short and the look is long, rather than one unbroken drift.
  const panStops: [number, number][] = STOPS.flatMap(({ pan }, i) => [
    [seconds(ARRIVE(i)), pan],
    [seconds(ARRIVE(i) + REST), pan],
  ]);

  return (
    <AbsoluteFill style={{ background: COLORS.ink }}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingLeft: 300, paddingBottom: 40 }}>
        <BrowserFrame src="home-full" width={1400} height={880} panStops={panStops} />
      </AbsoluteFill>

      {/* The running label, in the empty margin beside the window. It lights as
          the window arrives and dims as it leaves — never naming a section the
          window has already passed. */}
      <AbsoluteFill style={{ alignItems: "flex-start", justifyContent: "center", paddingLeft: 88, paddingBottom: 40 }}>
        <div style={{ width: 250 }}>
          {STOPS.map((stop, i) => {
            const arrive = ARRIVE(i);
            const on = interpolate(
              frame,
              [seconds(arrive - 0.3), seconds(arrive + 0.1), seconds(arrive + REST), seconds(arrive + REST + 0.4)],
              [0, 1, 1, 0.2],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            return (
              <p
                key={stop.label}
                style={{
                  margin: "0 0 20px",
                  font: `600 22px/1.3 ${FONTS.body}`,
                  color: COLORS.text,
                  opacity: on,
                  paddingLeft: 18,
                  borderLeft: `2px solid ${on > 0.5 ? COLORS.gold400 : "transparent"}`,
                }}
              >
                {stop.label}
              </p>
            );
          })}
        </div>
      </AbsoluteFill>

      {/* Below the window, not across it — the brief asks that the site's own
          content not be covered, and the search bar is the site's content. */}
      <Sequence durationInFrames={seconds(3.6)}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 22 }}>
          <SectionTitle from={seconds(0.3)} until={seconds(2.6)} size={36}>
            The goal was simple: make discovering Bhutan feel intuitive.
          </SectionTitle>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
