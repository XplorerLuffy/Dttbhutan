import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../theme";

export type FlowStep = {
  label: string;
  /** The real artefact behind the step — a function, a column, a count. */
  note?: string;
};

/**
 * One request moving left to right through the steps it really takes.
 *
 * Where Architecture shows what the layers are, this shows something passing
 * through them: a pulse travels the track and each step lights as it arrives.
 * Used for retrieval, where the sequence is the whole point.
 */
export const DataFlow: React.FC<{
  steps: FlowStep[];
  /** Frames over which the pulse crosses the whole track. */
  runOver: [number, number];
  width?: number;
  style?: React.CSSProperties;
}> = ({ steps, runOver, width = 1560, style }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, runOver, [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const head = progress * (steps.length - 1);

  return (
    <div style={{ width, ...style }}>
      <div style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
        {steps.map((step, i) => {
          const lit = interpolate(head, [i - 0.55, i], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <React.Fragment key={step.label}>
              {i > 0 && (
                <div style={{ flex: "0 0 54px", display: "flex", alignItems: "center", paddingTop: 2 }}>
                  <div style={{ position: "relative", width: "100%", height: 2, background: COLORS.line }}>
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: `${lit * 100}%`,
                        background: COLORS.gold400,
                      }}
                    />
                  </div>
                </div>
              )}
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  borderRadius: 10,
                  padding: "18px 14px",
                  textAlign: "center",
                  background: lit > 0.6 ? "rgba(242,162,39,0.10)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${lit > 0.6 ? "rgba(242,162,39,0.4)" : COLORS.line}`,
                  transform: `scale(${1 + lit * 0.03})`,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    font: `600 21px/1.25 ${FONTS.body}`,
                    color: lit > 0.6 ? COLORS.gold300 : COLORS.textDim,
                  }}
                >
                  {step.label}
                </p>
                {step.note && (
                  <p style={{ margin: "8px 0 0", font: `400 14px/1.4 ${FONTS.mono}`, color: COLORS.textFaint }}>
                    {step.note}
                  </p>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
