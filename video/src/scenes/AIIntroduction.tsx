import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import { COLORS, FONTS, seconds } from "../theme";
import { useSceneSeconds } from "../timing";
import { BrowserFrame } from "../components/BrowserFrame";
import { SectionTitle } from "../components/SectionTitle";

/**
 * 88–110s. The turn.
 *
 * Two beats in one scene, because they are one thought. First "the website was
 * working" — six real pages passing quickly, the product standing on its own
 * with no AI anywhere in it. Then the screen goes dark and stays dark for a
 * beat before the assistant is mentioned at all.
 *
 * That darkness is doing the most important job in the film: it is the line
 * between the travel platform and the thing added to it afterwards. The AI
 * does not appear until the website has been shown finished without it.
 */
const MONTAGE = ["home", "packages", "package-trek", "destination-paro", "travel-guide", "gallery"];

export const AIIntroduction: React.FC = () => {
  const t = useSceneSeconds();
  /** How long each page of the montage is held. */
  const HOLD = t(1.05);
  const frame = useCurrentFrame();

  // Everything before 10s belongs to the website; after it, to the idea.
  const pivot = t(10);
  const fadeOut = interpolate(frame, [pivot - t(0.9), pivot], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // The assistant arrives under the last line, with three seconds left to look
  // at it before the next chapter opens on the same screen.
  const assistantIn = interpolate(frame, [t(18.4), t(19.6)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: COLORS.ink }}>
      <AbsoluteFill style={{ opacity: fadeOut }}>
        {MONTAGE.map((src, i) => (
          <Sequence key={src} from={Math.round(i * HOLD)} durationInFrames={Math.round(HOLD) + 6}>
            <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
              <BrowserFrame src={src} width={1560} height={975} />
            </AbsoluteFill>
          </Sequence>
        ))}

        <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 46 }}>
          <SectionTitle
            from={t(6.6)}
            size={44}
            style={{ background: "rgba(7,9,13,0.82)", padding: "18px 44px", borderRadius: 999 }}
          >
            But I wasn&rsquo;t finished.
          </SectionTitle>
        </AbsoluteFill>
      </AbsoluteFill>

      {/* The dark beat, the two lines that turn the film, and then DRUKA. */}
      <Sequence from={pivot}>
        <AbsoluteFill style={{ background: COLORS.ink, alignItems: "center", justifyContent: "center" }}>
          <SectionTitle from={t(0.9)} until={t(4.2)} size={58} maxWidth={1180}>
            I wanted visitors to have someone they could ask.
          </SectionTitle>

          <div style={{ position: "absolute" }}>
            <SectionTitle from={t(5.0)} size={58} maxWidth={1180}>
              So I built an <span style={{ color: COLORS.gold400 }}>AI Travel Assistant</span>.
            </SectionTitle>
          </div>

          <p
            style={{
              position: "absolute",
              bottom: 82,
              margin: 0,
              font: `500 19px/1 ${FONTS.mono}`,
              letterSpacing: "0.14em",
              color: COLORS.textFaint,
              opacity: interpolate(frame - pivot, [t(6.4), t(7.2)], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }) * (1 - assistantIn),
            }}
          >
            DRUKA
          </p>

          {/* The brief asks for the assistant UI to appear here, and it should:
              this is the turn, and the turn is only real once the thing named
              is on screen. It rises out of the dark rather than cutting in. */}
          <AbsoluteFill
            style={{
              alignItems: "center",
              justifyContent: "center",
              opacity: assistantIn,
              transform: `translateY(${interpolate(assistantIn, [0, 1], [70, 0])}px) scale(${interpolate(
                assistantIn,
                [0, 1],
                [0.94, 1]
              )})`,
            }}
          >
            <BrowserFrame
              src="assistant-empty"
              width={1540}
              height={962}
              url="dttbhutan.vercel.app/assistant"
            />
          </AbsoluteFill>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
