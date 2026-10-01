"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

/**
 * The admin's own sign-in details: the address they log in with, and the
 * password.
 *
 * Both sit in one form because the current password is the gate for either
 * change, and asking for it twice in two forms on the same page reads as a
 * mistake. Leave the new-password fields empty to change only the address.
 */
export default function AdminAccountForm({ email }: { email: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [nextEmail, setNextEmail] = useState(email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const emailChanged = nextEmail.trim().toLowerCase() !== email.toLowerCase();
  const nothingToChange = !emailChanged && !newPassword;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setDone(null);

    startTransition(async () => {
      const res = await fetch("/api/admin/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: nextEmail,
          currentPassword,
          // Send undefined rather than "" so the schema's optional() applies
          // and an address-only change is not judged against the password
          // rules.
          newPassword: newPassword || undefined,
          confirmPassword: confirmPassword || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Zod's flatten() puts per-field messages under fieldErrors; show the
        // first rather than "[object Object]".
        const flat = data.error?.fieldErrors as Record<string, string[]> | undefined;
        const first = flat && Object.values(flat).flat()[0];
        setError(first ?? (typeof data.error === "string" ? data.error : "Could not save those changes"));
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setDone(
        [
          data.emailChanged ? `You now sign in as ${data.email}` : null,
          data.passwordChanged
            ? "Your password is changed, and anyone else signed in to this account has been signed out"
            : null,
        ]
          .filter(Boolean)
          .join(". ") + "."
      );
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-6">
      <div>
        <label htmlFor="admin-email" className="mb-1 block text-sm font-semibold text-stone-800">
          Sign-in email
        </label>
        <input
          id="admin-email"
          type="email"
          autoComplete="username"
          required
          value={nextEmail}
          onChange={(e) => setNextEmail(e.target.value)}
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
        />
        <p className="mt-1 text-xs text-stone-500">
          This is the address you log in with. Changing it does not change where the agency&apos;s
          notification emails go.
        </p>
      </div>

      <fieldset className="space-y-4 rounded-xl border border-stone-200 p-4">
        <legend className="px-1 text-sm font-semibold text-stone-800">New password</legend>
        <p className="text-xs text-stone-500">
          Leave these empty to change only the email address. At least 10 characters, using three
          of: lower case, upper case, numbers, symbols.
        </p>
        <div>
          <label htmlFor="admin-new" className="mb-1 block text-sm font-medium text-stone-700">
            New password
          </label>
          <input
            id="admin-new"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="admin-confirm" className="mb-1 block text-sm font-medium text-stone-700">
            Repeat new password
          </label>
          <input
            id="admin-confirm"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2"
          />
        </div>
      </fieldset>

      <div>
        <label htmlFor="admin-current" className="mb-1 block text-sm font-semibold text-stone-800">
          Current password
        </label>
        <input
          id="admin-current"
          type="password"
          autoComplete="current-password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
        />
        <p className="mt-1 text-xs text-stone-500">
          Required for either change, so that a browser left signed in is not enough to take the
          account over.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {done && (
        <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
          {done}
        </p>
      )}

      <button type="submit" disabled={isPending || nothingToChange} className="btn-primary">
        {isPending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
