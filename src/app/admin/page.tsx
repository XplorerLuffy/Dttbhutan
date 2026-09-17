import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dashboardPathForRole } from "@/lib/roles";

export default async function AdminHomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect(dashboardPathForRole(user.role));

  const [pendingGuides, pendingHotels, pendingOperators, pendingBookings, flaggedTrips, newCustomTourRequests, newEnquiries] =
    await Promise.all([
      prisma.guideProfile.count({ where: { status: "PENDING" } }),
      prisma.hotel.count({ where: { status: "PENDING" } }),
      prisma.transportOperator.count({ where: { status: "PENDING" } }),
      prisma.booking.count({ where: { status: "PENDING" } }),
      prisma.tripDistanceReport.count({ where: { flagged: true } }),
      prisma.customTourRequest.count({ where: { status: "NEW" } }),
      prisma.contactMessage.count({ where: { status: "NEW" } }),
    ]);

  const cards = [
    {
      href: "/admin/vendors",
      title: "Vendor approvals",
      value: pendingGuides + pendingHotels + pendingOperators,
      hint: "pending review",
    },
    {
      href: "/admin/bookings",
      title: "Bookings",
      value: pendingBookings,
      hint: "pending confirmation",
    },
    {
      href: "/admin/gps/trips",
      title: "GPS mileage reports",
      value: flaggedTrips,
      hint: "flagged for review",
    },
    {
      href: "/admin/packages",
      title: "Package tours",
      value: null,
      hint: "manage itineraries",
    },
    {
      href: "/admin/custom-tours",
      title: "Custom tour requests",
      value: newCustomTourRequests,
      hint: "new inquiries",
    },
    {
      href: "/admin/enquiries",
      title: "Enquiries",
      value: newEnquiries,
      hint: "unread messages",
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Admin dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="card hover:shadow-md">
            <p className="text-sm text-stone-500">{c.title}</p>
            {c.value === null ? (
              <p className="mt-1 text-lg font-semibold text-brand-800">Manage →</p>
            ) : (
              <p className="mt-1 text-3xl font-bold text-brand-800">{c.value}</p>
            )}
            <p className="text-xs text-stone-400">{c.hint}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
