import type { Metadata } from "next";
import Link from "next/link";
import { getCompany } from "@/lib/content";
import { getSections } from "@/lib/content/sections";
import RichText from "@/components/RichText";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description:
    "Common questions about visiting Bhutan: visas, the Sustainable Development Fee, guides, booking, payment and cancellations.",
};

/**
 * Questions and categories are editable under /admin/content/pages.
 *
 * The shipped defaults deliberately avoid quoting exact SDF and visa fee
 * amounts: those are set by the government, change from time to time, and
 * vary by nationality, so a figure typed in here would silently go stale
 * and mislead travellers.
 */
export default async function FaqPage() {
  const [company, { sections }] = await Promise.all([getCompany(), getSections("faq")]);

  // Grouped by category, in the order each category first appears, so
  // reordering questions in admin reorders the page predictably.
  const categories: { name: string; items: typeof sections }[] = [];
  for (const item of sections) {
    const name = item.group?.trim() || "Questions";
    const existing = categories.find((c) => c.name === name);
    if (existing) existing.items.push(item);
    else categories.push({ name, items: [item] });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 font-display text-3xl font-bold text-stone-900">
        Frequently asked questions
      </h1>
      <p className="mb-8 text-stone-600">
        The things travellers ask us most. If your question isn&apos;t here,{" "}
        <Link href="/contact" className="text-brand-700 hover:underline">
          just ask us
        </Link>
        .
      </p>

      {categories.map((category) => (
        <section key={category.name} className="mb-8">
          <h2 className="mb-3 font-display text-xl font-semibold text-stone-900">
            {category.name}
          </h2>
          <div className="space-y-2">
            {category.items.map((item) => (
              <details key={item.id} className="card group">
                <summary className="cursor-pointer list-none font-medium text-stone-900 marker:hidden">
                  <span className="flex items-start justify-between gap-3">
                    {item.heading}
                    <span className="mt-0.5 shrink-0 text-stone-400 transition-transform group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <div className="mt-3 space-y-2 text-sm leading-relaxed text-stone-700">
                  <RichText body={item.body} />
                </div>
              </details>
            ))}
          </div>
        </section>
      ))}

      <div className="card text-center">
        <p className="text-sm text-stone-600">
          Still have a question? We usually reply within one working day.
        </p>
        <Link href="/contact" className="btn-primary mt-3 inline-block">
          Contact {company.name}
        </Link>
      </div>
    </div>
  );
}
