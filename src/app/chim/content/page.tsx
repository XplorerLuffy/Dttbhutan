import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { getSiteContent } from "@/lib/content";
import { CONTENT_GROUPS } from "@/lib/content/registry";
import ContentEditor from "@/components/admin/ContentEditor";

export const metadata = { title: "Site content" };

export default async function AdminContentPage() {
  const user = await getCurrentUser();
  if (!user) return null; // the admin layout shows the sign-in form
  if (user.role !== "ADMIN") return null; // the admin layout shows the sign-in form

  const content = await getSiteContent();

  const fieldCount = CONTENT_GROUPS.reduce((n, g) => n + g.fields.length, 0);
  const stats = [
    { label: "Sections", value: CONTENT_GROUPS.length },
    { label: "Editable fields", value: fieldCount },
  ];

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
          <h1 data-hero className="font-display text-3xl font-semibold text-stone-900 sm:text-4xl">
            Site content
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-stone-700 sm:text-base">
            Wording shown across the public site. Changes appear immediately — there is no separate
            publish step. Figures counted from real data, like the number of tour packages or the
            average review score, aren&apos;t editable here on purpose.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" aria-label="Summary">
        {stats.map((c) => (
          <div key={c.label} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
            <p className="text-sm font-medium text-stone-600">{c.label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-stone-900 sm:text-3xl">{c.value}</p>
          </div>
        ))}
        <div className="col-span-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5">
          <p className="text-sm font-medium text-emerald-900">Goes live instantly</p>
          <p className="mt-1 text-sm text-emerald-800">Save a section and visitors see it straight away.</p>
        </div>
      </section>

      <ContentEditor groups={CONTENT_GROUPS} initial={content.all} />
    </div>
  );
}
