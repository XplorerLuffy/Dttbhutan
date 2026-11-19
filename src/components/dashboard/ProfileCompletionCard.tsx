import type { ProfileCompletion } from "@/lib/profileCompletion";

const R = 26;
const C = 2 * Math.PI * R;

/**
 * "Complete Your Profile" card. The traveler account has no profile page yet,
 * so the card is not a link; the call to action says so rather than pointing
 * at a page that does not exist.
 */
export default function ProfileCompletionCard({ completion }: { completion: ProfileCompletion }) {
  const { percent, complete, missing } = completion;
  const title = complete ? "Your profile is complete" : "Complete Your Profile";
  const text = complete
    ? "Your contact details are all on file."
    : `Still to add: ${missing.join(", ").toLowerCase()}.`;
  return (
    <section
      aria-label="Profile completion"
      className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="relative h-16 w-16 shrink-0" role="img" aria-label={`Profile ${percent}% complete`}>
        <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
          <circle cx="32" cy="32" r={R} fill="none" stroke="#EEE7D8" strokeWidth="6" />
          <circle
            cx="32"
            cy="32"
            r={R}
            fill="none"
            stroke="#B89550"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - percent / 100)}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[#18334D]">
          {percent}%
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-base font-semibold text-[#18334D]">{title}</h2>
        <p className="mt-0.5 text-sm text-stone-500">{text}</p>
        {!complete && (
          <p className="mt-1.5 text-sm font-semibold text-[#B89550]">
            Complete profile → <span className="font-normal text-stone-400">(coming soon)</span>
          </p>
        )}
      </div>
    </section>
  );
}
