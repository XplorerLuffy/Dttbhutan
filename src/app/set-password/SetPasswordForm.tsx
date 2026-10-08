"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { dashboardPathForRole } from "@/lib/roles";
import type { Role } from "@prisma/client";

export default function SetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password !== form.get("confirm")) {
      setError("The two passwords don't match.");
      return;
    }

    setBusy(true);
    const res = await fetch("/api/auth/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    }).catch(() => null);

    if (!res || !res.ok) {
      setBusy(false);
      const data = res ? await res.json().catch(() => ({})) : {};
      setError(
        typeof data.error === "string"
          ? data.error
          : res
            ? "Something went wrong. Please try again."
            : "Couldn't reach the server. Check your connection and try again."
      );
      return;
    }

    const data = await res.json();
    router.push(dashboardPathForRole(data.role as Role));
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">New password</label>
        <input
          name="password"
          type="password"
          minLength={8}
          maxLength={72}
          required
          autoComplete="new-password"
          className="w-full rounded-md border border-stone-300 px-3 py-2"
        />
        <p className="mt-1 text-xs text-stone-500">At least 8 characters.</p>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Confirm password</label>
        <input
          name="confirm"
          type="password"
          required
          autoComplete="new-password"
          className="w-full rounded-md border border-stone-300 px-3 py-2"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-md bg-brand-700 px-4 py-2 font-medium text-white hover:bg-brand-800 disabled:opacity-50"
      >
        {busy ? "Saving..." : "Set password and log in"}
      </button>
    </form>
  );
}
