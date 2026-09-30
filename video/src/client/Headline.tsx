import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../theme";

/**
 * The words the client asked to appear on screen, and only those.
 *
 * Every string this renders is copied from the shot list they wrote — not a
 * caption composed for them, not a summary of the narration. Two shapes,
 * because their script uses two: short all-caps labels that name a thing
 * ("AI TRAVEL ASSISTANT", "JAMBAYANG.COM") and sentences that carry a thought
 * ("Then I wanted to take it further…").
 *
 * It sits low in the frame rather than centred so that whatever it is over —
 * a screenshot, a diagram — keeps the upper two thirds to itself.
 */
export const Headline: React.FC<{
  text: string;
  kind?: "label" | "line";
  /** Frame, relative to the beat, at which it arrives. */
  from?: number;
  /** Frame at which it starts leaving. Omit to hold to the end of the beat. */
  until?: number;
  /** Distance from the bottom of the 1080-tall frame. */
  bottom?: number;
  align?: "center" | "left";
  /** A smaller second line beneath, for the closing card's domain. */
  sub?: string;
  size?: number;
}> = ({ text, kind = "line", from = 0, until, bottom = 96, align = "center", sub, size }) => {
  const frame = useCurrentFrame();

  const appear = interpolate(frame, [from, from + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const leave =
    until === undefined
      ? 1
      : interpolate(frame, [until, until + 10], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  const isLabel = kind === "label";
  const fontSize = size ?? (isLabel ? 62 : 56);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom,
        display: "flex",
        flexDirection: "column",
        alignItems: align === "center" ? "center" : "flex-start",
        paddingLeft: align === "center" ? 0 : 130,
        gap: 14,
        opacity: appear * leave,
        transform: `translateY(${interpolate(appear, [0, 1], [22, 0])}px)`,
        zIndex: 30,
      }}
    >
      {isLabel && (
        <span style={{ width: 92, height: 4, borderRadius: 999, background: COLORS.gold400 }} />
      )}
      <span
        style={{
          font: `${isLabel ? 700 : 600} ${fontSize}px/1.2 ${isLabel ? FONTS.bodyEmoji : FONTS.displayEmoji}`,
          color: "#fff",
          letterSpacing: isLabel ? "0.13em" : "-0.015em",
          textTransform: isLabel ? "uppercase" : "none",
          textAlign: align,
          maxWidth: 1420,
          // A scrim rather than a shadow: the shots underneath are screenshots
          // of a white website, and a shadow disappears on them.
          background: "rgba(7,9,13,0.80)",
          padding: isLabel ? "16px 34px" : "18px 36px",
          borderRadius: 16,
        }}
      >
        {text}
      </span>
      {sub && (
        <span
          style={{
            font: `600 30px/1 ${FONTS.body}`,
            color: COLORS.gold300,
            letterSpacing: "0.1em",
            background: "rgba(7,9,13,0.80)",
            padding: "10px 24px",
            borderRadius: 12,
          }}
        >
          {sub}
        </span>
      )}
    </div>
  );
};

/**
 * The three words of the build, lighting in turn.
 *
 * The client's shot list gives this beat the on-screen text
 * "DESIGN → DEVELOPMENT → FUNCTIONALITY" while the pictures move through the
 * real pages; a static line would sit there for nine seconds, so each word
 * takes its turn as the shots beneath it change.
 */
export const Chapters: React.FC<{
  words: string[];
  /** Frame each word lights, in order. */
  at: number[];
  bottom?: number;
}> = ({ words, at, bottom = 96 }) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 20,
        zIndex: 30,
      }}
    >
      {words.map((word, i) => {
        const lit = interpolate(frame, [at[i], at[i] + 10], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <React.Fragment key={word}>
            {i > 0 && (
              <span
                style={{
                  font: `500 40px/1 ${FONTS.body}`,
                  color: lit > 0.5 ? COLORS.gold400 : "rgba(255,255,255,0.28)",
                }}
              >
                →
              </span>
            )}
            <span
              style={{
                font: `700 40px/1 ${FONTS.body}`,
                letterSpacing: "0.12em",
                color: lit > 0.5 ? "#fff" : "rgba(255,255,255,0.42)",
                background: lit > 0.5 ? "rgba(242,162,39,0.16)" : "rgba(7,9,13,0.78)",
                border: `1px solid ${lit > 0.5 ? "rgba(242,162,39,0.55)" : COLORS.line}`,
                padding: "16px 30px",
                borderRadius: 12,
                transform: `scale(${1 + lit * 0.04})`,
              }}
            >
              {word}
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
};
