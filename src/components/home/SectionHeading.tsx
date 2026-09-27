/**
 * Centered heading + supporting line used at the top of most homepage
 * sections. Kept as one component so the vertical rhythm between a section's
 * title and its content stays identical everywhere.
 */
export default function SectionHeading({
  title,
  subtitle,
  className = "",
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto max-w-2xl text-center ${className}`}>
      <h2 className="text-balance font-display text-3xl font-semibold leading-tight text-stone-900 sm:text-4xl">
        {title}
      </h2>
      {subtitle && <p className="mt-4 text-base leading-relaxed text-stone-600">{subtitle}</p>}
    </div>
  );
}
