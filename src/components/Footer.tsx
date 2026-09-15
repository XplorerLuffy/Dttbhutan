import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-4">
          <div>
            <p className="font-display text-lg font-semibold text-brand-800">Dtt Bhutan</p>
            <p className="mt-2 text-sm text-stone-500">
              Guides, hotels, transport, and flights for your trip — with
              GPS-verified trip mileage and live tracking.
            </p>
          </div>
          <FooterColumn
            title="Explore"
            links={[
              { href: "/guides", label: "Tour guides" },
              { href: "/hotels", label: "Hotels & stays" },
              { href: "/vehicles", label: "Transport" },
              { href: "/flights", label: "Flights" },
            ]}
          />
          <FooterColumn
            title="For vendors"
            links={[
              { href: "/vendor/guide/register", label: "Register as a guide" },
              { href: "/vendor/hotel/register", label: "Register your hotel" },
              { href: "/vendor/transport/register", label: "Register as a transport operator" },
            ]}
          />
          <FooterColumn
            title="Account"
            links={[
              { href: "/login", label: "Log in" },
              { href: "/register", label: "Sign up" },
            ]}
          />
        </div>
        <p className="mt-10 text-xs text-stone-400">
          © {new Date().getFullYear()} Dtt Bhutan. Built for a Bhutanese travel agency.
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-stone-700">{title}</p>
      <ul className="mt-2 space-y-1.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-stone-500 hover:text-brand-700">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
