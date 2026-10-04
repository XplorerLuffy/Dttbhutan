import { prisma } from "@/lib/prisma";
import VendorRegisterGate from "@/components/vendor/VendorRegisterGate";
import TransportRegisterForm from "./TransportRegisterForm";

export default function TransportRegisterPage() {
  return (
    <VendorRegisterGate
      role="TRANSPORT_OPERATOR"
      title="Register as a transport operator"
      alreadyRegistered={async (ownerId) =>
        Boolean(
          await prisma.transportOperator.findUnique({ where: { ownerId }, select: { id: true } })
        )
      }
    >
      <TransportRegisterForm />
    </VendorRegisterGate>
  );
}
