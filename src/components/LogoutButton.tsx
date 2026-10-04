"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function LogoutButton({
  redirectTo = "/",
  label = "Log out",
  className = "text-stone-600 hover:text-stone-900 disabled:opacity-50",
}: {
  /** Where to land afterwards — e.g. straight on to creating another account. */
  redirectTo?: string;
  label?: string;
  className?: string;
} = {}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          router.push(redirectTo);
          router.refresh();
        });
      }}
      className={className}
    >
      {label}
    </button>
  );
}
