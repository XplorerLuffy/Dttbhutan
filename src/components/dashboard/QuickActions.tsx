import Link from "next/link";

type Action = { key: string; title: string; text: string; icon: string; href?: string };

// Only routes that exist. Payments and documents have no page yet, so those
// two cards are shown as unavailable instead of linking somewhere unrelated.
const ACTIONS: Action[] = [
  { key: "bookings", title: "My Bookings", text: "Manage your trips and reservations.", href: "#upcoming-trips",
    icon: "M6 8h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Zm3 0V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" },
  { key: "payments", title: "Payments", text: "View invoices and make payments.",
    icon: "M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm0 3h18M7 15h3" },
  { key: "documents", title: "Travel Documents", text: "Permits, vouchers and essential files.",
    icon: "M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm7 0v5h5M9 13h6M9 17h6" },
  { key: "support", title: "Get Support", text: "Contact your travel team for assistance.", href: "/contact",
    icon: "M4 14v-2a8 8 0 0 1 16 0v2M4 14a2 2 0 0 0 2 2h1v-5H6a2 2 0 0 0-2 2Zm16 0a2 2 0 0 1-2 2h-1v-5h1a2 2 0 0 1 2 2Zm-3 4c0 1.5-2 2-5 2" },
];

function Body({ a, off }: { a: Action; off: boolean }) {
  return (
    <>
      <svg viewBox="0 0 24 24" className="h-9 w-9 text-[#B89550]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d={a.icon} />
      </svg>
      <span className="mt-3 block font-display text-base font-bold text-[#18334D]">{a.title}</span>
      <span className="mt-0.5 block text-xs text-stone-500 sm:text-sm">{off ? "Coming soon." : a.text}</span>
      {!off && <span aria-hidden className="absolute right-4 top-5 text-xl text-[#B89550] transition-transform group-hover:translate-x-0.5">›</span>}
    </>
  );
}

export default function QuickActions() {
  return (
    <section aria-labelledby="quick-actions-title">
      <h2 id="quick-actions-title" className="mb-3 font-display text-xl font-bold text-[#18334D]">Quick Actions</h2>
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {ACTIONS.map((a) => {
          const base = "group relative block h-full rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5";
          return (
            <li key={a.key}>
              {a.href ? (
                <Link href={a.href} className={`${base} transition duration-200 hover:-translate-y-0.5 hover:border-[#B89550]/60 hover:shadow-md active:translate-y-0 active:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B89550]`}>
                  <Body a={a} off={false} />
                </Link>
              ) : (
                <div aria-disabled="true" className={`${base} cursor-not-allowed opacity-60`}>
                  <Body a={a} off />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
