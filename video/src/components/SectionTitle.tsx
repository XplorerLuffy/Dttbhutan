import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../theme";

/**
 * The film's narration: one line of the developer's own story at a time.
 *
 * Every word this renders comes from the brief's script, not from a summary of
 * the project — the voice is the person who built it. Lines rise rather than
 * fade in place, which keeps the eye moving down the frame toward whatever the
 * scene shows next.
 */
export const SectionTitle: React.FC<{
  children: React.ReactNode;
  /** Frame, relative to the sequence, at which this line starts arriving. */
  from?: number;
  /** Frame at which it starts leaving. Omit to leave it on screen. */
  until?: number;
  size?: number;
  align?: "left" | "center";
  color?: string;
  weight?: number;
  font?: "display" | "body";
  /** Small uppercase label above the line — the chapter, not the sentence. */
  eyebrow?: string;
  maxWidth?: number;
  style?: React.CSSProperties;
}> = ({
  children,
  from = 0,
  until,
  size = 54,
  align = "center",
  color = COLORS.text,
  weight = 600,
  font = "display",
  eyebrow,
  maxWidth = 1300,
  style,
}) => {
  const frame = useCurrentFrame();

  const appear = interpolate(frame, [from, from + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const leave = until === undefined ? 1 : interpolate(frame, [until, until + 14], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = appear * leave;
  const lift = interpolate(appear, [0, 1], [26, 0]);

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${lift}px)`,
        textAlign: align,
        maxWidth,
        ...style,
      }}
    >
      {eyebrow && (
        <p
          style={{
            font: `600 17px/1 ${FONTS.body}`,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: COLORS.gold400,
            margin: "0 0 20px",
          }}
        >
          {eyebrow}
        </p>
      )}
      <p
        style={{
          font: `${weight} ${size}px/1.22 ${font === "display" ? FONTS.display : FONTS.body}`,
          color,
          margin: 0,
          letterSpacing: font === "display" ? "-0.015em" : "-0.01em",
        }}
      >
        {children}
      </p>
    </div>
  );
};
