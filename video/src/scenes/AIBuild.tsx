import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import { COLORS, FONTS, seconds } from "../theme";
import { Architecture } from "../components/Architecture";
import { BrowserFrame } from "../components/BrowserFrame";
import { CodeWindow } from "../components/CodeWindow";
import { SectionTitle } from "../components/SectionTitle";
import { SNIPPETS } from "../data/codeSnippets";
import { FACTS } from "../data/projectFacts";

/**
 * 110–125s. The assistant as its own layer.
 *
 * It opens on the real /assistant page, then goes behind it. The three
 * providers named are the three that exist as files — src/lib/ai/providers/
 * holds ollama.ts, anthropic.ts and gemini.ts and nothing else — and the
 * interface shown is the one all three satisfy, which is why swapping them is
 * an environment variable rather than a rewrite.
 */
export const AIBuild: React.FC = () => {
  const frame = useCurrentFrame();

  const toCode = interpolate(frame, [seconds(4.0), seconds(5.4)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: COLORS.ink }}>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          opacity: 1 - toCode,
          transform: `scale(${interpolate(toCode, [0, 1], [1, 1.06])})`,
        }}
      >
        <BrowserFrame src="assistant-empty" width={1620} height={1012} url="dttbhutan.vercel.app/assistant" />
      </AbsoluteFill>

      <Sequence from={seconds(4.4)}>
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 86,
            opacity: toCode,
          }}
        >
          <Architecture
            width={470}
            accentLast
            nodes={[
              { label: "Traveller", detail: "asks in their own words" },
              { label: "DRUKA", detail: "src/components/assistant" },
              { label: "POST /api/chat", detail: "rate limited, 60s budget" },
              { label: "runAssistantTurn()", detail: `src/lib/ai — ${FACTS.aiTools} grounding tools` },
              {
                label: "AI provider",
                detail: "chosen by AI_PROVIDER",
                branches: ["Ollama", "Anthropic", "Gemini"],
              },
            ]}
            revealOver={[0, seconds(3.2)]}
          />

          <div>
            <CodeWindow
              path={SNIPPETS.provider.path}
              code={SNIPPETS.provider.code}
              startLine={SNIPPETS.provider.startLine}
              width={900}
              fontSize={21}
              typeOver={[seconds(1.0), seconds(2.2)]}
            />
            <div style={{ height: 22 }} />
            <CodeWindow
              path={SNIPPETS.assistant.path}
              code={SNIPPETS.assistant.code}
              startLine={SNIPPETS.assistant.startLine}
              width={900}
              fontSize={16}
              typeOver={[seconds(2.4), seconds(6.0)]}
            />
          </div>
        </AbsoluteFill>
      </Sequence>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 44 }}>
        <SectionTitle
          from={seconds(0.4)}
          until={seconds(3.4)}
          size={42}
          style={{ background: "rgba(7,9,13,0.8)", padding: "18px 40px", borderRadius: 999 }}
        >
          I built the assistant as its own AI layer.
        </SectionTitle>
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-end", paddingBottom: 34 }}>
        <p
          style={{
            margin: 0,
            font: `400 17px/1 ${FONTS.body}`,
            color: COLORS.textFaint,
            opacity: toCode,
          }}
        >
          One interface, three implementations — the provider is an environment variable, not a rewrite.
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
