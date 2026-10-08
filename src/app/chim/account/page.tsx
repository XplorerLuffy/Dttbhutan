import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import AdminAccountForm from "@/components/admin/AdminAccountForm";

export const dynamic = "force-dynamic";

export default async function AdminAccountPage() {
  const user = await getCurrentUser();
  if (!user) return null; // the admin layout shows the sign-in form
  if (user.role !== "ADMIN") return null; // the admin layout shows the sign-in form

  return (
    <div className="space-y-6">
      <section className="relative isolate overflow-hidden rounded-2xl border border-stone-200 bg-[#fcf6e9]">
        <Image
          src="/media/packages/dzong-ridge.webp"
          alt=""
          fill
          sizes="(min-width: 1024px) 70vw, 100vw"
          className="-z-10 object-cover object-right opacity-60"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#fcf6e9] via-[#fcf6e9]/90 to-transparent" />
        <div className="px-5 py-7 sm:px-8 sm:py-9">
          <h1 data-hero className="font-display text-3xl font-semibold text-stone-900 sm:text-4xl">
            Your account
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-stone-700 sm:text-base">
            The email address and password you use to sign in. Changing the password signs out every
            other browser signed in to this account — useful if the old password was ever shared or
            written down.
          </p>
        </div>
      </section>

      <section className="max-w-2xl rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
        <AdminAccountForm email={user.email} />
      </section>
    </div>
  );
}
