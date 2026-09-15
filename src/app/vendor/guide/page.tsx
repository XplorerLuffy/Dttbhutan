import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dashboardPathForRole } from "@/lib/roles";
import StatusBadge from "@/components/StatusBadge";
import { SetBookingStatusButton } from "@/components/BookingActions";

export default async function GuideVendorDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "GUIDE") redirect(dashboardPathForRole(user.role));

  const profile = await prisma.guideProfile.findUnique({
    where: { userId: user.id },
  });
  if (!profile) redirect("/vendor/guide/register");

  const bookings = await prisma.booking.findMany({
    where: { guideId: profile.id },
    orderBy: { startDate: "desc" },
    include: { traveler: true },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My guide profile</h1>
        <StatusBadge status={profile.status} />
      </div>

      {profile.status === "PENDING" && (
        <p className="card mb-6 text-sm text-amber-700">
          Your profile is awaiting admin approval before it appears in search.
        </p>
      )}
      {profile.status === "REJECTED" && (
        <p className="card mb-6 text-sm text-red-700">
          Your profile was rejected{profile.adminNote ? `: ${profile.adminNote}` : "."}
        </p>
      )}

      <div className="card mb-6">
        <p><strong>License:</strong> {profile.licenseNumber}</p>
        <p><strong>Languages:</strong> {profile.languages.join(", ")}</p>
        <p><strong>Specialties:</strong> {profile.specialties.join(", ")}</p>
        <p><strong>Rate:</strong> Nu. {Number(profile.ratePerDay).toLocaleString()}/day</p>
      </div>

      <h2 className="mb-3 text-lg font-semibold">Bookings</h2>
      {bookings.length === 0 ? (
        <p className="text-sm text-stone-500">No bookings yet.</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="card flex items-center justify-between">
              <div>
                <Link href={`/dashboard/bookings/${b.id}`} className="font-medium hover:underline">
                  {b.traveler.name}
                </Link>
                <p className="text-sm text-stone-500">
                  {b.startDate.toDateString()} → {b.endDate.toDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={b.status} />
                {b.status === "PENDING" && (
                  <SetBookingStatusButton bookingId={b.id} status="CONFIRMED" label="Confirm" />
                )}
                {b.status === "CONFIRMED" && (
                  <SetBookingStatusButton bookingId={b.id} status="COMPLETED" label="Complete" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
