import Link from "next/link";
import NavMenu from "./NavMenu";

const ICON = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "h-6 w-6 shrink-0 text-brand-800",
  "aria-hidden": true,
} as const;

const ITEMS = [
  {
    href: "/hotels",
    label: "Book a Hotel",
    icon: (
      <svg {...ICON}>
        <path d="M3 18V8M21 18v-5a3 3 0 0 0-3-3h-8v8M3 15h18M7 10.5h.01" />
      </svg>
    ),
  },
  {
    href: "/guides",
    label: "Book a Guide",
    icon: (
      <svg {...ICON}>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5 20c.6-3.6 3.4-5.5 7-5.5s6.4 1.9 7 5.5M8.5 5.5h7" />
      </svg>
    ),
  },
  {
    href: "/flights",
    label: "Book Tickets",
    icon: (
      <svg {...ICON}>
        <path d="M3 13l18-8-5 15-4-6-9-1zM12 14l4-5" />
      </svg>
    ),
  },
  {
    href: "/vehicles",
    label: "Book Transport",
    icon: (
      <svg {...ICON}>
        <path d="M4 16v-4l1.6-4.2A2 2 0 0 1 7.5 6.5h9a2 2 0 0 1 1.9 1.3L20 12v4M4 16h16M4 16v2h3v-2M17 16v2h3v-2M7 12.5h.01M17 12.5h.01" />
      </svg>
    ),
  },
];

/** "Book Services": one place for the three things a traveller can book on its own. */
export default function ServicesMenu({
  triggerClassName,
  label = "Book Services",
}: {
  triggerClassName?: string;
  label?: string;
}) {
  return (
    <NavMenu label={label} panelClassName="sm:max-w-[16rem] sm:!w-64" triggerClassName={triggerClassName}>
      <ul className="-my-1 divide-y divide-stone-100">
        {ITEMS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex items-center gap-4 rounded-lg px-2 py-3 text-[15px] font-medium text-stone-800 transition-colors hover:bg-stone-50 hover:text-brand-700"
            >
              {item.icon}
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </NavMenu>
  );
}
