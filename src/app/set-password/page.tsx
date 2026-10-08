import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import { findInvite } from "@/lib/invite";
import SetPasswordForm from "./SetPasswordForm";

export const dynamic = "force-dynamic";

/**
 * Where an approved guide lands from the emailed link. The link is checked
 * here, before the form, so a used or expired one says so straight away
 * instead of after the guide has typed a password.
 */
export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const user = token ? await findInvite(token) : null;

  if (!token || !user || user.authId) {
    return (
      <AuthLayout>
        <h1 className="mb-3 text-center text-2xl font-bold">This link can&apos;t be used</h1>
        <p className="text-center text-sm leading-relaxed text-stone-600">
          It has expired or has already been used. If you&apos;ve already set a password, you can
          log in. Otherwise, reply to our email and we&apos;ll send you a new link.
        </p>
        <div className="mt-6 flex justify-center">
          <Link href="/login" className="btn-primary">
            Go to log in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h1 className="mb-1 text-center text-2xl font-bold">Set your password</h1>
      <p className="mb-6 text-center text-sm text-stone-600">
        Welcome, {user.name}. Choose a password for <strong>{user.email}</strong> to log in to your
        dashboard.
      </p>
      <SetPasswordForm token={token} />
    </AuthLayout>
  );
}
