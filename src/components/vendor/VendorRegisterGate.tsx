import Link from "next/link";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/roles";
import { RegisterFrame } from "@/components/vendor/VendorUI";
import LogoutButton from "@/components/LogoutButton";

const ROLE_LABEL: Record<Role, string> = {
  TRAVELER: "traveller",
  GUIDE: "tour guide",
  HOTEL_OPERATOR: "hotel",
  TRANSPORT_OPERATOR: "transport operator",
  ADMIN: "admin",
};

/**
 * Checks who is looking at a vendor sign-up form before showing it.
 *
 * The forms post to APIs that only accept a signed-in account of the right
 * kind. Without this the form was open to anyone: a visitor could fill in
 * every field, then have the photo upload and the submit both fail — the
 * latter with a bare "Not authorized", which says nothing about what to do.
 * Now a signed-out visitor is asked to create the right account first, a
 * signed-in account of another kind is told which one it is, and someone who
 * has already registered goes to their dashboard.
 *
 * Renders `children` (the form) only for a signed-in account with `role` and
 * no listing yet.
 */
export default async function VendorRegisterGate({
  role,
  title,
  alreadyRegistered,
  children,
}: {
  role: Exclude<Role, "TRAVELER" | "ADMIN">;
  /** Page heading, shown above whichever message applies. */
  title: string;
  /** Whether this account already has its listing — checked by the page. */
  alreadyRegistered: (userId: string) => Promise<boolean>;
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const kind = ROLE_LABEL[role];

  if (user && user.role === role) {
    if (await alreadyRegistered(user.id)) redirect(dashboardPathForRole(role));
    return <>{children}</>;
  }

  return (
    <RegisterFrame title={title}>
      <div>
        {!user ? (
          <>
            <p className="font-semibold text-stone-900">
              First, create a {kind} account
            </p>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              Registering takes two steps: an account (email and password), then
              your listing details. Create the account, choose{" "}
              <strong>{capitalise(kind)}</strong> as the account type, and
              you&apos;ll come straight back to this form. Already have a {kind}{" "}
              account? Log in and you&apos;ll be brought here.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={`/register?role=${role}`} className="btn-primary">
                Create a {kind} account
              </Link>
              <Link href="/login" className="btn-secondary">
                Log in
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="font-semibold text-stone-900">
              You&apos;re signed in with {withArticle(ROLE_LABEL[user.role])}{" "}
              account
            </p>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              <strong className="break-all">{user.email}</strong> is{" "}
              {withArticle(ROLE_LABEL[user.role])} account, and a {kind} listing
              needs its own {kind} account. Log out, then create a new account
              with <strong>{capitalise(kind)}</strong> as the account type —
              using a different email address.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <LogoutButton
                redirectTo={`/register?role=${role}`}
                label={`Log out and create a ${kind} account`}
                className="btn-primary disabled:opacity-60"
              />
              <Link
                href={dashboardPathForRole(user.role)}
                className="text-sm font-semibold text-brand-700 hover:underline"
              >
                Back to my dashboard
              </Link>
            </div>
          </>
        )}
      </div>
    </RegisterFrame>
  );
}

function withArticle(word: string) {
  return `${/^[aeiou]/i.test(word) ? "an" : "a"} ${word}`;
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
