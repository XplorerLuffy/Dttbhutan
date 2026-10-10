import Link from "next/link";
import Image from "next/image";
import SectionHeading from "@/components/home/SectionHeading";

type Content = (key: string) => string;

const CARDS = [
  { n: 1, href: "/hotels" },
  { n: 2, href: "/guides" },
  { n: 3, href: "/vehicles" },
] as const;

/**
 * Hotels, guides and transport, each a card with a photo and one button.
 * Sits between the tours and the guides: after choosing a trip, these are the
 * other things a traveller can arrange on their own.
 */
export default function BookServices({ content }: { content: Content }) {
  const cards = CARDS.map(({ n, href }) => ({
    href,
    title: content(`home.services.${n}.title`),
    body: content(`home.services.${n}.body`),
    button: content(`home.services.${n}.button`),
    image: content(`home.services.${n}.image`),
  })).filter((c) => c.title.trim());

  if (cards.length === 0 || !content("home.services.heading").trim()) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
      <SectionHeading title={content("home.services.heading")} subtitle={content("home.services.subtitle")} />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <article
            key={c.href}
            className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            <Link href={c.href} className="relative block aspect-[4/3] overflow-hidden bg-stone-100">
              {c.image.trim() &&
                (c.image.startsWith("/") ? (
                  <Image
                    src={c.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  // Any other host the admin pastes in; next/image would need each one allow-listed.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.image}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ))}
            </Link>
            <div className="p-5">
              <h3 className="font-display text-xl font-semibold text-brand-900">{c.title}</h3>
              {c.body && <p className="mt-1 text-sm text-stone-600">{c.body}</p>}
              {c.button && (
                <Link
                  href={c.href}
                  className="mt-4 block rounded-lg bg-brand-900 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-800"
                >
                  {c.button}
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
