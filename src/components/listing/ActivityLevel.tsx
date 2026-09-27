import type { TripDifficulty } from "@prisma/client";

const LEVEL: Record<TripDifficulty, { step: number; label: string; blurb: string }> = {
  EASY: {
    step: 1,
    label: "Easy",
    blurb: "Short walks on good paths, with plenty of time to stop.",
  },
  MODERATE: {
    step: 2,
    label: "Moderate",
    blurb: "Half-day hikes, some climbing, a few hours on your feet.",
  },
  CHALLENGING: {
    step: 3,
    label: "Challenging",
    blurb: "Long days at altitude on rough trails, camping between them.",
  },
};

const STEPS = 3;

/**
 * The trip's activity level as a filled scale, the way an outfitter's trip
 * page shows it — a bare "Moderate" tells a first-time visitor to Bhutan
 * nothing about whether they can do it.
 *
 * The dots are decorative: the label beside them carries the same meaning in
 * text, and the group as a whole is announced once via aria-label, so a
 * screen reader hears "Activity level 2 of 3: Moderate" rather than three
 * anonymous bullets.
 */
export default function ActivityLevel({
  difficulty,
  showBlurb = false,
  className = "",
}: {
  difficulty: TripDifficulty;
  showBlurb?: boolean;
  className?: string;
}) {
  const { step, label, blurb } = LEVEL[difficulty];

  return (
    <div className={className}>
      <div
        className="flex items-center gap-2"
        role="img"
        aria-label={`Activity level ${step} of ${STEPS}: ${label}`}
      >
        <span aria-hidden className="flex gap-1">
          {Array.from({ length: STEPS }, (_, i) => (
            <span
              key={i}
              className={`h-2 w-6 rounded-full ${i < step ? "bg-gold-500" : "bg-stone-300"}`}
            />
          ))}
        </span>
        <span aria-hidden className="font-semibold text-stone-900">
          {label}
        </span>
      </div>
      {showBlurb && <p className="mt-1.5 text-sm text-stone-600">{blurb}</p>}
    </div>
  );
}
