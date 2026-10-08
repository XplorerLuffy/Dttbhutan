import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminTravelGuidePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) return null; // the admin layout shows the sign-in form
  if (user.role !== "ADMIN") return null; // the admin layout shows the sign-in form

  const sp = await searchParams;
  const raw = (Array.isArray(sp.status) ? sp.status[0] : sp.status)?.toUpperCase() ?? "";
  const filter = raw === "PUBLISHED" || raw === "DRAFT" ? raw : "";

  const all = await prisma.article.findMany({ orderBy: { createdAt: "desc" } });
  const published = all.filter((a) => a.status === "PUBLISHED").length;
  const drafts = all.filter((a) => a.status === "DRAFT").length;
  const articles = filter ? all.filter((a) => a.status === filter) : all;
  const tabs = [
    { value: "", label: "All", count: all.length },
    { value: "PUBLISHED", label: "Published", count: published },
    { value: "DRAFT", label: "Drafts", count: drafts },
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
        <div className="flex flex-wrap items-end justify-between gap-4 px-5 py-7 sm:px-8 sm:py-9">
          <div>
            <h1 data-hero className="font-display text-3xl font-semibold text-stone-900 sm:text-4xl">
              Travel guide articles
            </h1>
            <p className="mt-1.5 max-w-md text-sm text-stone-700 sm:text-base">
              Write and publish the tips, visa notes and seasonal advice travelers read.
            </p>
          </div>
          <Link href="/chim/travel-guide/new" className="btn-primary">
            + New article
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3 sm:gap-4" aria-label="Summary">
        {tabs.map((c) => (
          <Link
            key={c.label}
            href={c.value ? `?status=${c.value}` : "?"}
            className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
          >
            <p className="text-sm font-medium text-stone-600">{c.value ? c.label : "All articles"}</p>
            <p className="mt-1 font-display text-2xl font-bold text-stone-900 sm:text-3xl">{c.count}</p>
          </Link>
        ))}
      </section>

      <div className="flex flex-wrap gap-1.5">
        {tabs.map((t) => {
          const on = t.value === filter;
          return (
            <Link
              key={t.value || "all"}
              href={t.value ? `?status=${t.value}` : "?"}
              aria-current={on ? "true" : undefined}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
                on
                  ? "bg-brand-800 text-white"
                  : "border border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900"
              }`}
            >
              {t.label}
              <span className={on ? "ml-1.5 text-white/70" : "ml-1.5 text-stone-400"}>{t.count}</span>
            </Link>
          );
        })}
      </div>

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        {articles.length === 0 ? (
          <p className="rounded-xl bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
            {filter ? "No articles with that status." : "No articles yet."}
          </p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {articles.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 py-3.5 first:pt-0 last:pb-0">
                <div className="flex min-w-0 flex-1 basis-64 items-center gap-3">
                  <span className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                    {a.coverPhotoUrl && (
                      // Admin-entered address from any host; next/image would want each allow-listed.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.coverPhotoUrl} alt="" className="h-full w-full object-cover" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium">
                      {a.title}{" "}
                      <span className={a.status === "PUBLISHED" ? "badge-approved" : "badge-pending"}>{a.status}</span>
                    </p>
                    <p className="text-sm text-stone-500">
                      {a.category} · {a.readMinutes} min read
                    </p>
                  </div>
                </div>
                <Link href={`/chim/travel-guide/${a.id}/edit`} className="btn-secondary shrink-0">
                  Edit
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
