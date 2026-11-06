import Link from "next/link";
import { parseArticle, parseInline, tableOfContents, type Block } from "@/lib/articleFormat";

function Inline({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((p, i) =>
        p.href ? (
          p.href.startsWith("/") ? (
            <Link key={i} href={p.href} className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-900">
              {p.text}
            </Link>
          ) : (
            <a key={i} href={p.href} rel="noopener noreferrer" className="font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-900">
              {p.text}
            </a>
          )
        ) : p.bold ? (
          <strong key={i} className="font-semibold text-stone-900">
            {p.text}
          </strong>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </>
  );
}

function BlockView({ block, lead }: { block: Block; lead: boolean }) {
  switch (block.type) {
    case "heading":
      return block.level === 2 ? (
        <h2
          id={block.id}
          className="mb-4 mt-12 scroll-mt-24 border-l-4 border-gold-500 pl-4 font-display text-2xl font-semibold leading-snug text-brand-900 sm:text-[1.7rem]"
        >
          <Inline text={block.text} />
        </h2>
      ) : (
        <h3 id={block.id} className="mb-3 mt-8 scroll-mt-24 font-display text-xl font-semibold text-stone-900">
          <Inline text={block.text} />
        </h3>
      );
    case "paragraph":
      return (
        <p className={lead ? "mb-6 text-lg leading-8 text-stone-800 sm:text-xl sm:leading-9" : "mb-5 text-[17px] leading-8 text-stone-700"}>
          <Inline text={block.text} />
        </p>
      );
    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag className="my-6 space-y-3">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
              {block.ordered ? (
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-900 text-xs font-semibold text-white">
                  {i + 1}
                </span>
              ) : (
                <span aria-hidden className="mt-3 h-2 w-2 shrink-0 rounded-full bg-gold-500" />
              )}
              <span className="text-[17px] leading-7 text-stone-700">
                {item.label && <strong className="font-semibold text-brand-900">{item.label}: </strong>}
                <Inline text={item.text} />
              </span>
            </li>
          ))}
        </Tag>
      );
    }
    case "table":
      return (
        <div className="my-8 overflow-x-auto rounded-xl border border-stone-200 shadow-sm">
          <table className="w-full min-w-[28rem] border-collapse text-left text-[15px]">
            <thead>
              <tr className="bg-brand-900 text-white">
                {block.head.map((h, i) => (
                  <th key={i} scope="col" className="px-4 py-3 font-semibold">
                    <Inline text={h} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r} className="border-t border-stone-200 odd:bg-white even:bg-stone-50">
                  {row.map((cell, c) => (
                    <td key={c} className={`px-4 py-3 align-top leading-6 ${c === 0 ? "font-semibold text-stone-900" : "text-stone-700"}`}>
                      <Inline text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "quote":
      return (
        <blockquote className="my-8 rounded-r-xl border-l-4 border-gold-500 bg-gold-50 px-5 py-4 text-[17px] italic leading-8 text-stone-800">
          <Inline text={block.text} />
        </blockquote>
      );
  }
}

/** An article's text with real headings, lists, tables and a short contents list when it has several sections. */
export default function ArticleBody({ content }: { content: string }) {
  const blocks = parseArticle(content);
  const toc = tableOfContents(blocks);
  const firstParagraph = blocks.findIndex((b) => b.type === "paragraph");

  return (
    <div>
      {toc.length >= 3 && (
        <nav aria-label="In this article" className="mb-8 rounded-xl border border-stone-200 bg-stone-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">In this article</p>
          <ol className="mt-3 space-y-1.5">
            {toc.map((t, i) => (
              <li key={t.id} className="flex gap-2 text-[15px]">
                <span className="w-5 shrink-0 text-right font-semibold text-gold-600">{i + 1}.</span>
                <a href={`#${t.id}`} className="text-brand-800 hover:underline">
                  {t.text}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}
      {blocks.map((b, i) => (
        <BlockView key={i} block={b} lead={i === firstParagraph && firstParagraph === 0} />
      ))}
    </div>
  );
}
