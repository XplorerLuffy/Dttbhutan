import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileView from "@/components/admin/ProfileView";

export default async function HotelProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return null; // the admin layout shows the sign-in form
  const { id } = await params;
  const h = await prisma.hotel.findUnique({
    where: { id },
    include: { owner: true, destination: true, roomTypes: true },
  });
  if (!h) notFound();
  return (
    <ProfileView
      kind="Hotel"
      title={h.name}
      status={h.status}
      photo={h.photoUrls[0]}
      photos={h.photoUrls.slice(1)}
      editHref={`/chim/vendors/hotels/${h.id}/edit`}
      about={h.description}
      adminNote={h.adminNote}
      rows={[
        { label: "Owner", value: h.owner.name },
        { label: "Email", value: h.owner.email },
        { label: "Phone", value: h.owner.phone },
        { label: "Destination", value: h.destination.name },
        { label: "Address", value: h.address },
        { label: "Amenities", value: h.amenities.join(", ") },
        {
          label: "Room types",
          value: h.roomTypes
            .map((r) => `${r.name} (${r.capacity} guests) — Nu. ${Number(r.pricePerNight).toLocaleString("en-IN")}/night`)
            .join("; "),
        },
      ]}
    />
  );
}
