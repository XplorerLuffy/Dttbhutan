import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../theme";
import { useSceneSeconds } from "../timing";
import { BrowserFrame } from "../components/BrowserFrame";
import { Cursor } from "../components/Cursor";
import { SectionTitle } from "../components/SectionTitle";
import { FACTS } from "../data/projectFacts";

/**
 * 35–50s. The path a traveller actually walks: packages → a tour → destinations
 * → build your own.
 *
 * Each cut is preceded by the cursor reaching the thing that leads there, and
 * every destination is a capture of the page that link really opens. No
 * interaction is mimed that the site does not have.
 */

const Card: React.FC<{ children: React.ReactNode; note: string }> = ({ children, note }) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
    {children}
    <p
      style={{
        position: "absolute",
        bottom: 46,
        margin: 0,
        font: `500 20px/1 ${FONTS.mono}`,
        color: COLORS.textFaint,
        letterSpacing: "0.06em",
      }}
    >
      {note}
    </p>
  </AbsoluteFill>
);

export const TravelExperience: React.FC = () => {
  const t = useSceneSeconds();
  /** One step of the journey: listing, tour, destinations, custom. */
  const STEP = t(3.6);
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: COLORS.ink }}>
      {/* 1 — the package listing, with the cursor reaching a tour */}
      <Sequence durationInFrames={STEP}>
        <Card note={`/packages — ${FACTS.packages} published tours`}>
          <BrowserFrame
            src="packages-full"
            width={1500}
            height={940}
            panFrom={0}
            panTo={0.085}
            panOver={[0, STEP]}
          />
          <Cursor
            from={[1500, 980]}
            to={[760, 640]}
            moveOver={[t(0.5), t(2.2)]}
            clickAt={t(2.5)}
            fadeIn={[t(0.3), t(0.7)]}
          />
        </Card>
      </Sequence>

      {/* 2 — the tour it opens */}
      <Sequence from={STEP} durationInFrames={STEP}>
        <Card note="/packages/7-day-essential-bhutan-journey">
          <BrowserFrame
            src="package-detail-full"
            width={1500}
            height={940}
            panFrom={0}
            panTo={0.13}
            panOver={[0, STEP]}
          />
        </Card>
      </Sequence>

      {/* 3 — destinations */}
      <Sequence from={STEP * 2} durationInFrames={STEP}>
        <Card note={`/destinations — all ${FACTS.dzongkhags} dzongkhags`}>
          <BrowserFrame
            src="destinations-full"
            width={1500}
            height={940}
            panFrom={0}
            panTo={0.62}
            panOver={[0, STEP]}
          />
          <Cursor
            from={[1400, 200]}
            to={[620, 700]}
            moveOver={[t(0.6), t(2.3)]}
            clickAt={t(2.6)}
            fadeIn={[t(0.4), t(0.8)]}
          />
        </Card>
      </Sequence>

      {/* 4 — custom tour, the other way through */}
      <Sequence from={STEP * 3} durationInFrames={t(15) - STEP * 3}>
        <Card note="/custom-tour — pick your own guide, stay and vehicle">
          <BrowserFrame
            src="custom-tour-full"
            width={1500}
            height={940}
            panFrom={0}
            panTo={0.55}
            panOver={[0, t(4)]}
          />
        </Card>
      </Sequence>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 44 }}>
        <SectionTitle
          from={t(0.3)}
          until={t(2.6)}
          size={42}
          style={{ background: "rgba(7,9,13,0.8)", padding: "18px 40px", borderRadius: 999 }}
        >
          Then I started building the actual travel experience.
        </SectionTitle>
      </AbsoluteFill>

      {/* A hairline progress rail, so the four pages read as one journey. */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 22 }}>
        <div style={{ width: 620, height: 2, background: COLORS.line, position: "relative" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              width: `${interpolate(frame, [0, t(15)], [0, 100], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })}%`,
              background: COLORS.gold400,
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
