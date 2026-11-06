/**
 * Turns an article's stored text into structured blocks for display.
 *
 * Two kinds of text arrive here. New text can use light markup:
 *
 *   ## Heading           ### Smaller heading
 *   - bullet             1. numbered step
 *   > a quotation or tip
 *   | Colour | Element |    (a table: header row, a |---| row, then rows)
 *   **bold**  and  [link text](/packages)
 *
 * Older articles, and text pasted from a document, have none of that: every
 * line is its own paragraph, so headings, lists and tables arrive flattened.
 * For those, plain blocks are read with conservative guesses (see `guess`).
 * A guess can be wrong; adding the markup above always overrides it.
 */
export type Block =
  | { type: "heading"; level: 2 | 3; text: string; id: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: { label?: string; text: string }[] }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "quote"; text: string };

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/\*\*/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

type Chunk = { kind: "block"; block: Block } | { kind: "plain"; text: string };

const TABLE_SEPARATOR = /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/;

const splitRow = (line: string) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());

/** First pass: recognise explicit markup, leave everything else as plain text blocks. */
function readMarkup(content: string): Chunk[] {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const chunks: Chunk[] = [];
  let plain: string[] = [];
  const flush = () => {
    if (plain.length) chunks.push({ kind: "plain", text: plain.join(" ").replace(/\s+/g, " ").trim() });
    plain = [];
  };
  const ids = new Set<string>();
  const heading = (level: 2 | 3, text: string): Block => {
    let id = slugifyHeading(text) || "section";
    for (let n = 2; ids.has(id); n++) id = `${slugifyHeading(text) || "section"}-${n}`;
    ids.add(id);
    return { type: "heading", level, text, id };
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      flush();
      continue;
    }
    const h = /^(#{1,3})\s+(.+)$/.exec(line);
    if (h) {
      flush();
      chunks.push({ kind: "block", block: heading(h[1].length === 3 ? 3 : 2, h[2].trim()) });
      continue;
    }
    if (line.startsWith("|") && lines[i + 1] && TABLE_SEPARATOR.test(lines[i + 1].trim())) {
      flush();
      const head = splitRow(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith("|")) rows.push(splitRow(lines[i++]));
      i--;
      chunks.push({ kind: "block", block: { type: "table", head, rows: rows.map((r) => head.map((_, c) => r[c] ?? "")) } });
      continue;
    }
    const bullet = /^([-*•])\s+(.+)$/.exec(line);
    const numbered = /^\d{1,2}[.)]\s+(.+)$/.exec(line);
    if (bullet || numbered) {
      flush();
      const ordered = Boolean(numbered);
      const items: { label?: string; text: string }[] = [];
      while (i < lines.length) {
        const l = lines[i].trim();
        const m = ordered ? /^\d{1,2}[.)]\s+(.+)$/.exec(l) : /^([-*•])\s+(.+)$/.exec(l);
        if (!m) break;
        items.push(splitLabel(ordered ? m[1] : m[2]));
        i++;
      }
      i--;
      chunks.push({ kind: "block", block: { type: "list", ordered, items } });
      continue;
    }
    if (line.startsWith(">")) {
      flush();
      const quote: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) quote.push(lines[i++].trim().replace(/^>\s?/, ""));
      i--;
      chunks.push({ kind: "block", block: { type: "quote", text: quote.join(" ").trim() } });
      continue;
    }
    plain.push(line);
  }
  flush();
  return chunks;
}

/** "Peace: Encouraging harmony." -> label "Peace". Only short, capitalised labels count. */
function splitLabel(text: string): { label?: string; text: string } {
  const m = /^(\*\*)?([A-Z][^:*\n]{0,40}?)(\*\*)?:\s+(\S.*)$/.exec(text);
  return m ? { label: m[2].trim(), text: m[4].trim() } : { text };
}

const isLabelled = (t: string) => /^[A-Z][^:\n]{1,40}:\s+\S.+$/.test(t) && !/^https?:/i.test(t);
/** A short single line that is not a sentence: a table cell, a name, or a heading. */
const isShortFragment = (t: string) => t.length <= 70 && !/[.!:;,]$/.test(t) && !/\s{2,}/.test(t);
const looksLikeHeading = (t: string) => {
  const words = t.split(/\s+/).length;
  return isShortFragment(t) && words >= 2 && words <= 12 && /^[A-Z0-9]/.test(t);
};
const isProse = (t: string) => t.length >= 60;

/**
 * Second pass, only over plain blocks that carried no markup. Rules, in order:
 *  1. a run of 4+ short fragments is a table (when it divides into 3, 4 or 2
 *     columns with enough rows) or otherwise a bullet list;
 *  2. a run of 2+ "Label: sentence" blocks is a bulleted list with bold labels;
 *  3. a short line without a full stop, followed by a paragraph, is a heading.
 */
function guess(chunks: Chunk[]): Block[] {
  const out: Block[] = [];
  const ids = new Set<string>(
    chunks.flatMap((c) => (c.kind === "block" && c.block.type === "heading" ? [c.block.id] : []))
  );
  const makeHeading = (text: string): Block => {
    const base = slugifyHeading(text) || "section";
    let id = base;
    for (let n = 2; ids.has(id); n++) id = `${base}-${n}`;
    ids.add(id);
    return { type: "heading", level: 2, text, id };
  };

  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];
    if (c.kind === "block") {
      out.push(c.block);
      continue;
    }

    // 1. table / list from a run of short fragments
    let j = i;
    while (j < chunks.length && chunks[j].kind === "plain" && isShortFragment((chunks[j] as { text: string }).text)) j++;
    const run = chunks.slice(i, j).map((x) => (x as { text: string }).text);
    if (run.length >= 4) {
      const k = [3, 4, 2].find((cols) => run.length % cols === 0 && run.length / cols >= (cols === 2 ? 4 : 3) && run.length >= 8);
      if (k) {
        const cells = run;
        const rows: string[][] = [];
        for (let r = 0; r < cells.length; r += k) rows.push(cells.slice(r, r + k));
        out.push({ type: "table", head: rows[0], rows: rows.slice(1) });
      } else {
        out.push({ type: "list", ordered: false, items: run.map((text) => ({ text })) });
      }
      i = j - 1;
      continue;
    }

    // 2. "Label: sentence" run
    if (isLabelled(c.text)) {
      let e = i;
      while (e < chunks.length && chunks[e].kind === "plain" && isLabelled((chunks[e] as { text: string }).text)) e++;
      if (e - i >= 2) {
        out.push({
          type: "list",
          ordered: false,
          items: chunks.slice(i, e).map((x) => splitLabel((x as { text: string }).text)),
        });
        i = e - 1;
        continue;
      }
    }

    // 3. heading
    const next = chunks[i + 1];
    if (looksLikeHeading(c.text) && next && ((next.kind === "plain" && isProse(next.text)) || next.kind === "block")) {
      out.push(makeHeading(c.text));
      continue;
    }

    out.push({ type: "paragraph", text: c.text });
  }
  return out;
}

export function parseArticle(content: string): Block[] {
  return guess(readMarkup(content));
}

export type InlinePart = { text: string; bold?: boolean; href?: string };

/** **bold** and [text](url). Only http(s), mailto and site-relative links are kept as links. */
export function parseInline(text: string): InlinePart[] {
  const parts: InlinePart[] = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index) });
    if (m[1] !== undefined) parts.push({ text: m[1], bold: true });
    else if (/^(https?:\/\/|mailto:|\/(?!\/))/.test(m[3])) parts.push({ text: m[2], href: m[3] });
    else parts.push({ text: m[2] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

export function tableOfContents(blocks: Block[]): { id: string; text: string }[] {
  return blocks.flatMap((b) => (b.type === "heading" && b.level === 2 ? [{ id: b.id, text: b.text }] : []));
}
