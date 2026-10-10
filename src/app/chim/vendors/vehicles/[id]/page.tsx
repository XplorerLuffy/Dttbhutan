import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileView from "@/components/admin/ProfileView";

export default async function VehicleProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return null; // the admin layout shows the sign-in form
  const { id } = await params;
  const v = await prisma.vehicle.findUnique({ where: { id }, include: { operator: true } });
  if (!v) notFound();
  return (
    <ProfileView
      kind="Vehicle"
      title={`${v.type.replace("_", " ")} · ${v.plateNumber}`}
      status={v.status}
      editHref={`/chim/vendors/vehicles/${v.id}/edit`}
      adminNote={v.adminNote}
      rows={[
        { label: "Operator", value: v.operator.businessName },
        { label: "Seats", value: String(v.capacity) },
        { label: "Plate number", value: v.plateNumber },
        { label: "Driver", value: v.driverName },
        { label: "Driver licence", value: v.driverLicenseNumber },
        { label: "Rate per day", value: `Nu. ${Number(v.ratePerDay).toLocaleString("en-IN")}` },
        { label: "Rate per km", value: v.ratePerKm ? `Nu. ${Number(v.ratePerKm).toLocaleString("en-IN")}` : null },
      ]}
    />
  );
}
