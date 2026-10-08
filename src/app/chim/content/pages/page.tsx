import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import {
  SECTION_PAGES,
  getSections,
  type SectionPageId,
} from "@/lib/content/sections";
import SectionEditor from "@/components/admin/SectionEditor";

export const metadata = { title: "Page content" };

export default async function AdminPageContent({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null; // the admin layout shows the sign-in form
  if (user.role !== "ADMIN") return null; // the admin layout shows the sign-in form

  const { page } = await searchParams;
  const active = SECTION_PAGES.find((p) => p.id === page) ?? SECTION_PAGES[0];
  const { sections, usingDefaults } = await getSections(
    active.id as SectionPageId,
  );

  return (
    <div className="space-y-6">
      <section className="relative isolate overflow-hidden rounded-2xl border border-stone-200 bg-[#fcf6e9]">
        <Image
          src="/media/packages/dzong-ridge.webp"
          alt=""
          fill
          sizes="(min-width: 1024px) 70vw, 100vw"
          className="-z-10 object-cover object-right opacity-60"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#fcf6e9] via-[#fcf6e9]/90 to-transparent" />
        <div className="px-5 py-7 sm:px-8 sm:py-9">
          <div>
            <h1
              data-hero
              className="font-display text-3xl font-semibold text-stone-900 sm:text-4xl"
            >
              Page content
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-stone-700 sm:text-base">
              The FAQ and the legal pages, as lists you can add to, reorder and
              rewrite. For shorter wording like headings and company details,
              use{" "}
              <Link
                href="/chim/content"
                className="font-medium text-brand-700 underline"
              >
                Site content
              </Link>{" "}
              instead.
            </p>
          </div>
        </div>
      </section>

      <nav className="flex flex-wrap gap-1.5" aria-label="Pages">
        {SECTION_PAGES.map((p) => (
          <Link
            key={p.id}
            href={`/chim/content/pages?page=${p.id}`}
            aria-current={p.id === active.id ? "page" : undefined}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              p.id === active.id
                ? "bg-brand-800 text-white"
                : "border border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </nav>

      <SectionEditor
        key={active.id}
        page={active.id}
        pageLabel={active.label}
        grouped={active.grouped}
        initial={sections}
        usingDefaults={usingDefaults}
      />
    </div>
  );
}
