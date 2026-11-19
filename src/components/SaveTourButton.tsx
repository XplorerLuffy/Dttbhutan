"use client";

import { useEffect, useState } from "react";

type Saved = { signedIn: boolean; ids: Set<string> };

// One request per page load, shared by every heart on it.
let cache: Promise<Saved> | null = null;
function loadSaved(): Promise<Saved> {
  cache ??= fetch("/api/saved-tours", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : { signedIn: false, ids: [] }))
    .then((j) => ({ signedIn: Boolean(j.signedIn), ids: new Set<string>(j.ids ?? []) }))
    .catch(() => ({ signedIn: false, ids: new Set<string>() }));
  return cache;
}

/**
 * Heart on a tour's photo: save it to the traveler's wishlist, or take it off.
 * Tour pages are cached and shared, so who is signed in and what they saved is
 * asked of the browser, not baked into the page. Signed-out visitors are sent
 * to log in and come straight back to the tour.
 */
export default function SaveTourButton({ itineraryId, title, className = "" }: { itineraryId: string; title: string; className?: string }) {
  const [saved, setSaved] = useState(false);
  const [signedIn, setSignedIn] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let live = true;
    loadSaved().then((s) => {
      if (!live) return;
      setSignedIn(s.signedIn);
      setSaved(s.ids.has(itineraryId));
    });
    return () => {
      live = false;
    };
  }, [itineraryId]);

  async function toggle() {
    if (busy) return;
    if (!signedIn) {
      const next = window.location.pathname + window.location.search;
      window.location.href = `/login?next=${encodeURIComponent(next)}`;
      return;
    }
    const want = !saved;
    setBusy(true);
    setError(false);
    setSaved(want); // immediately
    try {
      const res = await fetch("/api/saved-tours", {
        method: want ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itineraryId }),
      });
      if (!res.ok) throw new Error();
      const s = await loadSaved();
      if (want) s.ids.add(itineraryId);
      else s.ids.delete(itineraryId);
    } catch {
      setSaved(!want); // put it back
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`z-10 flex flex-col items-end gap-1 ${className}`}>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${title} from wishlist` : `Save ${title} to wishlist`}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-[#B89550] shadow-md backdrop-blur transition hover:scale-105 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18334D]"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
          <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
        </svg>
      </button>
      {error && (
        <span role="alert" className="rounded bg-white/95 px-2 py-1 text-xs text-red-700 shadow">
          Couldn&apos;t update. Try again.
        </span>
      )}
    </div>
  );
}
