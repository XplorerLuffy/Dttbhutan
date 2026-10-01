import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/roles";
import AdminAccountForm from "@/components/admin/AdminAccountForm";

export const dynamic = "force-dynamic";

export default async function AdminAccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect(dashboardPathForRole(user.role));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Your account</h1>
      <p className="mb-6 max-w-2xl text-sm text-stone-600">
        The email address and password you use to sign in. Changing the password signs out every
        other browser signed in to this account — useful if the old password was ever shared or
        written down.
      </p>

      <AdminAccountForm email={user.email} />
    </div>
  );
}
