import Link from "next/link";
import { LEGAL_REVIEWED } from "@/lib/legal";

/**
 * Renders the small markup used by editable page sections.
 *
 * Deliberately not HTML and deliberately not a Markdown library. Everything
 * below is emitted as React elements with the text passed as children, so
 * React escapes it — there is no `dangerouslySetInnerHTML` anywhere and
 * therefore nothing an admin could type that would execute. A full Markdown
 * renderer would accept raw HTML by default and turn this into a
 * sanitisation problem.
 *
 * Supported, and nothing else:
 *   blank line            paragraph break
 *   - item                bullet list (consecutive lines group together)
 *   **bold**
 *   [label](/path)        link; only same-site paths and https:// URLs
 *   ==text==              a figure still pending legal confirmation
 *   {{cancellation-tiers}} on its own line, the refund table
 */

type Block =
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "slot"; name: string };

function parseBlocks(body: string): Block[] {
  const blocks: Block[] = [];
  let bullets: string[] = [];

  const flush = () => {
    if (bullets.length) {
      blocks.push({ kind: "ul", items: bullets });
      bullets = [];
    }
  };

  for (const chunk of body.replace(/\r\n/g, "\n").split(/\n\s*\n/)) {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    for (const line of lines) {
      const slot = line.match(/^\{\{([a-z-]+)\}\}$/);
      if (slot) {
        flush();
        blocks.push({ kind: "slot", name: slot[1] });
      } else if (line.startsWith("- ")) {
        bullets.push(line.slice(2));
      } else {
        flush();
        blocks.push({ kind: "p", text: line });
      }
    }
    flush();
  }
  flush();
  return blocks;
}

/** A link target an admin is allowed to produce: same-site, or explicit https. */
function safeHref(href: string): string | null {
  const trimmed = href.trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  if (/^https:\/\/[^\s]+$/i.test(trimmed)) return trimmed;
  return null;
}

/** Splits one line into text, bold, links and pending-confirmation marks. */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const pattern = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)|==(.+?)==/g;
  const out: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const key = `${keyPrefix}-${i++}`;

    if (match[1] !== undefined) {
      out.push(<strong key={key}>{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      const href = safeHref(match[3]);
      // An unusable target renders as plain text rather than a dead or
      // unexpected link — silently dropping the label would lose content.
      out.push(
        href ? (
          <Link key={key} href={href} className="text-brand-700 hover:underline">
            {match[2]}
          </Link>
        ) : (
          match[2]
        )
      );
    } else if (match[4] !== undefined) {
      // Same rule as the old <Confirm> component: once the pages have been
      // through legal review the highlight disappears, because by then the
      // figure has been confirmed and marking it would just look unfinished.
      out.push(
        LEGAL_REVIEWED ? (
          match[4]
        ) : (
          <mark
            key={key}
            className="rounded bg-amber-100 px-1 text-amber-900"
            title="Confirm this value reflects your actual policy"
          >
            {match[4]}
          </mark>
        )
      );
    }
    last = pattern.lastIndex;
  }

  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function RichText({
  body,
  slots,
}: {
  body: string;
  /** Rendered in place of a `{{name}}` line — used for the refund table. */
  slots?: Record<string, React.ReactNode>;
}) {
  return (
    <>
      {parseBlocks(body).map((block, i) => {
        if (block.kind === "ul") {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {block.items.map((item, j) => (
                <li key={j}>{renderInline(item, `${i}-${j}`)}</li>
              ))}
            </ul>
          );
        }
        if (block.kind === "slot") {
          return <div key={i}>{slots?.[block.name] ?? null}</div>;
        }
        return <p key={i}>{renderInline(block.text, String(i))}</p>;
      })}
    </>
  );
}
