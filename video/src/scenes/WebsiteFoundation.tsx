import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONTS, seconds } from "../theme";
import { BrowserFrame } from "../components/BrowserFrame";
import { SectionTitle } from "../components/SectionTitle";
import { PROJECT_TREE } from "../data/projectFacts";

/**
 * 10–22s. The homepage, then the tree it is actually built from.
 *
 * The brief asks to go from the site into the development process, so the shot
 * holds the real homepage beside the real `src/` tree — the same thing seen
 * from two sides, rather than a cut away from the product to a generic "code"
 * visual.
 *
 * Laid out as one row that fits: 1020 + 64 + 620 = 1704 of 1920. An earlier
 * version centred the browser and slid it left under the panel, which put a
 * third of the homepage off the edge of the frame.
 */
export const WebsiteFoundation: React.FC = () => {
  const frame = useCurrentFrame();

  const split = interpolate(frame, [seconds(3.4), seconds(5.2)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const lines = PROJECT_TREE.split("\n");
  const shown = Math.round(
    interpolate(frame, [seconds(5.0), seconds(9.4)], [0, lines.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  return (
    <AbsoluteFill style={{ background: COLORS.ink }}>
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 64,
          paddingTop: 54,
        }}
      >
        <div
          style={{
            // Starts centred and alone, then makes room without leaving frame.
            transform: `translateX(${interpolate(split, [0, 1], [342, 0])}px) scale(${interpolate(
              split,
              [0, 1],
              [1.16, 1]
            )})`,
          }}
        >
          <BrowserFrame
            src="home-full"
            width={1020}
            height={780}
            panFrom={0}
            panTo={0.3}
            panOver={[0, seconds(12)]}
          />
        </div>

        <div
          style={{
            width: 620,
            opacity: split,
            transform: `translateX(${interpolate(split, [0, 1], [70, 0])}px)`,
            borderRadius: 12,
            padding: "26px 30px 30px",
            background: "rgba(12,16,22,0.96)",
            border: `1px solid ${COLORS.line}`,
          }}
        >
          <p
            style={{
              margin: "0 0 18px",
              font: `600 14px/1 ${FONTS.body}`,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: COLORS.gold400,
            }}
          >
            The project
          </p>
          <pre style={{ margin: 0, font: `400 17px/1.8 ${FONTS.mono}`, whiteSpace: "pre" }}>
            {lines.slice(0, shown).map((line, i) => {
              // Each line is a path and, sometimes, a count. They're coloured
              // apart so the tree reads as structure and the counts as facts.
              const at = line.search(/\s{2,}\S/);
              const path = at > 0 ? line.slice(0, at) : line;
              const note = at > 0 ? line.slice(at) : "";
              return (
                <div key={i}>
                  <span style={{ color: COLORS.text }}>{path}</span>
                  <span style={{ color: COLORS.textFaint }}>{note}</span>
                </div>
              );
            })}
          </pre>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 40 }}>
        <SectionTitle
          from={seconds(0.5)}
          until={seconds(3.0)}
          size={40}
          style={{
            background: "rgba(7,9,13,0.86)",
            padding: "18px 40px",
            borderRadius: 999,
          }}
        >
          I started with the foundation — the website itself.
        </SectionTitle>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
