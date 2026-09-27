import Image from "next/image";

export type LodgingView = {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  photoUrl: string | null;
  /** Derived from the days that use it, never stored — see the Prisma model. */
  nights: number;
};

/**
 * "Where you'll stay": one card per property, in the order the trip visits
 * them, with the number of nights derived from the itinerary days rather
 * than typed in twice.
 *
 * A property with no photo keeps its card and shows the brand gradient, so
 * a half-photographed trip still lays out as a row rather than collapsing
 * into ragged heights.
 */
export default function TripLodging({ lodgings }: { lodgings: LodgingView[] }) {
  if (lodgings.length === 0) return null;

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {lodgings.map((l) => (
        <li
          key={l.id}
          className="flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white"
        >
          <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-brand-600 to-brand-950">
            {l.photoUrl && (
              <Image src={l.photoUrl} alt={l.name} fill unoptimized className="object-cover" />
            )}
            {l.nights > 0 && (
              <span className="absolute right-3 top-3 rounded-full bg-stone-900/75 px-3 py-1 text-[11px] font-semibold text-white">
                {l.nights} night{l.nights === 1 ? "" : "s"}
              </span>
            )}
          </div>
          <div className="flex flex-1 flex-col p-5">
            <h3 className="font-display text-lg font-semibold leading-snug text-stone-900">
              {l.name}
            </h3>
            {l.location && <p className="mt-0.5 text-sm text-stone-500">{l.location}</p>}
            {l.description && <p className="mt-3 text-sm text-stone-700">{l.description}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
