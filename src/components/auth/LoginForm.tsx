"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { dashboardPathForRole } from "@/lib/roles";
import type { Role } from "@prisma/client";

/**
 * Email + password sign-in. On /login it opens the dashboard for the
 * account's role. As the admin sign-in (`admin`) it accepts admin accounts
 * only and re-renders the page it is on, so an admin returns to the screen
 * they were signed out of.
 */
export default function LoginForm({ admin = false }: { admin?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Read here rather than with useSearchParams, which would need a Suspense
  // boundary around every page that shows this form.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("expired")) {
      setNotice("For security, you were signed out after a period of inactivity. Please log in again.");
    }
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
        realm: admin ? "admin" : "public",
      }),
    }).catch(() => null);

    if (!res || !res.ok) {
      setIsSubmitting(false);
      const data = res ? await res.json().catch(() => ({})) : {};
      setError(data.error ?? (res ? "Login failed" : "Couldn't reach the server. Please try again."));
      return;
    }

    const data = await res.json();
    if (admin) {
      // Drop ?expired so the notice doesn't come back on the next refresh.
      router.replace(window.location.pathname);
    } else {
      router.push(dashboardPathForRole(data.role as Role));
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {notice && (
        <p role="status" className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {notice}
        </p>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium">Email</label>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className="w-full rounded-md border border-stone-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Password</label>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-md border border-stone-300 px-3 py-2"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-brand-700 px-4 py-2 font-medium text-white hover:bg-brand-800 disabled:opacity-50"
      >
        {isSubmitting ? "Logging in..." : "Log in"}
      </button>
    </form>
  );
}
