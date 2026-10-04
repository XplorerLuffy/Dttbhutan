import { prisma } from "@/lib/prisma";
import GuideRegisterForm from "./GuideRegisterForm";
import VendorRegisterGate from "@/components/vendor/VendorRegisterGate";

export default async function GuideRegisterPage() {
  const destinations = await prisma.destination.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <VendorRegisterGate
      role="GUIDE"
      title="Register as a tour guide"
      alreadyRegistered={async (userId) =>
        Boolean(
          await prisma.guideProfile.findUnique({
            where: { userId },
            select: { id: true },
          }),
        )
      }
    >
      <div className="mx-auto max-w-lg">
        <h1 className="mb-1 text-2xl font-bold">Register as a tour guide</h1>
        <p className="mb-6 text-sm text-stone-600">
          Your TCB (Tourism Council of Bhutan) license number is required. An
          admin reviews every guide profile before it appears in search — this
          is a manual check today rather than an automated TCB lookup.
        </p>

        <GuideRegisterForm destinations={destinations} />
      </div>
    </VendorRegisterGate>
  );
}
