import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * A pointer that travels between two points and clicks.
 *
 * It only ever mimes something the site really does — following a nav link,
 * opening a package, opening the assistant. It never demonstrates an
 * interaction the product doesn't have, and the frame it lands on is always a
 * capture of the page that click really leads to.
 */
export const Cursor: React.FC<{
  from: [number, number];
  to: [number, number];
  /** Frames over which it travels. */
  moveOver: [number, number];
  /** Frame at which the click lands. Omit for a move with no click. */
  clickAt?: number;
  /** Frames over which it fades out afterwards. */
  fadeOut?: [number, number];
  fadeIn?: [number, number];
}> = ({ from, to, moveOver, clickAt, fadeOut, fadeIn }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Spring rather than a linear tween: a real hand accelerates away from rest
  // and settles, and a constant-speed cursor reads as a diagram.
  const progress = spring({
    frame: frame - moveOver[0],
    fps,
    durationInFrames: moveOver[1] - moveOver[0],
    config: { damping: 200, mass: 0.9 },
  });

  const x = from[0] + (to[0] - from[0]) * progress;
  const y = from[1] + (to[1] - from[1]) * progress;

  const pressed = clickAt !== undefined && frame >= clickAt && frame < clickAt + 5;
  const ringAge = clickAt === undefined ? -1 : frame - clickAt;
  const ringOn = ringAge >= 0 && ringAge < 20;

  const opacity =
    (fadeIn ? interpolate(frame, fadeIn, [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1) *
    (fadeOut ? interpolate(frame, fadeOut, [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1);

  return (
    <div style={{ position: "absolute", left: x, top: y, opacity, pointerEvents: "none", zIndex: 40 }}>
      {ringOn && (
        <span
          style={{
            position: "absolute",
            left: -4,
            top: -4,
            width: 8 + ringAge * 3.2,
            height: 8 + ringAge * 3.2,
            marginLeft: -(ringAge * 1.6),
            marginTop: -(ringAge * 1.6),
            borderRadius: 999,
            border: "2px solid rgba(255,255,255,0.85)",
            opacity: interpolate(ringAge, [0, 20], [0.9, 0]),
          }}
        />
      )}
      <svg width="26" height="30" viewBox="0 0 26 30" style={{ transform: pressed ? "scale(0.88)" : "scale(1)" }}>
        <path
          d="M2 2 L2 22 L7.2 17.4 L10.6 25.6 L14.4 24 L11 16 L18 15.6 Z"
          fill="#ffffff"
          stroke="rgba(0,0,0,0.55)"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
