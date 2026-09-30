import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../theme";

/**
 * An editor pane showing code copied out of the DTT Bhutan repository.
 *
 * Every snippet passed to this is real, unedited except for trimming to the
 * lines that fit — the file path in the title bar is where it lives, so any
 * line on screen can be looked up. Nothing here is written to illustrate a
 * point.
 *
 * Highlighting is deliberately crude: one regex pass over the TypeScript the
 * project actually contains. A full grammar would be a dependency, and the
 * point of the shot is that the code is real, not that the colours are
 * perfect.
 */
const KEYWORDS =
  /\b(import|from|export|const|let|async|await|function|return|if|else|for|of|in|new|throw|try|catch|type|interface|class|extends|implements|as|null|undefined|true|false|this|void|Promise|string|number|boolean)\b/;

type Token = { text: string; color: string };

function tokenize(line: string): Token[] {
  const out: Token[] = [];
  // Comments swallow the rest of the line.
  const comment = line.match(/(\/\/.*|\/\*.*|^\s*\*.*)$/);
  let body = line;
  let tail: Token | null = null;
  if (comment && comment.index !== undefined) {
    body = line.slice(0, comment.index);
    tail = { text: comment[0], color: "rgba(232,234,237,0.34)" };
  }

  const parts = body.split(/(\s+|[(){}[\],;:.<>=!?&|+\-*/]|"[^"]*"|'[^']*'|`[^`]*`)/).filter((p) => p !== "" && p !== undefined);
  for (const part of parts) {
    if (/^["'`]/.test(part)) out.push({ text: part, color: "#a5d6a7" });
    else if (KEYWORDS.test(part) && /^[a-zA-Z]+$/.test(part)) out.push({ text: part, color: COLORS.gold300 });
    else if (/^[A-Z][A-Za-z0-9_]*$/.test(part)) out.push({ text: part, color: COLORS.brand300 });
    else if (/^\d+$/.test(part)) out.push({ text: part, color: "#f5b94f" });
    else if (/^[(){}[\],;:.<>=!?&|+\-*/]$/.test(part)) out.push({ text: part, color: "rgba(232,234,237,0.5)" });
    else out.push({ text: part, color: COLORS.text });
  }
  if (tail) out.push(tail);
  return out;
}

export const CodeWindow: React.FC<{
  /** Where this code lives in the repository. Shown as the window's title. */
  path: string;
  code: string;
  width?: number;
  fontSize?: number;
  /** Frames over which the lines type on, one after another. */
  typeOver?: [number, number];
  /** 1-based line numbers to mark as the point of the shot. */
  highlight?: number[];
  startLine?: number;
  style?: React.CSSProperties;
}> = ({ path, code, width = 940, fontSize = 20, typeOver, highlight = [], startLine = 1, style }) => {
  const frame = useCurrentFrame();
  const lines = code.replace(/\n+$/, "").split("\n");

  const shown = typeOver
    ? Math.round(
        interpolate(frame, typeOver, [0, lines.length], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      )
    : lines.length;

  const gutter = String(startLine + lines.length).length * (fontSize * 0.62) + 26;

  return (
    <div
      style={{
        width,
        borderRadius: 12,
        overflow: "hidden",
        background: "#0b0f14",
        border: `1px solid ${COLORS.line}`,
        boxShadow: "0 50px 110px -40px rgba(0,0,0,0.9)",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 18px",
          background: "#12171e",
          borderBottom: `1px solid ${COLORS.line}`,
        }}
      >
        <div style={{ display: "flex", gap: 7 }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <span key={c} style={{ width: 10, height: 10, borderRadius: 999, background: c }} />
          ))}
        </div>
        <span style={{ font: `500 15px/1 ${FONTS.mono}`, color: "rgba(232,234,237,0.62)" }}>{path}</span>
      </div>

      <div style={{ padding: "18px 0 22px" }}>
        {lines.slice(0, shown).map((line, i) => {
          const lineNo = startLine + i;
          const isHot = highlight.includes(lineNo);
          return (
            <div
              key={i}
              style={{
                display: "flex",
                font: `400 ${fontSize}px/${Math.round(fontSize * 1.62)}px ${FONTS.mono}`,
                background: isHot ? "rgba(242,162,39,0.10)" : undefined,
                borderLeft: `3px solid ${isHot ? COLORS.gold400 : "transparent"}`,
                paddingRight: 20,
              }}
            >
              <span
                style={{
                  width: gutter,
                  textAlign: "right",
                  paddingRight: 18,
                  color: "rgba(232,234,237,0.22)",
                  flexShrink: 0,
                }}
              >
                {lineNo}
              </span>
              <span style={{ whiteSpace: "pre", minWidth: 0 }}>
                {tokenize(line).map((t, j) => (
                  <span key={j} style={{ color: t.color }}>
                    {t.text}
                  </span>
                ))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
