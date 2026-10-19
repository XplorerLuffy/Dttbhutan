import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getSiteContent } from "@/lib/content";
import { CONTENT_GROUPS, type ContentGroup } from "@/lib/content/registry";
import ContentEditor from "@/components/admin/ContentEditor";

export const metadata = { title: "Site photos" };

/**
 * Every replaceable photo on the site in one place, grouped by where it
 * appears. Photos that belong to a listing (a tour, a destination, a hotel, a
 * guide, an article) are changed on that listing's own page, so they are
 * linked rather than repeated here.
 */
export default async function SitePhotosPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return null; // the admin layout shows the sign-in form

  const content = await getSiteContent();
  const groups: ContentGroup[] = CONTENT_GROUPS.map((g) => ({
    id: g.id,
    label: g.label,
    fields: g.fields.filter((f) => f.type === "image"),
  })).filter((g) => g.fields.length > 0);

  const initial: Record<string, string> = {};
  for (const g of groups) for (const f of g.fields) initial[f.key] = content(f.key);
  const count = groups.reduce((n, g) => n + g.fields.length, 0);

  const listings = [
    { label: "Tour packages", note: "Cover photo and gallery. They appear on the home page cards, the tours list and each tour page.", href: "/chim/packages" },
    { label: "Destinations", note: "Photos for the home page destination row, the destinations list and each destination page.", href: "/chim/destinations" },
    { label: "Travel guide articles", note: "Cover and gallery photos.", href: "/chim/travel-guide" },
    { label: "Hotels, guides and transport", note: "Their photos are changed on each listing's edit page.", href: "/chim/vendors" },
  ];

  return (
    <div className="space-y-6">
      <section className="relative isolate overflow-hidden rounded-2xl border border-stone-200 bg-[#fcf6e9]">
        <Image src="/media/packages/dzong-ridge.webp" alt="" fill sizes="(min-width: 1024px) 70vw, 100vw" className="-z-10 object-cover object-right opacity-60" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#fcf6e9] via-[#fcf6e9]/90 to-transparent" />
        <div className="px-5 py-7 sm:px-8 sm:py-9">
          <h1 data-hero className="font-display text-3xl font-semibold text-stone-900 sm:text-4xl">Site photos</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-stone-700 sm:text-base">
            Replace any photo on the website. Pick a section on the left, press the upload button on a photo, then save.
            Changes appear on the live site straight away. {count} photos can be replaced here.
          </p>
        </div>
      </section>

      <ContentEditor groups={groups} initial={initial} />

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="font-display text-lg font-semibold text-stone-900">Photos that belong to a listing</h2>
        <p className="mb-3 text-sm text-stone-600">These are changed on the listing itself, so they stay with it everywhere they appear.</p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {listings.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="block rounded-xl border border-stone-200 p-3 hover:bg-stone-50">
                <p className="text-sm font-semibold text-stone-900">{l.label} →</p>
                <p className="text-xs text-stone-600">{l.note}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
