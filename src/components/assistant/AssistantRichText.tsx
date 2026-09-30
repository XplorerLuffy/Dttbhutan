import { Fragment } from "react";

/**
 * Renders the small amount of Markdown a language model actually emits.
 *
 * Models write `**bold**`, bullet lists and numbered lists whether or not you
 * ask them to, and printed literally that is what a visitor sees: asterisks
 * around every package name. A full Markdown library would do this, but it is
 * a dependency and a parser for syntax this never needs — tables, images,
 * links, HTML blocks, footnotes.
 *
 * Deliberately builds React elements rather than an HTML string. There is no
 * `dangerouslySetInnerHTML` anywhere in here, so model output — which is the
 * least trusted text on the page, and can quote a visitor verbatim — cannot
 * introduce markup no matter what it contains. Anything this doesn't
 * understand falls through as plain text, which is the safe direction: an
 * unstyled line still reads, a broken one doesn't.
 */

type Block =
  | { kind: "p"; lines: string[] }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] };

const BULLET = /^\s*[-*•]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;
/** Leading #s — models add headings to structure an answer; we keep the text
 * and drop the hashes rather than rendering an <h1> inside a chat bubble. */
const HEADING = /^\s*#{1,6}\s+(.*)$/;

function parse(text: string): Block[] {
  const blocks: Block[] = [];

  for (const raw of text.split("\n")) {
    const line = raw.replace(HEADING, "$1");
    const last = blocks[blocks.length - 1];

    if (!line.trim()) {
      // A blank line ends whatever was open; it never starts a block of its
      // own, so runs of blank lines collapse instead of making empty gaps.
      if (last && last.kind === "p" && last.lines.length === 0) blocks.pop();
      if (last) blocks.push({ kind: "p", lines: [] });
      continue;
    }

    const bullet = line.match(BULLET);
    if (bullet) {
      if (last?.kind === "ul") last.items.push(bullet[1]);
      else blocks.push({ kind: "ul", items: [bullet[1]] });
      continue;
    }

    const numbered = line.match(NUMBERED);
    if (numbered) {
      if (last?.kind === "ol") last.items.push(numbered[1]);
      else blocks.push({ kind: "ol", items: [numbered[1]] });
      continue;
    }

    if (last?.kind === "p" && last.lines.length > 0) last.lines.push(line);
    else blocks.push({ kind: "p", lines: [line] });
  }

  return blocks.filter((b) => (b.kind === "p" ? b.lines.length > 0 : b.items.length > 0));
}

/** `**bold**` only. Italics are left alone on purpose: a single `*` is far
 * more often a bullet or a literal asterisk in these replies than emphasis,
 * and mis-parsing it would eat characters. */
function inline(text: string, keyPrefix: string): React.ReactNode[] {
  return text.split(/\*\*(.+?)\*\*/g).map((part, index) =>
    index % 2 === 1 ? (
      <strong key={`${keyPrefix}-${index}`} className="font-semibold text-stone-900">
        {part}
      </strong>
    ) : (
      <Fragment key={`${keyPrefix}-${index}`}>{part}</Fragment>
    )
  );
}

export default function AssistantRichText({ text }: { text: string }) {
  const blocks = parse(text);

  return (
    <>
      {blocks.map((block, i) => {
        if (block.kind === "ul") {
          return (
            <ul key={i} className="my-2 space-y-1 first:mt-0 last:mb-0">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-2">
                  <span aria-hidden className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-brass-500" />
                  <span className="min-w-0">{inline(item, `${i}-${j}`)}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (block.kind === "ol") {
          return (
            <ol key={i} className="my-2 space-y-1 first:mt-0 last:mb-0">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-2">
                  <span aria-hidden className="shrink-0 font-semibold text-brass-600">
                    {j + 1}.
                  </span>
                  <span className="min-w-0">{inline(item, `${i}-${j}`)}</span>
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p key={i} className="my-2 first:mt-0 last:mb-0">
            {block.lines.map((line, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {inline(line, `${i}-${j}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}
