import Hero from "@/components/home/Hero";
import ScrollReveal from "@/components/ScrollReveal";
import MotionCard from "@/components/MotionCard";

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
  {
    href: "/flights",
    title: "Flights",
    description: "Search and book flights, with Drukair and Bhutan Airlines routes pinned first.",
  },
];

const trustPoints = [
  {
    title: "GPS-verified mileage",
    description:
      "Every vehicle trip is checked against its GPS trail, not the driver's word — the exact planned-vs-actual distance is on record.",
  },
  {
    title: "Licensed & vetted vendors",
    description:
      "Guides carry a verified TCB license, and every hotel and transport operator is approved by our team before they're bookable.",
  },
  {
    title: "Live trip tracking",
    description:
      "Follow your vehicle's last known location during your trip, and share the link with family — no account needed.",
  },
];

export default function HomePage() {
  return (
    <div>
      <Hero />

      <section className="mt-16">
        <h2 className="text-center font-display text-2xl font-semibold text-stone-900">
          Everything for your trip, in one place
        </h2>
        <ScrollReveal className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <MotionCard key={c.href} href={c.href} className="card block h-full">
              <h3 className="font-display text-lg font-semibold text-brand-800">{c.title}</h3>
              <p className="mt-2 text-sm text-stone-600">{c.description}</p>
            </MotionCard>
          ))}
        </ScrollReveal>
      </section>

      <section className="mt-20">
        <h2 className="text-center font-display text-2xl font-semibold text-stone-900">
          Built to solve real problems, not just look nice
        </h2>
        <ScrollReveal className="mt-8 grid gap-8 sm:grid-cols-3">
          {trustPoints.map((t) => (
            <div key={t.title} className="text-center">
              <h3 className="font-display text-lg font-semibold text-pine-800">{t.title}</h3>
              <p className="mt-2 text-sm text-stone-600">{t.description}</p>
            </div>
          ))}
        </ScrollReveal>
      </section>
    </div>
  );
}
