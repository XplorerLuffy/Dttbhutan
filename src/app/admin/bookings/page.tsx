import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dashboardPathForRole } from "@/lib/roles";
import StatusBadge from "@/components/StatusBadge";

export default async function AdminBookingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect(dashboardPathForRole(user.role));

  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      traveler: true,
      guide: { include: { user: true } },
      roomType: { include: { hotel: true } },
      vehicle: { include: { operator: true } },
    },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">All bookings</h1>
      <div className="space-y-2">
        {bookings.map((b) => (
          <Link
            key={b.id}
            href={`/dashboard/bookings/${b.id}`}
            className="card flex items-center justify-between hover:shadow-md"
          >
            <div>
              <p className="font-medium">
                {b.traveler.name} · {vendorLabel(b)}
              </p>
              <p className="text-sm text-stone-500">
                {b.startDate.toDateString()} → {b.endDate.toDateString()} · Nu.{" "}
                {Number(b.totalPrice).toLocaleString()}
              </p>
            </div>
            <StatusBadge status={b.status} />
          </Link>
        ))}
        {bookings.length === 0 && <p className="text-sm text-stone-500">No bookings yet.</p>}
      </div>
    </div>
  );
}

function vendorLabel(b: {
  type: string;
  guide: { user: { name: string } } | null;
  roomType: { hotel: { name: string } } | null;
  vehicle: { operator: { businessName: string } } | null;
}) {
  if (b.type === "GUIDE") return b.guide?.user.name ?? "Guide";
  if (b.type === "HOTEL") return b.roomType?.hotel.name ?? "Hotel";
  return b.vehicle?.operator.businessName ?? "Transport";
}
