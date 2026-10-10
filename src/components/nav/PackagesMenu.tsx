import Link from "next/link";
import NavMenu from "./NavMenu";

type Package = { id: string; title: string; slug: string; durationDays: number };

export default function PackagesMenu({
  packages,
  triggerClassName,
  label = "Tour Packages",
}: {
  packages: Package[];
  triggerClassName?: string;
  label?: string;
}) {
  return (
    <NavMenu label={label} panelClassName="sm:!w-[40rem] sm:max-w-none" triggerClassName={triggerClassName}>
      <div className="grid gap-8 sm:grid-cols-[1fr_1fr]">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">Plan your trip</p>
          <ul className="space-y-3">
            <li>
              <Link href="/packages" className="block rounded-md p-2 -m-2 hover:bg-stone-50">
                <span className="block text-sm font-medium text-stone-900">Tour packages</span>
                <span className="block text-xs text-stone-500">
                  Fixed-itinerary tours we&apos;ve put together and priced already.
                </span>
              </Link>
            </li>
            <li>
              <Link href="/custom-tour" className="block rounded-md p-2 -m-2 hover:bg-stone-50">
                <span className="block text-sm font-medium text-stone-900">Custom & customizable tours</span>
                <span className="block text-xs text-stone-500">
                  Tell us what you want to see — we&apos;ll build a bespoke itinerary and quote it.
                </span>
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">Popular packages</p>
          {packages.length === 0 ? (
            <p className="text-sm text-stone-500">Packages coming soon.</p>
          ) : (
            <ul className="space-y-1.5">
              {packages.slice(0, 8).map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/packages/${p.slug}`}
                    className="flex items-baseline justify-between gap-3 rounded-md py-0.5 text-sm text-stone-700 hover:text-brand-700"
                  >
                    <span className="truncate">{p.title}</span>
                    <span className="shrink-0 text-xs text-stone-400">{p.durationDays} days</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-stone-100 pt-3 text-sm font-medium">
        <Link href="/packages" className="text-brand-700 hover:underline">
          Browse all packages →
        </Link>
        <span className="flex gap-5 text-stone-600">
          <Link href="/travel-guide" className="hover:text-brand-700">
            Travel guide
          </Link>
        </span>
      </div>
    </NavMenu>
  );
}
