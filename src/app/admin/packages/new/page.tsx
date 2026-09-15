import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dashboardPathForRole } from "@/lib/roles";
import ItineraryForm from "@/components/admin/ItineraryForm";

export default async function NewPackagePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect(dashboardPathForRole(user.role));

  const destinations = await prisma.destination.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">New package</h1>
      <ItineraryForm destinations={destinations} />
    </div>
  );
}
