import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import GuideApplicationForm from "./GuideApplicationForm";
import GuideRegisterForm from "./GuideRegisterForm";

export const metadata = { title: "Apply as a tour guide" };

/**
 * Guides apply; they don't sign up. An application needs no account — an admin
 * reviews it, and only an approved guide is given a login (by an emailed link
 * to set a password). That keeps accounts for people who have been checked,
 * rather than one for everyone who types an email into a form.
 *
 * The exception is a guide who already has an account from before this
 * existed and hasn't filled in a listing: they finish it with the original
 * profile form rather than being asked to apply from scratch.
 */
export default async function GuideRegisterPage() {
  const destinations = await prisma.destination.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const user = await getCurrentUser();
  if (user?.role === "GUIDE") {
    const listing = await prisma.guideProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (listing) redirect("/vendor/guide");

    return (
      <div className="mx-auto max-w-lg">
        <h1 className="mb-1 text-2xl font-bold">Finish your guide profile</h1>
        <p className="mb-6 text-sm text-stone-600">
          Your TCB (Tourism Council of Bhutan) licence number is required. Our team reviews every
          guide profile before it appears in search.
        </p>
        <GuideRegisterForm destinations={destinations} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 text-2xl font-bold">Apply as a tour guide</h1>
      <p className="mb-6 text-sm leading-relaxed text-stone-600">
        Tell us about yourself and your TCB (Tourism Council of Bhutan) licence. Our team reviews
        every application by hand. You don&apos;t need an account to apply — if you&apos;re
        approved, we&apos;ll email you a link to set your password and log in.
      </p>

      <GuideApplicationForm destinations={destinations} />
    </div>
  );
}
