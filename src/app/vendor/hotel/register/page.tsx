import { prisma } from "@/lib/prisma";
import HotelRegisterForm from "./HotelRegisterForm";
import { RegisterFrame } from "@/components/vendor/VendorUI";
import VendorRegisterGate from "@/components/vendor/VendorRegisterGate";

export default async function HotelRegisterPage() {
  const destinations = await prisma.destination.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <VendorRegisterGate
      role="HOTEL_OPERATOR"
      title="Register your hotel"
      alreadyRegistered={async (ownerId) =>
        Boolean(
          await prisma.hotel.findUnique({
            where: { ownerId },
            select: { id: true },
          }),
        )
      }
    >
      <RegisterFrame
        title="Register your hotel"
        intro="Add your first room type now — you can add more room types and photos from your dashboard after approval. An admin reviews your listing before it appears in search."
      >
        <HotelRegisterForm destinations={destinations} />
      </RegisterFrame>
    </VendorRegisterGate>
  );
}
