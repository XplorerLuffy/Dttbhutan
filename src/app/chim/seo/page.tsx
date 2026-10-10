import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSiteContent } from "@/lib/content";
import { CONTENT_GROUPS } from "@/lib/content/registry";
import ContentEditor from "@/components/admin/ContentEditor";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = { title: "SEO" };

type Check = { ok: boolean; label: string; fix: string; href?: string; weight?: number };
type Issue = { title: string; href: string; problems: string[] };

const len = (s: string | null | undefined) => (s ?? "").trim().length;

/**
 * Search-engine health for the whole site, worked out from the real data.
 *
 * It checks what the site itself controls — titles and descriptions that fit a
 * results page, enough written content, photos, complete business details, a
 * real domain, a verified Search Console. It cannot see Google's rankings or
 * backlinks (nobody can without Google's own tools), so it points to those.
 */
export default async function SeoDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return null; // the admin layout shows the sign-in form

  const content = await getSiteContent();
  const base = siteUrl();

  const [packages, destinations, articles, hotels, guides] = await Promise.all([
    prisma.itinerary.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, title: true, summary: true, description: true, coverPhotoUrl: true, _count: { select: { days: true, photos: true } } },
    }),
    prisma.destination.findMany({ select: { id: true, name: true, description: true, photoUrl: true } }),
    prisma.article.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, title: true, excerpt: true, content: true, coverPhotoUrl: true, updatedAt: true },
    }),
    prisma.hotel.count({ where: { status: "APPROVED" } }),
    prisma.guideProfile.count({ where: { status: "APPROVED" } }),
  ]);

  // --- site-wide checks -------------------------------------------------
  const socials = ["facebook", "instagram", "tripadvisor", "youtube", "tiktok"].filter((k) =>
    content(`company.social.${k}`).trim()
  );
  const technical: Check[] = [
    {
      ok: !/vercel\.app/.test(base),
      label: "The site uses its own domain",
      fix: "Links, the sitemap and search results currently use a vercel.app address. Connect dttbhutan.com in Vercel and set it as the production domain.",
      weight: 3,
    },
    {
      ok: Boolean(content("seo.googleVerification").trim()),
      label: "Verified with Google Search Console",
      fix: "Add the site in Google Search Console, choose the HTML tag method, and paste the code below. Then submit the sitemap.",
      weight: 3,
    },
    {
      ok: Boolean(content("seo.bingVerification").trim()),
      label: "Verified with Bing Webmaster Tools",
      fix: "Bing also powers DuckDuckGo and Yahoo results. Add the site in Bing Webmaster Tools and paste its code below.",
    },
    {
      ok: Boolean(content("company.phone").trim()) && Boolean(content("company.email").trim()),
      label: "Phone and email are filled in",
      fix: "Search engines and the Google listing trust a business with a phone number and email shown consistently.",
      href: "/chim/content",
      weight: 2,
    },
    {
      ok: Boolean(content("company.address.street").trim()),
      label: "Street address is filled in",
      fix: "A full address lets Google show you for local searches such as “tour operator in Thimphu”.",
      href: "/chim/content",
      weight: 2,
    },
    {
      ok: Boolean(content("company.tcbLicenceNumber").trim()),
      label: "TCB licence number is shown",
      fix: "A licence number is a strong trust signal for a tour operator.",
      href: "/chim/content",
    },
    {
      ok: socials.length >= 2,
      label: "At least two social / review profiles are linked",
      fix: "Link Facebook, Instagram, TripAdvisor or YouTube. They are included in the site's structured data and build your brand footprint.",
      href: "/chim/content",
    },
    {
      ok: packages.length >= 6,
      label: "Six or more published tour packages",
      fix: "Each package is a page that can rank for its own search, such as “7 day Bhutan tour”. More well-written packages mean more chances to be found.",
      href: "/chim/packages",
      weight: 2,
    },
    {
      ok: articles.length >= 10,
      label: "Ten or more published travel-guide articles",
      fix: "Articles answer what travellers search before they book (visa, fees, best time to visit). Aim to publish regularly.",
      href: "/chim/travel-guide",
      weight: 2,
    },
  ];

  // --- per-page content checks -------------------------------------------
  const packageIssues: Issue[] = [];
  for (const p of packages) {
    const problems: string[] = [];
    if (len(p.summary) < 70) problems.push("Summary is too short for a search description (aim for 70–160 characters)");
    if (len(p.summary) > 160) problems.push("Summary is longer than Google shows (over 160 characters)");
    if (len(p.description) < 400) problems.push("Description is thin — write at least a few paragraphs");
    if (!p.coverPhotoUrl) problems.push("No cover photo (also the share image)");
    if (p._count.days < 3) problems.push("Fewer than 3 itinerary days written");
    if (p._count.photos < 3) problems.push("Fewer than 3 gallery photos");
    if (problems.length) packageIssues.push({ title: p.title, href: `/chim/packages/${p.id}/edit`, problems });
  }
  const destinationIssues: Issue[] = [];
  for (const d of destinations) {
    const problems: string[] = [];
    if (len(d.description) < 200) problems.push("Description is thin (aim for 200+ characters)");
    if (!d.photoUrl) problems.push("No photo");
    if (problems.length) destinationIssues.push({ title: d.name, href: `/chim/destinations/${d.id}/edit`, problems });
  }
  const articleIssues: Issue[] = [];
  for (const a of articles) {
    const problems: string[] = [];
    if (len(a.excerpt) < 70 || len(a.excerpt) > 160) problems.push("Excerpt should be 70–160 characters (it becomes the search description)");
    if (len(a.content) < 1500) problems.push("Article is short — in-depth pages rank better (aim for 300+ words)");
    if (!a.coverPhotoUrl) problems.push("No cover photo");
    if (problems.length) articleIssues.push({ title: a.title, href: `/chim/travel-guide/${a.id}/edit`, problems });
  }

  const weights = (c: Check) => c.weight ?? 1;
  const techTotal = technical.reduce((n, c) => n + weights(c), 0);
  const techPassed = technical.filter((c) => c.ok).reduce((n, c) => n + weights(c), 0);
  const pageTotal = packages.length + destinations.length + articles.length;
  const pageBad = packageIssues.length + destinationIssues.length + articleIssues.length;
  const techScore = techPassed / techTotal;
  const pageScore = pageTotal ? (pageTotal - pageBad) / pageTotal : 1;
  const score = Math.round((techScore * 0.5 + pageScore * 0.5) * 100);
  const tone = score >= 80 ? "text-emerald-700" : score >= 55 ? "text-amber-700" : "text-red-700";

  const seoGroup = CONTENT_GROUPS.filter((g) => g.id === "seo");
  const initial: Record<string, string> = {};
  for (const g of seoGroup) for (const f of g.fields) initial[f.key] = content(f.key);

  const host = base.replace(/^https?:\/\//, "");
  const tools = [
    { label: "Google Search Console", note: "See your searches, clicks and position. Submit the sitemap.", href: "https://search.google.com/search-console" },
    { label: "Google Business Profile", note: "Appears in Google Maps and the local panel — the biggest single local-search win.", href: "https://business.google.com" },
    { label: "Bing Webmaster Tools", note: "Covers Bing, Yahoo and DuckDuckGo.", href: "https://www.bing.com/webmasters" },
    { label: "PageSpeed Insights", note: "Speed is a ranking factor, mostly on phones.", href: `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(base)}` },
    { label: "Rich Results Test", note: "Checks the site's structured data.", href: `https://search.google.com/test/rich-results?url=${encodeURIComponent(base)}` },
    { label: "Your sitemap", note: `${host}/sitemap.xml — list this in Search Console.`, href: `${base}/sitemap.xml` },
  ];

  return (
    <div className="space-y-6">
      <section className="relative isolate overflow-hidden rounded-2xl border border-stone-200 bg-[#fcf6e9]">
        <Image src="/media/packages/dzong-ridge.webp" alt="" fill sizes="(min-width: 1024px) 70vw, 100vw" className="-z-10 object-cover object-right opacity-60" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#fcf6e9] via-[#fcf6e9]/90 to-transparent" />
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-7 sm:px-8 sm:py-9">
          <div>
            <h1 data-hero className="font-display text-3xl font-semibold text-stone-900 sm:text-4xl">SEO</h1>
            <p className="mt-1.5 max-w-xl text-sm text-stone-700 sm:text-base">
              How well Google can find, understand and trust {host}. Fix the items below and keep publishing.
            </p>
          </div>
          <div className="rounded-2xl bg-white/90 px-6 py-4 text-center shadow-sm">
            <p className={`font-display text-4xl font-bold ${tone}`}>{score}<span className="text-lg text-stone-400">/100</span></p>
            <p className="text-xs text-stone-500">on-site SEO health</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" aria-label="Summary">
        {[
          { label: "Pages with problems", value: pageBad },
          { label: "Published packages", value: packages.length },
          { label: "Published articles", value: articles.length },
          { label: "Approved hotels & guides", value: hotels + guides },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
            <p className="text-sm font-medium text-stone-600">{c.label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-stone-900">{c.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="mb-3 font-display text-lg font-semibold text-stone-900">Site checklist</h2>
        <ul className="divide-y divide-stone-100">
          {technical.map((c) => (
            <li key={c.label} className="flex gap-3 py-3">
              <span aria-hidden className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold ${c.ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {c.ok ? "✓" : "!"}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-900">{c.label}</p>
                {!c.ok && (
                  <p className="text-sm text-stone-600">
                    {c.fix}{" "}
                    {c.href && (
                      <Link href={c.href} className="font-medium text-brand-700 hover:underline">Fix this →</Link>
                    )}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="font-display text-lg font-semibold text-stone-900">Connect Google and Bing</h2>
        <p className="mb-3 text-sm text-stone-600">Paste the verification codes here. They are added to every page automatically.</p>
        <ContentEditor groups={seoGroup} initial={initial} />
      </section>

      <IssueSection title="Tour packages to improve" issues={packageIssues} total={packages.length} />
      <IssueSection title="Destinations to improve" issues={destinationIssues} total={destinations.length} />
      <IssueSection title="Travel-guide articles to improve" issues={articleIssues} total={articles.length} />

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="mb-3 font-display text-lg font-semibold text-stone-900">Search tools</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {tools.map((t) => (
            <li key={t.label}>
              <a href={t.href} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-stone-200 p-3 hover:bg-stone-50">
                <p className="text-sm font-semibold text-stone-900">{t.label} ↗</p>
                <p className="text-xs text-stone-600">{t.note}</p>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-[#ecd79f] bg-[#fffaf0] p-4 sm:p-5">
        <h2 className="mb-2 font-display text-lg font-semibold text-stone-900">What moves you up in Google</h2>
        <p className="mb-3 text-sm text-stone-700">
          No tool can promise first place — Google decides, and the top spots for “Bhutan tour” are held by
          older sites. These are the steps that do move a new site up, in the order that matters:
        </p>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-stone-800">
          <li>Verify the site in Search Console and submit the sitemap (above).</li>
          <li>Claim your Google Business Profile and ask every happy guest for a Google review.</li>
          <li>Be listed on TripAdvisor, the Tourism Council of Bhutan operator list and travel directories — each is a backlink.</li>
          <li>Publish a helpful travel-guide article every week; target specific searches such as “Bhutan visa for Indians” or “best time to visit Bhutan”.</li>
          <li>Give every package a clear 70–160 character summary, a long description and real photos.</li>
          <li>Ask partner hotels, guides and travel bloggers to link to your packages.</li>
        </ol>
      </section>
    </div>
  );
}

function IssueSection({ title, issues, total }: { title: string; issues: Issue[]; total: number }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-semibold text-stone-900">{title}</h2>
        <p className="text-xs text-stone-500">{total - issues.length} of {total} are in good shape</p>
      </div>
      {issues.length === 0 ? (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Nothing to fix here.</p>
      ) : (
        <ul className="divide-y divide-stone-100">
          {issues.map((i) => (
            <li key={i.href} className="flex flex-wrap items-start justify-between gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-stone-900">{i.title}</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-stone-600">
                  {i.problems.map((p) => <li key={p}>{p}</li>)}
                </ul>
              </div>
              <Link href={i.href} className="btn-secondary shrink-0">Edit</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
