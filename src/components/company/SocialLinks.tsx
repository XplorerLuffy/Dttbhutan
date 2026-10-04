import type { CompanyDetails } from "@/lib/content";

type Network = keyof CompanyDetails["social"];

const LABELS: Record<Network, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tripadvisor: "TripAdvisor",
  youtube: "YouTube",
  tiktok: "TikTok",
};

/** Order the icons appear in. */
const ORDER: Network[] = ["facebook", "instagram", "tripadvisor", "youtube", "tiktok"];

/**
 * The company's social accounts as icon links. Only networks with an address
 * filled in under /chim/content are shown, and nothing renders at all while
 * none are — an empty "Follow us" would be worse than no heading.
 *
 * The default is round icon buttons, for the footer. `variant="labelled"`
 * puts the network's name beside each icon, for the Contact page where there
 * is room to say which is which.
 */
export default function SocialLinks({
  social,
  variant = "icons",
  className = "",
}: {
  social: CompanyDetails["social"];
  variant?: "icons" | "labelled";
  className?: string;
}) {
  const links = ORDER.filter((n) => social[n]).map((n) => ({ network: n, href: social[n] }));
  if (links.length === 0) return null;

  return (
    <ul className={`flex flex-wrap gap-2 ${className}`}>
      {links.map(({ network, href }) => (
        <li key={network}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer me"
            aria-label={`${LABELS[network]} (opens in a new tab)`}
            title={LABELS[network]}
            className={
              variant === "labelled"
                ? "inline-flex items-center gap-2 rounded-full border border-stone-200 px-3 py-1.5 text-sm text-stone-700 transition-colors hover:border-brand-300 hover:text-brand-700"
                : "flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 text-stone-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
            }
          >
            <Icon network={network} className="h-[18px] w-[18px]" />
            {variant === "labelled" && LABELS[network]}
          </a>
        </li>
      ))}
    </ul>
  );
}

function Icon({ network, className }: { network: Network; className?: string }) {
  const common = { className, "aria-hidden": true, viewBox: "0 0 24 24" } as const;
  switch (network) {
    case "facebook":
      return (
        <svg {...common} fill="currentColor">
          <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4.2" />
          <circle cx="17.4" cy="6.6" r="0.6" fill="currentColor" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common} fill="currentColor">
          <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...common} fill="currentColor">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      );
    case "tripadvisor":
      // Drawn as the owl's two eyes inside a ring rather than the full logo.
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
          <path d="M1.5 9.5h4A10 10 0 0 1 12 6.5c2.6 0 4.9.9 6.5 3h4M12 6.5V6" strokeLinecap="round" />
          <circle cx="7" cy="14" r="3.6" />
          <circle cx="17" cy="14" r="3.6" />
          <circle cx="7" cy="14" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="17" cy="14" r="1.1" fill="currentColor" stroke="none" />
          <path d="m12 14.3-1.5 2.3h3L12 14.3Z" fill="currentColor" />
        </svg>
      );
  }
}
