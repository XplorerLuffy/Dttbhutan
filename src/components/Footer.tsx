import Link from "next/link";
import CompanyFact from "@/components/company/CompanyFact";
import { COMPANY, formattedAddress } from "@/lib/company";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <p className="font-display text-lg font-semibold text-brand-800">
              Droelma Tours &amp; Travels
            </p>
            <p className="mt-2 text-sm text-stone-500">
              Guides, hotels, transport, and flights for your trip — with
              GPS-verified trip mileage and live tracking.
            </p>
          </div>
          <FooterColumn
            title="Explore"
            links={[
              { href: "/destinations", label: "Destinations" },
              { href: "/guides", label: "Tour guides" },
              { href: "/hotels", label: "Hotels & stays" },
              { href: "/vehicles", label: "Transport" },
              { href: "/flights", label: "Flights" },
              { href: "/packages", label: "Package tours" },
              { href: "/custom-tour", label: "Custom tour request" },
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
            title="Company"
            links={[
              { href: "/about", label: "About us" },
              { href: "/contact", label: "Contact" },
              { href: "/faq", label: "FAQ" },
              { href: "/travel-guide", label: "Travel guide" },
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

        <div className="mt-10 flex flex-col gap-3 border-t border-stone-100 pt-6 text-xs text-stone-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {COMPANY.name}
            {formattedAddress() ? `, ${formattedAddress()}` : ""}.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <CompanyFact label="TCB licence" value={COMPANY.tcbLicenceNumber} />
            <Link href="/terms" className="hover:text-stone-600">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-stone-600">
              Privacy
            </Link>
            <Link href="/cancellation" className="hover:text-stone-600">
              Cancellation &amp; refunds
            </Link>
          </div>
        </div>
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
