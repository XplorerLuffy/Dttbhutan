import { pageMetadata } from "@/lib/pageMeta";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getSiteContent } from "@/lib/content";
import { getSections } from "@/lib/content/sections";
import RichText from "@/components/RichText";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("faq", "/faq");
}

/**
 * Questions and categories are editable under /chim/content/pages.
 *
 * The shipped defaults deliberately avoid quoting exact SDF and visa fee
 * amounts: those are set by the government, change from time to time, and
 * vary by nationality, so a figure typed in here would silently go stale
 * and mislead travellers.
 */
export default async function FaqPage() {
  const [content, { sections }] = await Promise.all([getSiteContent(), getSections("faq")]);

  // Grouped by category, in the order each category first appears, so
  // reordering questions in admin reorders the page predictably.
  const categories: { name: string; items: typeof sections }[] = [];
  for (const item of sections) {
    const name = item.group?.trim() || "Questions";
    const existing = categories.find((c) => c.name === name);
    if (existing) existing.items.push(item);
    else categories.push({ name, items: [item] });
  }

  const slug = (name: string) =>
    "faq-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  return (
    <div className="pb-10">
      <JsonLd data={[faqJsonLd(sections), breadcrumbJsonLd([{ name: "FAQ", path: "/faq" }])]} />

      <section className="relative isolate overflow-hidden bg-brand-950">
        <Image
          src="/media/packages/dzong-ridge.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover opacity-45"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-950/70 via-brand-950/40 to-brand-950/80" />
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-14">
          {content("faq.eyebrow") && (
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-gold-300">
              {content("faq.eyebrow")}
            </p>
          )}
          <h1 className="text-balance font-display text-3xl font-semibold leading-tight text-white sm:text-5xl">
            {content("faq.heading")}
          </h1>
          {content("faq.intro") && (
            <p className="mt-3 text-base leading-relaxed text-white/90 sm:text-[17px]">
              {content("faq.intro")}
            </p>
          )}
          {content("faq.ask.label") && (
            <Link
              href="/contact"
              className="mt-5 inline-block rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-brand-900 hover:bg-stone-100"
            >
              {content("faq.ask.label")}
            </Link>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {categories.length > 1 && (
          <nav aria-label="Question topics" className="mt-6 flex flex-wrap gap-2">
            {categories.map((category) => (
              <a
                key={category.name}
                href={`#${slug(category.name)}`}
                className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm hover:border-brand-300 hover:text-brand-800"
              >
                {category.name}
              </a>
            ))}
          </nav>
        )}

        {categories.map((category) => (
          <section key={category.name} id={slug(category.name)} className="mt-8 scroll-mt-24">
            <h2 className="mb-4 font-display text-2xl font-semibold text-stone-900">{category.name}</h2>
            <div className="space-y-3">
              {category.items.map((item) => (
                <details
                  key={item.id}
                  className="group rounded-2xl border border-stone-200 bg-white px-5 py-4 shadow-sm transition-shadow open:shadow-md"
                >
                  <summary className="cursor-pointer list-none font-semibold text-stone-900 marker:hidden">
                    <span className="flex items-start justify-between gap-4">
                      {item.heading}
                      <span
                        aria-hidden
                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-100 text-base leading-none text-gold-700 transition-transform group-open:rotate-45"
                      >
                        +
                      </span>
                    </span>
                  </summary>
                  <div className="mt-3 space-y-2 border-t border-stone-100 pt-3 text-[15px] leading-relaxed text-stone-700">
                    <RichText body={item.body} />
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}

        <section className="mt-10 flex flex-col gap-4 rounded-3xl bg-brand-900 px-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          {content("faq.cta.text") && (
            <p className="max-w-md font-display text-lg text-white sm:text-xl">{content("faq.cta.text")}</p>
          )}
          {content("faq.cta.button") && (
            <Link
              href="/contact"
              className="inline-block shrink-0 self-start rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-brand-900 hover:bg-stone-100 sm:self-auto"
            >
              {content("faq.cta.button")}
            </Link>
          )}
        </section>
      </div>
    </div>
  );
}
