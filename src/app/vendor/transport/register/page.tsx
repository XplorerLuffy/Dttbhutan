import { prisma } from "@/lib/prisma";
import { RegisterFrame } from "@/components/vendor/VendorUI";
import VendorRegisterGate from "@/components/vendor/VendorRegisterGate";
import TransportRegisterForm from "./TransportRegisterForm";

export default function TransportRegisterPage() {
  return (
    <VendorRegisterGate
      role="TRANSPORT_OPERATOR"
      title="Register as a transport operator"
      alreadyRegistered={async (ownerId) =>
        Boolean(
          await prisma.transportOperator.findUnique({
            where: { ownerId },
            select: { id: true },
          }),
        )
      }
    >
      <RegisterFrame
        title="Register as a transport operator"
        intro="Register your business and your first vehicle. If the vehicle already has a GPS unit installed, add its device identifier (IMEI or Traccar unique ID) so trip mileage can be verified from GPS instead of driver-reported distance."
      >
        <TransportRegisterForm />
      </RegisterFrame>
    </VendorRegisterGate>
  );
}
