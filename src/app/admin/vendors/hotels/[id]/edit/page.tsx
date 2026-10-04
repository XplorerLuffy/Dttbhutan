import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dashboardPathForRole } from "@/lib/roles";
import HotelEditForm from "@/components/admin/HotelEditForm";
import AddRoomTypeForm from "@/app/vendor/hotel/room-types/AddRoomTypeForm";
import Money from "@/components/Money";

export default async function EditHotelPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect(dashboardPathForRole(user.role));

  const { id } = await params;
  const [hotel, destinations] = await Promise.all([
    prisma.hotel.findUnique({
      where: { id },
      include: { roomTypes: { orderBy: { pricePerNight: "asc" } } },
    }),
    prisma.destination.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!hotel) notFound();

  return (
    <div>
      <Link href="/admin/vendors" className="text-sm text-stone-600 hover:underline">
        ← All vendors
      </Link>
      <h1 className="mb-1 mt-2 text-2xl font-bold">{hotel.name}</h1>
      <p className="mb-6 text-sm text-stone-600">
        Hotel listing as travelers see it on /hotels and the destination pages. Approval status is
        set from the vendors list — saving these details doesn&apos;t email the operator.
      </p>

      <HotelEditForm
        hotelId={hotel.id}
        destinations={destinations}
        initial={{
          name: hotel.name,
          description: hotel.description ?? "",
          destinationId: hotel.destinationId,
          address: hotel.address ?? "",
          latitude: hotel.latitude?.toString() ?? "",
          longitude: hotel.longitude?.toString() ?? "",
          amenities: hotel.amenities,
          photoUrls: hotel.photoUrls,
        }}
      />

      <section className="mt-8">
        <h2 className="mb-1 text-lg font-semibold">Room types</h2>
        <p className="mb-3 text-sm text-stone-600">
          What travellers can book. Hotels with an owner login can also add these from their own
          dashboard; for hotels you added yourself, this is the only place.
        </p>
        <div className="mb-3 space-y-2">
          {hotel.roomTypes.map((rt) => (
            <div key={rt.id} className="card flex items-center justify-between gap-3 text-sm">
              <span>
                <span className="font-medium">{rt.name}</span>
                <span className="text-stone-500">
                  {" "}
                  · up to {rt.capacity} guests · {rt.totalRooms}{" "}
                  {rt.totalRooms === 1 ? "room" : "rooms"}
                </span>
              </span>
              <Money btn={Number(rt.pricePerNight)} className="font-semibold" />
            </div>
          ))}
          {hotel.roomTypes.length === 0 && (
            <p className="text-sm text-stone-500">
              No room types yet — this hotel can&apos;t be booked until it has one.
            </p>
          )}
        </div>
        <AddRoomTypeForm endpoint={`/api/admin/hotels/${hotel.id}/room-types`} />
      </section>
    </div>
  );
}
