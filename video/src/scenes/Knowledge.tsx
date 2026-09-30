import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../theme";
import { useSceneSeconds } from "../timing";
import { Architecture } from "../components/Architecture";
import { BrowserFrame } from "../components/BrowserFrame";
import { CodeWindow } from "../components/CodeWindow";
import { SectionTitle } from "../components/SectionTitle";
import { SNIPPETS } from "../data/codeSnippets";
import { FACTS, KNOWLEDGE_SOURCES } from "../data/projectFacts";

/**
 * 125–145s. Teaching it about Bhutan — the longest and most technical chapter.
 *
 * Three beats. What the knowledge is made of, where it comes from, and the
 * screen the agency maintains it on. The sources listed are the ones the
 * knowledge base actually holds: packages, destinations and articles indexed
 * from the database, plus hand-written visa, SDF and policy documents. The
 * counts are the real row counts.
 *
 * The admin screen matters here more than it looks: it is the difference
 * between a demo, where knowledge is whatever was seeded once, and a product,
 * where the agency can correct what the assistant says without a developer.
 */
export const Knowledge: React.FC = () => {
  const t = useSceneSeconds();
  const frame = useCurrentFrame();

  const sourcesIn = interpolate(frame, [t(4.4), t(5.6)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: COLORS.ink }}>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "flex-start", paddingTop: 50 }}>
        <SectionTitle from={t(0.3)} until={t(3.4)} size={42}>
          I didn&rsquo;t want it to simply answer from general AI knowledge.
        </SectionTitle>
        <div style={{ position: "absolute", top: 50 }}>
          <SectionTitle from={t(4.0)} until={t(13.2)} size={42}>
            I built a knowledge layer around Bhutan travel information.
          </SectionTitle>
        </div>
      </AbsoluteFill>

      {/* Beat 1 — the pipeline and the code that performs it. */}
      <Sequence durationInFrames={t(13.4)}>
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 64,
            paddingTop: 76,
          }}
        >
          <Architecture
            width={430}
            accentLast
            nodes={[
              { label: "Travel knowledge", detail: `${FACTS.knowledgeDocuments} documents` },
              { label: "Chunks", detail: `${FACTS.knowledgeChunks} passages, ~900 chars` },
              { label: "Embeddings", detail: `vector(${FACTS.embeddingDimensions})` },
              { label: "pgvector", detail: "KnowledgeChunk.embedding" },
              { label: "Relevant context", detail: "handed to the model" },
            ]}
            revealOver={[t(1.0), t(4.2)]}
          />

          <div style={{ opacity: sourcesIn }}>
            <p
              style={{
                margin: "0 0 16px",
                font: `600 15px/1 ${FONTS.body}`,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: COLORS.gold400,
              }}
            >
              What it knows
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, width: 640, marginBottom: 26 }}>
              {KNOWLEDGE_SOURCES.map((source, i) => {
                const at = t(5.0) + i * 5;
                const on = interpolate(frame, [at, at + 12], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
                return (
                  <div
                    key={source.label}
                    style={{
                      opacity: on,
                      transform: `translateY(${interpolate(on, [0, 1], [10, 0])}px)`,
                      borderRadius: 9,
                      padding: "13px 16px",
                      background: "rgba(255,255,255,0.035)",
                      border: `1px solid ${COLORS.line}`,
                    }}
                  >
                    <p style={{ margin: 0, font: `600 18px/1.25 ${FONTS.body}`, color: COLORS.text }}>
                      {source.label}
                    </p>
                    <p style={{ margin: "4px 0 0", font: `400 14px/1.3 ${FONTS.mono}`, color: COLORS.textFaint }}>
                      {source.note}
                    </p>
                  </div>
                );
              })}
            </div>

            <CodeWindow
              path={SNIPPETS.ingestion.path}
              code={SNIPPETS.ingestion.code}
              startLine={SNIPPETS.ingestion.startLine}
              width={640}
              fontSize={14}
              typeOver={[t(7.6), t(11.4)]}
            />
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Beat 2 — the screen the agency keeps it current from. */}
      <Sequence from={t(13.6)}>
        <AbsoluteFill style={{ background: COLORS.ink, alignItems: "center", justifyContent: "center" }}>
          <BrowserFrame
            src="admin-knowledge"
            width={1560}
            height={975}
            url="dttbhutan.vercel.app/admin/knowledge"
          />
          <p
            style={{
              position: "absolute",
              bottom: 40,
              margin: 0,
              font: `400 21px/1 ${FONTS.body}`,
              color: COLORS.textDim,
              background: "rgba(7,9,13,0.85)",
              padding: "14px 28px",
              borderRadius: 999,
              opacity: interpolate(frame - t(13.6), [t(0.5), t(1.2)], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            The agency edits what it knows — saving re-chunks and re-embeds it.
          </p>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
