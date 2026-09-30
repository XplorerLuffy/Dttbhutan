import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../theme";

/**
 * The line being spoken, on screen, large.
 *
 * Not decoration. Most people meet a TikTok with the sound off and decide
 * within a second whether to keep watching, so the caption is doing the
 * narration's job for the majority of viewers — which is why it is 64px rather
 * than the 38px the landscape film uses, and why it sits on a scrim dark enough
 * to read over a screenshot.
 *
 * It lives between 1240 and 1560 of 1920 on purpose: above TikTok's own caption
 * and username, and clear of the button rail down the right-hand side.
 */
export const CAPTION_TOP = 1240;

export const Caption: React.FC<{
  text: string;
  /** Frame the caption arrives, relative to the beat. */
  from?: number;
  /** Frame it leaves. Omit to hold to the end of the beat. */
  until?: number;
  accent?: string;
}> = ({ text, from = 0, until, accent }) => {
  const frame = useCurrentFrame();

  const appear = interpolate(frame, [from, from + 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const leave =
    until === undefined
      ? 1
      : interpolate(frame, [until, until + 6], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  const lines = text.split("\n");

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: CAPTION_TOP,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        opacity: appear * leave,
        transform: `translateY(${interpolate(appear, [0, 1], [18, 0])}px)`,
      }}
    >
      {lines.map((line, i) => (
        <span
          key={i}
          style={{
            font: `700 64px/1.18 ${FONTS.body}`,
            color: accent && i === lines.length - 1 ? accent : "#fff",
            background: "rgba(7,9,13,0.82)",
            padding: "10px 26px",
            borderRadius: 14,
            letterSpacing: "-0.015em",
            textAlign: "center",
            maxWidth: 940,
            // Each line gets its own box, so a short line does not sit in a
            // wide empty bar. Reads as subtitles rather than a caption card.
            alignSelf: "center",
          }}
        >
          {line}
        </span>
      ))}
    </div>
  );
};

/**
 * A number the viewer should actually take in, set large.
 *
 * Used where the narration lists figures — "29 tour packages, all 20 districts"
 * — because a spoken number goes past too fast to register and a screenshot
 * cannot show it.
 */
export const BigStat: React.FC<{
  value: string;
  label: string;
  from: number;
}> = ({ value, label, from }) => {
  const frame = useCurrentFrame();
  const on = interpolate(frame, [from, from + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity: on,
        transform: `translateY(${interpolate(on, [0, 1], [16, 0])}px)`,
        textAlign: "center",
      }}
    >
      <p style={{ margin: 0, font: `700 82px/1 ${FONTS.display}`, color: COLORS.gold400 }}>{value}</p>
      <p
        style={{
          margin: "8px 0 0",
          font: `600 27px/1.25 ${FONTS.body}`,
          color: "#fff",
          letterSpacing: "0.02em",
        }}
      >
        {label}
      </p>
    </div>
  );
};
