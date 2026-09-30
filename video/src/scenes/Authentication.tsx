import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import { COLORS, FONTS, seconds } from "../theme";
import { Architecture } from "../components/Architecture";
import { BrowserFrame } from "../components/BrowserFrame";
import { CodeWindow } from "../components/CodeWindow";
import { SectionTitle } from "../components/SectionTitle";
import { SNIPPETS } from "../data/codeSnippets";

/**
 * 78–88s. Who you are, and what that lets you do.
 *
 * Three real screens side by side — sign in, the vendor application, the
 * traveller's own dashboard — then the guard that stands behind them. Laid out
 * as three fixed columns rather than overlapping cards: an earlier version
 * stacked them with offsets and they covered each other.
 *
 * The five roles named are the five the User model actually has. This is not a
 * site with "users" and "admins", and the video shouldn't flatten it into one.
 */
const SHOTS = [
  { src: "login", caption: "Sign in" },
  { src: "vendor-guide-register", caption: "Apply as a guide" },
  { src: "dashboard-traveler", caption: "Your trips" },
];

const ROLES = ["TRAVELER", "GUIDE", "HOTEL_OPERATOR", "TRANSPORT_OPERATOR", "ADMIN"];

export const Authentication: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: COLORS.ink }}>
      <Sequence durationInFrames={seconds(5.0)}>
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 40,
            paddingTop: 30,
          }}
        >
          {SHOTS.map((shot, i) => {
            const at = seconds(0.3 + i * 0.5);
            const on = interpolate(frame, [at, at + 16], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={shot.src}
                style={{ opacity: on, transform: `translateY(${interpolate(on, [0, 1], [26, 0])}px)` }}
              >
                {/* Height follows the capture: 560 x 900/1440 = 350 of page, plus the
                    46px chrome bar. Fixed at 700 it drew half a window of white. */}
                <BrowserFrame src={shot.src} width={560} height={396} />
                <p
                  style={{
                    margin: "20px 0 0",
                    textAlign: "center",
                    font: `600 24px/1 ${FONTS.body}`,
                    color: COLORS.text,
                  }}
                >
                  {shot.caption}
                </p>
              </div>
            );
          })}
        </AbsoluteFill>
      </Sequence>

      <Sequence from={seconds(5.0)}>
        <AbsoluteFill
          style={{
            background: COLORS.ink,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 80,
            paddingTop: 40,
          }}
        >
          <Architecture
            width={400}
            accentLast
            nodes={[
              { label: "User", detail: "email + bcrypt hash" },
              { label: "Sign in", detail: "src/app/api/auth/login" },
              { label: "Session cookie", detail: "httpOnly, signed" },
              { label: "requireRole()", detail: "src/lib/auth.ts" },
              { label: "Protected pages", detail: "dashboards, admin, vendor" },
            ]}
            revealOver={[0, seconds(2.2)]}
          />

          <div style={{ width: 900 }}>
            <CodeWindow
              path={SNIPPETS.auth.path}
              code={SNIPPETS.auth.code}
              startLine={SNIPPETS.auth.startLine}
              width={900}
              fontSize={20}
              typeOver={[seconds(0.8), seconds(2.6)]}
            />
            <div
              style={{
                marginTop: 26,
                display: "flex",
                flexWrap: "wrap",
                gap: 9,
                opacity: interpolate(frame - seconds(5.0), [seconds(2.4), seconds(3.0)], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              {ROLES.map((role) => (
                <span
                  key={role}
                  style={{
                    font: `500 16px/1 ${FONTS.mono}`,
                    color: COLORS.brand300,
                    border: `1px solid ${COLORS.line}`,
                    borderRadius: 999,
                    padding: "9px 16px",
                  }}
                >
                  {role}
                </span>
              ))}
            </div>
            <p
              style={{
                margin: "20px 0 0",
                font: `400 18px/1.5 ${FONTS.body}`,
                color: COLORS.textFaint,
                opacity: interpolate(frame - seconds(5.0), [seconds(2.8), seconds(3.4)], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
              }}
            >
              Five roles, not two. Every protected route calls this before it does anything.
            </p>
          </div>
        </AbsoluteFill>
      </Sequence>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 34 }}>
        <SectionTitle
          from={seconds(0.4)}
          until={seconds(3.2)}
          size={38}
          style={{ background: "rgba(7,9,13,0.86)", padding: "16px 36px", borderRadius: 999 }}
        >
          Accounts, roles, and the pages each one can reach.
        </SectionTitle>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
