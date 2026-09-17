/**
 * Stands in for a photo that doesn't exist yet.
 *
 * Deliberately a branded gradient with an initial rather than generic stock
 * imagery: a stock photo of *some* Bhutanese hotel shown against a specific
 * listing is a small lie, and travelers book on the strength of photos. This
 * reads as "no photo yet", which is true.
 *
 * The gradient is derived from the label so a given destination or hotel
 * keeps the same colour between pages instead of flickering at random.
 */

const GRADIENTS = [
  "from-brand-600 to-brand-900",
  "from-brand-700 to-stone-800",
  "from-stone-700 to-brand-800",
  "from-brand-500 to-brand-800",
  "from-emerald-700 to-brand-900",
  "from-amber-700 to-stone-800",
];

function gradientFor(label: string): string {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = (hash * 31 + label.charCodeAt(i)) >>> 0;
  }
  return GRADIENTS[hash % GRADIENTS.length];
}

export default function PhotoPlaceholder({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={`${label} — no photo available yet`}
      className={`flex items-center justify-center bg-gradient-to-br ${gradientFor(label)} ${className}`}
    >
      <span className="font-display text-3xl text-white/30">
        {label.trim().charAt(0).toUpperCase() || "D"}
      </span>
    </div>
  );
}
