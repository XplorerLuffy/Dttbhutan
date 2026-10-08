import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dashboardPathForRole } from "@/lib/roles";
import StatusBadge from "@/components/StatusBadge";
import {
  VendorPage,
  VendorHero,
  VendorNotice,
  VendorStats,
  VendorPanel,
  EmptyRow,
} from "@/components/vendor/VendorUI";
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

  const pending = bookings.filter((b) => b.status === "PENDING").length;
  const confirmed = bookings.filter((b) => b.status === "CONFIRMED").length;

  return (
    <VendorPage>
      <VendorHero
        title="My guide profile"
        subtitle={`TCB licence ${profile.licenseNumber}`}
        status={profile.status}
      />

      {profile.status === "PENDING" && (
        <VendorNotice tone="amber">
          Your profile is awaiting admin approval before it appears in search.
        </VendorNotice>
      )}
      {profile.status === "REJECTED" && (
        <VendorNotice tone="red">
          Your profile was rejected
          {profile.adminNote ? `: ${profile.adminNote}` : "."}
        </VendorNotice>
      )}

      <VendorStats
        items={[
          {
            label: "Rate per day",
            value: `Nu. ${Number(profile.ratePerDay).toLocaleString("en-IN")}`,
          },
          { label: "Awaiting your reply", value: pending },
          { label: "Confirmed", value: confirmed },
          { label: "All bookings", value: bookings.length },
        ]}
      />

      <VendorPanel title="Your details">
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-stone-500">Licence</dt>
            <dd className="font-medium text-stone-900">
              {profile.licenseNumber}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Languages</dt>
            <dd className="font-medium text-stone-900">
              {profile.languages.join(", ") || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Specialties</dt>
            <dd className="font-medium text-stone-900">
              {profile.specialties.join(", ") || "—"}
            </dd>
          </div>
        </dl>
      </VendorPanel>

      <VendorPanel title="Bookings">
        {bookings.length === 0 ? (
          <EmptyRow>No bookings yet.</EmptyRow>
        ) : (
          <ul className="divide-y divide-stone-100">
            {bookings.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3.5 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/bookings/${b.id}`}
                    className="text-sm font-semibold text-stone-900 hover:underline"
                  >
                    {b.traveler.name}
                  </Link>
                  <p className="text-xs text-stone-500">
                    {b.startDate.toDateString()} → {b.endDate.toDateString()}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={b.status} />
                  {b.status === "PENDING" && (
                    <SetBookingStatusButton
                      bookingId={b.id}
                      status="CONFIRMED"
                      label="Confirm"
                    />
                  )}
                  {b.status === "CONFIRMED" && (
                    <SetBookingStatusButton
                      bookingId={b.id}
                      status="COMPLETED"
                      label="Complete"
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </VendorPanel>
    </VendorPage>
  );
}
