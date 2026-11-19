"use client";

import Link from "next/link";
import { useState } from "react";
import Money from "@/components/Money";

export type SavedTourCard = {
  itineraryId: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  category: string;
  destination: string;
  durationDays: number;
  priceBTN: number;
  rating: number | null;
  reviewCount: number;
};

export default function Wishlist({ initial }: { initial: SavedTourCard[] }) {
  const [tours, setTours] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function remove(t: SavedTourCard) {
    if (busy) return;
    setError(null);
    setBusy(t.itineraryId);
    const before = tours;
    setTours((l) => l.filter((x) => x.itineraryId !== t.itineraryId)); // immediately
    try {
      const res = await fetch("/api/saved-tours", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itineraryId: t.itineraryId }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setTours(before); // put it back
      setError("We couldn't remove that tour. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section aria-labelledby="wishlist-title" className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 id="wishlist-title" className="font-display text-xl font-bold text-[#18334D]">Your Wishlist</h2>
      <p className="mb-4 mt-0.5 text-sm text-stone-500">The adventures you&apos;ve been dreaming about.</p>
      {error && (
        <p role="alert" className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {tours.length === 0 ? (
        <div className="flex flex-col items-center px-4 py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#B89550]/10 text-[#B89550]">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden>
              <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
            </svg>
          </span>
          <h3 className="mt-4 font-display text-lg font-semibold text-[#18334D]">Your wishlist is empty</h3>
          <p className="mt-1 max-w-md text-sm text-stone-500">
            Save tours you&apos;re interested in and they&apos;ll appear here when you&apos;re ready to plan your next adventure.
          </p>
          <Link href="/packages" className="mt-5 rounded-xl bg-[#B89550] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18334D]">
            Explore Bhutan Tours <span aria-hidden>→</span>
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tours.map((t) => {
            const href = `/packages/${t.slug}`;
            return (
              <li key={t.itineraryId} className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-[#18334D] to-[#2d5273]">
                  <Link href={href} tabIndex={-1} aria-hidden className="absolute inset-0">
                    {t.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.imageUrl} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    )}
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(t)}
                    aria-label={`Remove ${t.title} from wishlist`}
                    className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#B89550] shadow transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#18334D]"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
                    </svg>
                  </button>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#B89550]">{t.category}</p>
                  <div className="mt-1 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-display text-lg font-bold leading-snug text-[#18334D]">
                        <Link href={href} className="hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#B89550]">{t.title}</Link>
                      </h3>
                      {t.destination && <p className="mt-0.5 truncate text-sm text-stone-500">{t.destination}</p>}
                    </div>
                    <p className="shrink-0 text-right">
                      <span className="block text-xs text-stone-500">From</span>
                      <Money btn={t.priceBTN} className="font-display text-lg font-bold text-[#18334D]" />
                    </p>
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                    <p className="flex flex-wrap items-center gap-x-2 text-xs text-stone-600">
                      {t.rating != null && (
                        <span>
                          <span className="text-[#B89550]" aria-hidden>★</span> {t.rating.toFixed(1)} ({t.reviewCount} {t.reviewCount === 1 ? "review" : "reviews"})
                        </span>
                      )}
                      <span className={t.rating != null ? "sm:border-l sm:border-stone-300 sm:pl-2" : ""}>{t.durationDays} {t.durationDays === 1 ? "Day" : "Days"}</span>
                    </p>
                    <Link href={href} className="shrink-0 rounded-xl bg-[#18334D] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#244a6c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B89550]">
                      View Tour <span aria-hidden>→</span>
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
