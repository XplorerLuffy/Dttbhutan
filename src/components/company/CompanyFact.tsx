import { isPlaceholder } from "@/lib/company";

/**
 * Renders a company fact only once it's real.
 *
 * While a value is still a placeholder this shows an obvious amber marker
 * in development (so gaps are visible while building) and renders nothing
 * at all in production (so a live site never displays "TODO — TCB licence
 * no." to a traveler, and never invents one either).
 */
export default function CompanyFact({
  label,
  value,
  className,
}: {
  label?: string;
  value: string;
  className?: string;
}) {
  if (!isPlaceholder(value)) {
    return (
      <span className={className}>
        {label ? `${label}: ` : ""}
        {value}
      </span>
    );
  }

  if (process.env.NODE_ENV === "production") return null;

  return (
    <span
      className={`inline-block rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-xs text-amber-800 ${className ?? ""}`}
      title="Placeholder — fill this in src/lib/company.ts before launch"
    >
      {label ? `${label}: ` : ""}
      {value}
    </span>
  );
}
