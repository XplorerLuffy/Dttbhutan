import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import GuideEditForm, { EMPTY_GUIDE } from "@/components/admin/GuideEditForm";

export default async function NewGuidePage() {
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
      <h1 className="mb-1 mt-2 text-2xl font-bold">Add a guide</h1>
      <p className="mb-6 text-sm text-stone-600">
        For guides you already work with. The listing appears on /guides as soon as you save it.
      </p>

      <GuideEditForm destinations={destinations} initial={EMPTY_GUIDE} />
    </div>
  );
}
