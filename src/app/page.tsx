import Link from "next/link";

const categories = [
  {
    href: "/guides",
    title: "Tour Guides",
    description:
      "TCB-licensed guides for trekking, cultural, historical, and adventure tours.",
  },
  {
    href: "/hotels",
    title: "Hotels & Stays",
    description: "Hotels and homestays across Bhutan, with instant availability.",
  },
  {
    href: "/vehicles",
    title: "Transport",
    description:
      "Vehicles with drivers, GPS-tracked so you always know actual trip distance.",
  },
];

export default function HomePage() {
  return (
    <div>
      <section className="rounded-xl bg-emerald-800 px-6 py-16 text-center text-white sm:px-12">
        <h1 className="text-3xl font-bold sm:text-4xl">
          Plan your Bhutan trip end to end
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-emerald-50">
          Book licensed guides, hotels, and GPS-tracked transport — all in
          one place, with verified vendors and transparent trip mileage.
        </p>
      </section>

      <section className="mt-10 grid gap-6 sm:grid-cols-3">
        {categories.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="card transition hover:shadow-md hover:ring-1 hover:ring-emerald-600"
          >
            <h2 className="text-lg font-semibold text-emerald-800">{c.title}</h2>
            <p className="mt-2 text-sm text-stone-600">{c.description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
