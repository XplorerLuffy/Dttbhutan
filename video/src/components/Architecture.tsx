import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../theme";

export type ArchNode = {
  label: string;
  /** What it is in this codebase — a file, a service, a library. */
  detail?: string;
  /** Children shown as a branch beneath, for a one-to-many layer such as the
   * three AI providers. */
  branches?: string[];
};

/**
 * A vertical stack of the layers a request actually passes through.
 *
 * Each diagram in this film is read off the repository rather than drawn from a
 * mental model of how such an app is usually built: the labels are file paths
 * and package names that exist, and a layer that isn't in the code isn't in
 * the diagram.
 */
export const Architecture: React.FC<{
  nodes: ArchNode[];
  /** Frames over which the layers arrive, top to bottom. */
  revealOver?: [number, number];
  width?: number;
  style?: React.CSSProperties;
  accentLast?: boolean;
}> = ({ nodes, revealOver = [0, 60], width = 560, style, accentLast = false }) => {
  const frame = useCurrentFrame();

  return (
    <div style={{ width, display: "flex", flexDirection: "column", alignItems: "center", ...style }}>
      {nodes.map((node, i) => {
        const at = interpolate(i, [0, Math.max(1, nodes.length - 1)], revealOver, {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const appear = interpolate(frame, [at, at + 14], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const isLast = i === nodes.length - 1;
        const accent = accentLast && isLast;

        return (
          <React.Fragment key={node.label}>
            {i > 0 && (
              <div
                style={{
                  width: 2,
                  height: 26,
                  background: `linear-gradient(to bottom, ${COLORS.line}, ${
                    appear > 0.5 ? COLORS.gold400 : COLORS.line
                  })`,
                  opacity: appear,
                }}
              />
            )}
            <div
              style={{
                opacity: appear,
                transform: `translateY(${interpolate(appear, [0, 1], [10, 0])}px)`,
                width: "100%",
                borderRadius: 10,
                padding: "16px 22px",
                background: accent ? "rgba(242,162,39,0.12)" : "rgba(255,255,255,0.035)",
                border: `1px solid ${accent ? "rgba(242,162,39,0.45)" : COLORS.line}`,
                textAlign: "center",
              }}
            >
              <p
                style={{
                  margin: 0,
                  font: `600 25px/1.2 ${FONTS.body}`,
                  color: accent ? COLORS.gold300 : COLORS.text,
                }}
              >
                {node.label}
              </p>
              {node.detail && (
                <p style={{ margin: "7px 0 0", font: `400 16px/1.35 ${FONTS.mono}`, color: COLORS.textFaint }}>
                  {node.detail}
                </p>
              )}
              {node.branches && (
                <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
                  {node.branches.map((b) => (
                    <span
                      key={b}
                      style={{
                        font: `500 15px/1 ${FONTS.mono}`,
                        color: COLORS.brand300,
                        border: `1px solid ${COLORS.line}`,
                        borderRadius: 999,
                        padding: "7px 14px",
                      }}
                    >
                      {b}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
