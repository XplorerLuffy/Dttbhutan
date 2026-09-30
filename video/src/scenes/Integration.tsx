import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import { COLORS, FONTS, seconds } from "../theme";
import { BrowserFrame } from "../components/BrowserFrame";
import { CodeWindow } from "../components/CodeWindow";
import { Cursor } from "../components/Cursor";
import { SectionTitle } from "../components/SectionTitle";

/**
 * 172–185s. Bringing it in.
 *
 * The scene the whole film has been arranged around. Two things stand apart —
 * the assistant on its own page, the website without it — and then they become
 * one thing: the cursor reaches the button that is really on every page, and
 * the panel that really opens is what opens.
 *
 * The two windows sit in fixed columns and stay there. An earlier version slid
 * them toward each other to mean "integration" and they simply overlapped,
 * which read as a mistake rather than a merge. What carries the idea instead is
 * the arrow between them and the line of code underneath: SiteChrome renders
 * AiChatWidget beside every page, which is why this is an integration and not a
 * second app at a second URL.
 */
const MOUNT = `<SiteChrome>
  {children}
  <AiChatWidget />
</SiteChrome>`;

export const Integration: React.FC = () => {
  const frame = useCurrentFrame();

  const joinAt = seconds(4.0);
  const join = interpolate(frame, [joinAt, joinAt + seconds(1.2)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: COLORS.ink }}>
      <Sequence durationInFrames={seconds(7.4)}>
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 46,
            paddingTop: 40,
          }}
        >
          {[
            { src: "assistant-empty", label: "AI Assistant", url: "dttbhutan.vercel.app/assistant", at: 0.3, color: COLORS.gold300 },
            { src: "home", label: "DTT Bhutan", url: "dttbhutan.vercel.app", at: 0.9, color: COLORS.text },
          ].map((panel, i) => {
            const on = interpolate(frame, [seconds(panel.at), seconds(panel.at + 0.7)], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <React.Fragment key={panel.src}>
                {i === 1 && (
                  <div
                    style={{
                      opacity: join,
                      font: `600 46px/1 ${FONTS.body}`,
                      color: COLORS.gold400,
                      alignSelf: "center",
                      marginTop: -46,
                    }}
                  >
                    +
                  </div>
                )}
                <div style={{ opacity: on, transform: `translateY(${interpolate(on, [0, 1], [24, 0])}px)` }}>
                  <BrowserFrame src={panel.src} width={780} height={488} url={panel.url} />
                  <p
                    style={{
                      margin: "20px 0 0",
                      textAlign: "center",
                      font: `600 28px/1 ${FONTS.body}`,
                      color: panel.color,
                    }}
                  >
                    {panel.label}
                  </p>
                </div>
              </React.Fragment>
            );
          })}
        </AbsoluteFill>

        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "flex-end",
            paddingBottom: 66,
            opacity: interpolate(frame, [seconds(4.8), seconds(5.6)], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <CodeWindow path="src/app/layout.tsx" code={MOUNT} width={560} fontSize={19} highlight={[3]} />
        </AbsoluteFill>
      </Sequence>

      {/* And the one thing they make: the button, and the panel it opens. */}
      <Sequence from={seconds(7.2)}>
        <AbsoluteFill style={{ background: COLORS.ink, alignItems: "center", justifyContent: "center" }}>
          <Sequence durationInFrames={seconds(2.6)}>
            <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
              <BrowserFrame src="widget-closed-package" width={1580} height={988} />
              <Cursor
                from={[1240, 1010]}
                to={[1506, 930]}
                moveOver={[seconds(0.4), seconds(1.7)]}
                clickAt={seconds(2.0)}
              />
            </AbsoluteFill>
          </Sequence>

          <Sequence from={seconds(2.6)}>
            <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
              <BrowserFrame src="widget-open-greeting" width={1580} height={988} />
            </AbsoluteFill>
          </Sequence>
        </AbsoluteFill>
      </Sequence>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 44 }}>
        <SectionTitle
          from={seconds(0.5)}
          until={seconds(3.2)}
          size={40}
          style={{ background: "rgba(7,9,13,0.86)", padding: "16px 38px", borderRadius: 999 }}
        >
          Finally, I brought it into the website.
        </SectionTitle>
      </AbsoluteFill>

      {/* The closing line goes under the window, not over its title bar: by the
          time it arrives the whole frame is the website, and there is no empty
          space left at the top to put type in. */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 26 }}>
        <SectionTitle
          from={seconds(8.6)}
          size={38}
          style={{ background: "rgba(7,9,13,0.9)", padding: "15px 36px", borderRadius: 999 }}
        >
          DTT Bhutan now had its own AI travel assistant.
        </SectionTitle>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
