import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";

/**
 * The guides themselves, with their own words.
 *
 * The reference layout this follows puts a recommendation quote on each
 * card. We show each guide's actual bio instead: a quote attributed to a
 * named, real guide who never said it is a fabricated endorsement, and these
 * are people the client employs. When a guide hasn't written a bio the card
 * simply drops that line rather than filling the space with invented copy.
 */

export type SpotlightGuide = {
  id: string;
  name: string;
  photoUrl: string | null;
  bio: string | null;
  yearsExperience: number;
  specialties: string[];
  languages: string[];
  destinations: string[];
};

export default function GuideSpotlight({ guides }: { guides: SpotlightGuide[] }) {
  // Track the real number of guides rather than always laying out three
  // columns: an agency with two approved guides would otherwise get a card-
  // shaped hole on the right.
  const columns = guides.length >= 3 ? "lg:grid-cols-3" : "sm:grid-cols-2 lg:max-w-4xl";

  return (
    <ScrollReveal className={`mx-auto grid gap-8 sm:grid-cols-2 ${columns}`}>
      {guides.map((g) => (
        <article
          key={g.id}
          className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
        >
          <div className="relative">
            {g.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={g.photoUrl} alt={`${g.name}, licensed Bhutanese tour guide`} className="h-52 w-full object-cover" />
            ) : (
              <PhotoPlaceholder label={g.name} className="h-52 w-full" />
            )}
            <span className="absolute -bottom-8 left-6 flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-brand-800 font-display text-xl font-semibold text-white shadow-md">
              {g.name.trim().charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="flex flex-1 flex-col px-6 pb-7 pt-12">
            <h3 className="font-display text-xl font-semibold text-stone-900">{g.name}</h3>
            <p className="mt-1 text-sm text-stone-500">
              {g.yearsExperience} {g.yearsExperience === 1 ? "year" : "years"} guiding
              {g.destinations.length > 0 && <> · {g.destinations.slice(0, 2).join(", ")}</>}
            </p>

            {g.bio && <p className="mt-4 flex-1 text-sm leading-relaxed text-stone-600">{g.bio}</p>}

            {g.specialties.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {g.specialties.slice(0, 3).map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium capitalize text-brand-800"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}

            <Link
              href={`/guides/${g.id}`}
              className="mt-6 text-sm font-semibold text-brand-700 hover:underline"
            >
              View profile →
            </Link>
          </div>
        </article>
      ))}
    </ScrollReveal>
  );
}
