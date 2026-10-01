import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../theme";
import { useSceneSeconds } from "../timing";
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
 * `pan` is measured off the running homepage, not guessed: the page is 10,034px
 * tall at 1440 wide in a 900px viewport, so a section beginning at y sits at
 * (y − 80) / 9,134 of the travel. Re-measure with
 * `node video/recapture-home.mjs`, which writes the offsets it finds to
 * public/captures/home-sections.json — a label that names a section the window
 * has already left is the failure this guards against, and reordering the
 * homepage is exactly what causes it.
 *
 *     0   header & nav       949  Featured Collections   2532  Journeys Worth the Flight
 *   377   hero              1704  Bhutan, Arranged…      6410  Twenty Dzongkhags
 *                                                        8603  Before You Go
 *
 * Six stops, because the scene's slot in the cut is six stops long. The value
 * band is the one left out: it argues rather than shows, and the five that
 * remain are the ones worth watching.
 */
const STOPS: { label: string; pan: number }[] = [
  { label: "Header & navigation", pan: 0 },
  { label: "Hero", pan: 0.01 },
  { label: "Featured collections", pan: 0.095 },
  { label: "Featured tours", pan: 0.269 },
  { label: "Destinations", pan: 0.693 },
  { label: "Travel guide & footer", pan: 0.933 },
];

/** When the window arrives at each stop, and how long it rests there. */
const ARRIVE = (i: number) => 0.7 + i * 2.0;
const REST = 1.2;

export const Design: React.FC = () => {
  const t = useSceneSeconds();
  const frame = useCurrentFrame();

  // Two keyframes per stop — arrive, then hold — so the move between them is
  // short and the look is long, rather than one unbroken drift.
  const panStops: [number, number][] = STOPS.flatMap(({ pan }, i) => [
    [t(ARRIVE(i)), pan],
    [t(ARRIVE(i) + REST), pan],
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
              [t(arrive - 0.3), t(arrive + 0.1), t(arrive + REST), t(arrive + REST + 0.4)],
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
      <Sequence durationInFrames={t(3.6)}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 22 }}>
          <SectionTitle from={t(0.3)} until={t(2.6)} size={36}>
            The goal was simple: make discovering Bhutan feel intuitive.
          </SectionTitle>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
