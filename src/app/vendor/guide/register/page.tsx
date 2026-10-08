import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { RegisterFrame } from "@/components/vendor/VendorUI";
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
      <RegisterFrame
        title="Finish your guide profile"
        intro="Your TCB (Tourism Council of Bhutan) licence number is required. Our team reviews every guide profile before it appears in search."
      >
        <GuideRegisterForm destinations={destinations} />
      </RegisterFrame>
    );
  }

  return (
    <RegisterFrame
      title="Apply as a tour guide"
      intro="Tell us about yourself and your TCB (Tourism Council of Bhutan) licence. Our team reviews every application by hand. You don't need an account to apply — if you're approved, we'll email you a link to set your password and log in."
    >
      <GuideApplicationForm destinations={destinations} />
    </RegisterFrame>
  );
}
