import React from "react";
import { AbsoluteFill, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../theme";
import { useSceneSeconds } from "../timing";
import { BrowserFrame, PhoneFrame } from "../components/BrowserFrame";
import { SectionTitle } from "../components/SectionTitle";
import { PLAN_REPLY } from "../data/productionReplies";

/**
 * 185–220s. The finished thing, then the title.
 *
 * The last chapter is deliberately the least decorated in the film. The product
 * has been explained; what is left is to watch it work. The assistant answers
 * inside the website, on a desktop and on a phone, and then the camera pulls
 * back off the page it is open on.
 *
 * The three closing lines are the film's argument in order — an idea, a
 * website, an assistant built into it — and they arrive in that order for the
 * same reason the chapters did.
 */
export const Finale: React.FC = () => {
  const t = useSceneSeconds();
  const frame = useCurrentFrame();

  const titleAt = t(20);

  return (
    <AbsoluteFill style={{ background: COLORS.ink }}>
      {/* The assistant working inside the site. */}
      <Sequence durationInFrames={titleAt}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <Sequence durationInFrames={t(5.4)}>
            <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
              <BrowserFrame src="widget-answer-home" width={1600} height={1000} />
              <p
                style={{
                  position: "absolute",
                  bottom: 30,
                  margin: 0,
                  font: `500 19px/1 ${FONTS.body}`,
                  color: COLORS.textFaint,
                }}
              >
                &ldquo;{PLAN_REPLY.question}&rdquo;
              </p>
            </AbsoluteFill>
          </Sequence>

          <Sequence from={t(5.4)} durationInFrames={t(5.2)}>
            <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
              <BrowserFrame src="widget-answer-sdf" width={1600} height={1000} />
            </AbsoluteFill>
          </Sequence>

          {/* It is the same product on a phone, not a separate app. */}
          <Sequence from={t(10.6)} durationInFrames={t(5.0)}>
            <AbsoluteFill
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 72,
              }}
            >
              <PhoneFrame src="phone-widget-open" height={880} />
              <PhoneFrame src="phone-widget-answer" height={880} />
              <div style={{ width: 380 }}>
                <p style={{ margin: 0, font: `600 34px/1.25 ${FONTS.display}`, color: COLORS.text }}>
                  The same assistant,
                  <br />
                  on a phone.
                </p>
                <p style={{ margin: "18px 0 0", font: `400 19px/1.55 ${FONTS.body}`, color: COLORS.textDim }}>
                  Full screen below 640px, a panel above it — one component, mounted once.
                </p>
              </div>
            </AbsoluteFill>
          </Sequence>

          <Sequence from={t(15.6)}>
            <AbsoluteFill
              style={{
                alignItems: "center",
                justifyContent: "center",
                // The slow pull-back the brief asks for.
                transform: `scale(${interpolate(frame - t(15.6), [0, t(4.4)], [1.04, 0.86], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })})`,
              }}
            >
              <BrowserFrame src="widget-answer-sdf" width={1600} height={1000} />
            </AbsoluteFill>
          </Sequence>
        </AbsoluteFill>
      </Sequence>

      {/* The three lines and the title. */}
      <Sequence from={t(15.8)}>
        <AbsoluteFill
          style={{
            background: `linear-gradient(to bottom, rgba(7,9,13,${interpolate(
              frame - t(15.8),
              [0, t(4.0)],
              [0, 0.96],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            )}) 0%, rgba(7,9,13,${interpolate(frame - t(15.8), [0, t(4.0)], [0.2, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}) 100%)`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SectionTitle from={t(0.6)} until={t(2.4)} size={54}>
            From an idea…
          </SectionTitle>
          <div style={{ position: "absolute" }}>
            <SectionTitle from={t(2.8)} until={t(4.6)} size={54}>
              …to a website…
            </SectionTitle>
          </div>
          <div style={{ position: "absolute" }}>
            <SectionTitle from={t(5.0)} until={t(7.0)} size={54}>
              …to an AI travel assistant built into it.
            </SectionTitle>
          </div>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={titleAt + t(3.4)}>
        <AbsoluteFill
          style={{ background: COLORS.ink, alignItems: "center", justifyContent: "center", flexDirection: "column" }}
        >
          <Img
            src={staticFile("logo/droelma-mark-reverse.png")}
            style={{
              width: 108,
              marginBottom: 34,
              opacity: interpolate(frame - titleAt - t(3.4), [0, t(0.9)], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          />
          <SectionTitle from={t(0.5)} size={92} weight={700} style={{ letterSpacing: "0.04em" }}>
            DTT BHUTAN
          </SectionTitle>
          <div style={{ marginTop: 22 }}>
            <SectionTitle from={t(1.4)} size={26} font="body" weight={400} color={COLORS.textDim}>
              Built for travelers discovering Bhutan.
            </SectionTitle>
          </div>
          <p
            style={{
              position: "absolute",
              bottom: 58,
              margin: 0,
              font: `500 18px/1 ${FONTS.mono}`,
              letterSpacing: "0.12em",
              color: COLORS.textFaint,
              opacity: interpolate(frame - titleAt - t(3.4), [t(2.6), t(3.4)], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            dttbhutan.vercel.app
          </p>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
