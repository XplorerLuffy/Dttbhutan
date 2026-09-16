import Link from "next/link";
import NavMenu from "./NavMenu";
import { REGION_LABEL, REGION_ORDER } from "@/lib/regions";
import type { DzongkhagRegion } from "@prisma/client";

type Destination = { id: string; name: string; slug: string; region: DzongkhagRegion };

export default function DestinationsMenu({ destinations }: { destinations: Destination[] }) {
  const byRegion = new Map<DzongkhagRegion, Destination[]>();
  for (const d of destinations) byRegion.set(d.region, [...(byRegion.get(d.region) ?? []), d]);

  return (
    <NavMenu label="Destinations" panelClassName="sm:max-w-2xl">
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
        {REGION_ORDER.map((region) => (
          <div key={region}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">
              {REGION_LABEL[region]}
            </p>
            <ul className="space-y-1.5">
              {(byRegion.get(region) ?? []).map((d) => (
                <li key={d.id}>
                  <Link href={`/destinations/${d.slug}`} className="text-sm text-stone-700 hover:text-brand-700">
                    {d.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <Link
        href="/destinations"
        className="mt-4 block border-t border-stone-100 pt-3 text-sm font-medium text-brand-700 hover:underline"
      >
        Browse all 20 dzongkhags →
      </Link>
    </NavMenu>
  );
}
