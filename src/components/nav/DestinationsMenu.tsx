import Link from "next/link";
import NavMenu from "./NavMenu";

type Destination = { id: string; name: string; slug: string };

export default function DestinationsMenu({ destinations }: { destinations: Destination[] }) {
  return (
    <NavMenu label="Destinations" panelClassName="sm:max-w-2xl">
      <ul className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-3">
        {destinations.map((d) => (
          <li key={d.id}>
            <Link href={`/destinations/${d.slug}`} className="text-sm text-stone-700 hover:text-brand-700">
              {d.name}
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/destinations"
        className="mt-4 block border-t border-stone-100 pt-3 text-sm font-medium text-brand-700 hover:underline"
      >
        Browse all 20 dzongkhags →
      </Link>
    </NavMenu>
  );
}
