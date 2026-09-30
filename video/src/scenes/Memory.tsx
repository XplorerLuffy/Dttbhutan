import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../theme";
import { useSceneSeconds } from "../timing";
import { BrowserFrame } from "../components/BrowserFrame";
import { SectionTitle } from "../components/SectionTitle";
import { MEMORY_THREAD } from "../data/productionReplies";

/**
 * 160–172s. It remembers what you told it.
 *
 * The brief asks for this only if the project supports it, so here is exactly
 * what the project supports and no more. Two turns went to production on one
 * conversationId. The second turn says nothing about a family — and the answer
 * comes back offering to "fine-tune a family-friendly itinerary".
 *
 * That last phrase is highlighted because it is the whole claim. The scene
 * shows the conversationId on both turns so a viewer can see the mechanism:
 * AiConversation and AiMessage rows, replayed into the next request.
 */
export const Memory: React.FC = () => {
  const t = useSceneSeconds();
  const frame = useCurrentFrame();

  const secondIn = interpolate(frame, [t(4.6), t(5.6)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: COLORS.ink }}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 48 }}>
        <SectionTitle from={t(0.3)} size={42}>
          The assistant can also keep track of the conversation.
        </SectionTitle>
      </AbsoluteFill>

      {/* The capture sits right of centre so the turns have their own column.
          At its old width it ran under them and both became unreadable. */}
      <AbsoluteFill
        style={{
          alignItems: "flex-end",
          justifyContent: "center",
          paddingRight: 80,
          paddingTop: 70,
          transform: `scale(${interpolate(secondIn, [0, 1], [1, 0.995])})`,
        }}
      >
        <BrowserFrame
          src="assistant-memory-2"
          width={1240}
          height={775}
          url="dttbhutan.vercel.app/assistant"
        />
      </AbsoluteFill>

      {/* The two turns, called out beside the capture. */}
      <AbsoluteFill style={{ alignItems: "flex-start", justifyContent: "center", paddingLeft: 72, paddingTop: 70 }}>
        <div style={{ width: 440 }}>
          {MEMORY_THREAD.map((turn, i) => {
            const at = i === 0 ? t(1.6) : t(5.0);
            const on = interpolate(frame, [at, at + 14], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div key={i} style={{ opacity: on, marginBottom: 26 }}>
                <p
                  style={{
                    margin: "0 0 7px",
                    font: `600 13px/1 ${FONTS.mono}`,
                    letterSpacing: "0.12em",
                    color: COLORS.gold400,
                  }}
                >
                  TURN {i + 1}
                </p>
                <p style={{ margin: 0, font: `500 18px/1.4 ${FONTS.body}`, color: COLORS.text }}>
                  &ldquo;{turn.question}&rdquo;
                </p>
              </div>
            );
          })}

          <div
            style={{
              opacity: interpolate(frame, [t(6.6), t(7.4)], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              marginTop: 10,
              paddingTop: 20,
              borderTop: `1px solid ${COLORS.line}`,
            }}
          >
            <p style={{ margin: 0, font: `400 15px/1.5 ${FONTS.body}`, color: COLORS.textDim }}>
              The second turn never mentions a family. The answer offers a{" "}
              <span style={{ color: COLORS.gold300 }}>family-friendly itinerary</span> anyway.
            </p>
            <p style={{ margin: "14px 0 0", font: `400 13px/1.5 ${FONTS.mono}`, color: COLORS.textFaint }}>
              one conversationId
              <br />
              {MEMORY_THREAD[0].conversationId}
              <br />
              AiConversation → AiMessage
            </p>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
