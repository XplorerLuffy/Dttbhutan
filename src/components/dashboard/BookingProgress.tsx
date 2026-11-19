import Link from "next/link";
import type { TimelineStep } from "@/lib/nextAdventure";

const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

function Marker({ state, n }: { state: TimelineStep["state"]; n: number }) {
  const cls =
    state === "done" ? "bg-emerald-600 text-white" : state === "current" ? "bg-[#B89550] text-white" : state === "problem" ? "bg-red-600 text-white" : "border-2 border-stone-300 bg-white text-stone-500";
  return (
    <span className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${cls}`}>
      {state === "done" ? "✓" : state === "problem" ? "!" : n}
    </span>
  );
}

/** Vertical five-step timeline. A step with an action links to the booking page, the only place a booking's payment is shown. */
export default function BookingProgress({ steps, href }: { steps: TimelineStep[]; href: string }) {
  return (
    <section aria-label="Booking progress" className="h-full rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-[#18334D]">Booking Progress</h2>
      <ol className="relative mt-4 space-y-1">
        <span className="absolute bottom-6 left-[1.7rem] top-6 w-px bg-stone-200" aria-hidden />
        {steps.map((s, i) => {
          const body = (
            <>
              <Marker state={s.state} n={i + 1} />
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-semibold ${s.state === "upcoming" ? "text-stone-500" : "text-[#18334D]"}`}>{s.title}</span>
                <span className="block text-xs text-stone-500">
                  {s.date ? `${fmt(s.date)} · ` : ""}
                  {s.detail}
                </span>
              </span>
              {s.actionable && <span aria-hidden className="text-[#B89550]">›</span>}
            </>
          );
          const row = `flex items-center gap-3 rounded-xl px-3 py-2.5 ${s.state === "current" ? "bg-[#B89550]/10" : s.state === "problem" ? "bg-red-50" : ""}`;
          return (
            <li key={s.key} aria-current={s.state === "current" ? "step" : undefined}>
              {s.actionable ? (
                <Link href={href} className={`${row} transition hover:bg-[#B89550]/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#B89550]`}>
                  {body}
                </Link>
              ) : (
                <div className={row}>{body}</div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
