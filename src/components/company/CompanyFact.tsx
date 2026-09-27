

/**
 * Renders a company fact only once it's real.
 *
 * While a value is unset this shows an obvious amber marker in development
 * (so gaps are visible while building) and renders nothing at all in
 * production (so a live site never shows an empty label to a traveler, and
 * never invents a credential either). Values are filled in under
 * /admin/content → Company details.
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
  if (value.trim()) {
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
      title="Not set — fill this in under /admin/content → Company details"
    >
      {label ? `${label}: ` : ""}
      {label ? "not set" : "not set"}
    </span>
  );
}
