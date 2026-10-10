import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import HotelEditForm from "@/components/admin/HotelEditForm";

export default async function NewHotelPage() {
  const user = await getCurrentUser();
  if (!user) return null; // the admin layout shows the sign-in form
  if (user.role !== "ADMIN") return null; // the admin layout shows the sign-in form

  const destinations = await prisma.destination.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <Link href="/chim/vendors" className="text-sm text-stone-600 hover:underline">
        ← All vendors
      </Link>
      <h1 className="mb-1 mt-2 text-2xl font-bold">Add a hotel</h1>
      <p className="mb-6 text-sm text-stone-600">
        For hotels and homestays you already work with. The listing appears on /hotels as soon as
        you save it; add more room types afterwards from its edit page.
      </p>

      <HotelEditForm
        destinations={destinations}
        initial={{
          name: "",
          description: "",
          metaDescription: "",
          destinationId: destinations[0]?.id ?? "",
          address: "",
          latitude: "",
          longitude: "",
          amenities: [],
          photoUrls: [],
        }}
      />
    </div>
  );
}
