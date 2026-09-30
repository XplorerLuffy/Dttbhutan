import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../theme";
import { useSceneSeconds } from "../timing";
import { BrowserFrame } from "../components/BrowserFrame";
import { SectionTitle } from "../components/SectionTitle";

/**
 * 0–10s. Black, two sentences, then the real homepage.
 *
 * The brief asks for a black screen and a slow move into the site, and that
 * restraint is the point: nothing is on screen to be admired until DTT Bhutan
 * itself is. The homepage arrives already scaled up and settles back, so the
 * first thing the viewer does is fall into it.
 */
export const Idea: React.FC = () => {
  const t = useSceneSeconds();
  const frame = useCurrentFrame();

  // The homepage begins arriving at 6s, under the second line.
  const revealAt = t(6);
  const reveal = interpolate(frame, [revealAt, revealAt + t(2.6)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const siteScale = interpolate(reveal, [0, 1], [1.16, 1]);

  // The scrim follows the TYPE, not the reveal. Driven by the reveal alone it
  // thinned out while the second line was still up, and the line landed on top
  // of the site's own hero headline — two pieces of display type in the same
  // place, both unreadable. It only lifts once the last line has gone.
  const typeOnScreen = Math.max(
    interpolate(frame, [t(0.6), t(1.0), t(4.1), t(4.6)], [0, 1, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    interpolate(frame, [t(4.8), t(5.2), t(8.6), t(9.2)], [0, 1, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const vignette = Math.max(interpolate(reveal, [0, 1], [1, 0.34]), typeOnScreen * 0.97);

  return (
    <AbsoluteFill style={{ background: COLORS.ink }}>
      <AbsoluteFill
        style={{
          opacity: reveal,
          transform: `scale(${siteScale})`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Img
          src={staticFile("captures/home-full.png")}
          style={{ width: "100%", position: "absolute", top: 0, left: 0 }}
        />
      </AbsoluteFill>

      {/* Holds the type legible over the photograph, and keeps the opening dark. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(140% 110% at 50% 45%, rgba(7,9,13,${vignette}) 0%, rgba(7,9,13,${
            Math.min(1, vignette * 1.04)
          }) 68%)`,
        }}
      />

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", padding: "0 160px" }}>
        <SectionTitle from={t(0.8)} until={t(4.1)} size={62} maxWidth={1240}>
          I wanted to build something for travelers
          <br />
          discovering Bhutan.
        </SectionTitle>

        <div style={{ position: "absolute" }}>
          <SectionTitle from={t(5.0)} until={t(8.6)} size={62} maxWidth={1240}>
            So I started building <span style={{ color: COLORS.gold400 }}>DTT&nbsp;Bhutan</span>.
          </SectionTitle>
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-end",
          paddingBottom: 64,
          opacity: interpolate(frame, [t(8.6), t(9.4)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <p style={{ font: `500 20px/1 ${FONTS.mono}`, color: COLORS.textFaint, margin: 0, letterSpacing: "0.1em" }}>
          dttbhutan.vercel.app
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Kept beside the scene so the composition and the scene can't disagree. */
Idea.displayName = "Idea";

export const BrowserIntro = BrowserFrame;
