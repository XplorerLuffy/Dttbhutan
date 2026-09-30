import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../theme";
import { useSceneSeconds } from "../timing";
import { BrowserFrame } from "../components/BrowserFrame";
import { CodeWindow } from "../components/CodeWindow";
import { DataFlow } from "../components/DataFlow";
import { SNIPPETS } from "../data/codeSnippets";
import { SDF_REPLY } from "../data/productionReplies";

/**
 * 145–160s. One question, all the way through.
 *
 * The question is the brief's — and it is a good choice, because the Sustainable
 * Development Fee is exactly the kind of thing a general model will answer
 * confidently and wrongly. The flow runs, the real SQL appears beneath it, and
 * then the answer: a photograph of the real assistant showing the reply
 * production actually gave to this question.
 *
 * Nothing on screen is written for the video. The answer's caution — "the exact
 * amount can vary by nationality" — is the assistant's own, and is the point:
 * it is repeating what the knowledge base says rather than inventing a figure.
 */
export const RAG: React.FC = () => {
  const t = useSceneSeconds();
  const frame = useCurrentFrame();

  const answerAt = t(8.2);
  const toAnswer = interpolate(frame, [answerAt, answerAt + t(1.1)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: COLORS.ink }}>
      <AbsoluteFill style={{ opacity: 1 - toAnswer, alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 1600 }}>
          <p
            style={{
              margin: "0 0 10px",
              font: `600 15px/1 ${FONTS.body}`,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: COLORS.gold400,
            }}
          >
            A traveller asks
          </p>
          <p
            style={{
              margin: "0 0 56px",
              font: `600 40px/1.3 ${FONTS.display}`,
              color: COLORS.text,
              opacity: interpolate(frame, [t(0.3), t(1.1)], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            &ldquo;{SDF_REPLY.question}&rdquo;
          </p>

          <DataFlow
            width={1600}
            runOver={[t(1.4), t(6.4)]}
            steps={[
              { label: "Question", note: "POST /api/chat" },
              { label: "search_knowledge", note: "one of 8 tools" },
              { label: "Embed the query", note: "vector(768)" },
              { label: "Vector search", note: "pgvector, cosine" },
              { label: "Relevant passages", note: "top 5, ranked" },
              { label: "Answer", note: "grounded in them" },
            ]}
          />

          <div
            style={{
              marginTop: 52,
              display: "flex",
              justifyContent: "center",
              opacity: interpolate(frame, [t(4.6), t(5.4)], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            <CodeWindow
              path={SNIPPETS.retrieval.path}
              code={SNIPPETS.retrieval.code}
              startLine={SNIPPETS.retrieval.startLine}
              width={1160}
              fontSize={16}
              typeOver={[t(5.0), t(7.8)]}
            />
          </div>
        </div>
      </AbsoluteFill>

      <Sequence from={answerAt}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", background: COLORS.ink }}>
          <BrowserFrame
            src="assistant-answer-sdf"
            width={1620}
            height={1012}
            url="dttbhutan.vercel.app/assistant"
          />
          <p
            style={{
              position: "absolute",
              bottom: 32,
              margin: 0,
              font: `400 18px/1 ${FONTS.mono}`,
              color: COLORS.textFaint,
              opacity: interpolate(frame - answerAt, [t(1.4), t(2.0)], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            the answer production gave
          </p>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
