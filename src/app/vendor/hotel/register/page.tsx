import { prisma } from "@/lib/prisma";
import HotelRegisterForm from "./HotelRegisterForm";

export default async function HotelRegisterPage() {
  const destinations = await prisma.destination.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 text-2xl font-bold">Register your hotel</h1>
      <p className="mb-6 text-sm text-stone-600">
        Add your first room type now — you can add more room types and
        photos from your dashboard after approval. An admin reviews your
        listing before it appears in search.
      </p>

      <HotelRegisterForm destinations={destinations} />
    </div>
  );
}
