import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/roles";
import { SECTION_PAGES, getSections, type SectionPageId } from "@/lib/content/sections";
import SectionEditor from "@/components/admin/SectionEditor";

export const metadata = { title: "Page content" };

export default async function AdminPageContent({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect(dashboardPathForRole(user.role));

  const { page } = await searchParams;
  const active =
    SECTION_PAGES.find((p) => p.id === page) ?? SECTION_PAGES[0];
  const { sections, usingDefaults } = await getSections(active.id as SectionPageId);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Page content</h1>
      <p className="mb-6 max-w-2xl text-sm text-stone-600">
        The FAQ and the legal pages, as lists you can add to, reorder and rewrite. For shorter
        wording like headings and company details, use{" "}
        <Link href="/admin/content" className="text-brand-700 hover:underline">
          Site content
        </Link>{" "}
        instead.
      </p>

      <nav className="mb-6 flex flex-wrap gap-1" aria-label="Pages">
        {SECTION_PAGES.map((p) => (
          <Link
            key={p.id}
            href={`/admin/content/pages?page=${p.id}`}
            aria-current={p.id === active.id ? "page" : undefined}
            className={`rounded-md px-3 py-2 text-sm transition-colors ${
              p.id === active.id ? "bg-brand-700 text-white" : "text-stone-700 hover:bg-stone-100"
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
