"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * One click → one API request, done so the button always answers.
 *
 * The admin and vendor buttons used to wrap `await fetch(...); router.refresh()`
 * in a transition. That kept the button disabled until a full server
 * re-render had finished as well, ignored the response, and never said what
 * went wrong — a failed request looked exactly like a button that does
 * nothing, and a slow one greyed the row out indefinitely.
 *
 * `run` instead: gives up after a timeout, turns a failure into a sentence
 * the person can act on, and on success refreshes the page in the background
 * rather than holding the button while it happens. It resolves to whether the
 * request succeeded, so the caller can update what it shows straight away.
 */
export function useServerAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(url: string, init: RequestInit = {}): Promise<boolean> {
    if (busy) return false;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        ...init,
        headers: init.body ? { "Content-Type": "application/json", ...init.headers } : init.headers,
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) {
        setError(await describeFailure(res));
        return false;
      }
      router.refresh();
      return true;
    } catch (err) {
      setError(describeNetworkError(err));
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { run, busy, error };
}

export async function describeFailure(res: Response): Promise<string> {
  if (res.status === 401 || res.status === 403) {
    return "Your session has expired or you don't have access — log in again.";
  }
  const data = (await res.json().catch(() => ({}))) as { error?: unknown };
  if (typeof data.error === "string") return data.error;
  return `Couldn't save (error ${res.status}). Please try again.`;
}

export function describeNetworkError(err: unknown): string {
  return err instanceof DOMException && err.name === "TimeoutError"
    ? "The server took too long to answer. Refresh the page to check, then try again."
    : "Couldn't reach the server. Check your connection and try again.";
}
