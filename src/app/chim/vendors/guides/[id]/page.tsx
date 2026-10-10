import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileView from "@/components/admin/ProfileView";

export default async function GuideProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return null; // the admin layout shows the sign-in form
  const { id } = await params;
  const g = await prisma.guideProfile.findUnique({
    where: { id },
    include: { user: true, destinations: { select: { name: true } } },
  });
  if (!g) notFound();
  return (
    <ProfileView
      kind="Guide"
      title={g.user.name}
      status={g.status}
      photo={g.photoUrl}
      editHref={`/chim/vendors/guides/${g.id}/edit`}
      about={g.bio}
      adminNote={g.adminNote}
      rows={[
        { label: "Email", value: g.user.email },
        { label: "Phone", value: g.user.phone },
        { label: "TCB licence", value: g.licenseNumber },
        { label: "Languages", value: g.languages.join(", ") },
        { label: "Specialties", value: g.specialties.join(", ") },
        { label: "Experience", value: `${g.yearsExperience} years` },
        { label: "Rate per day", value: `Nu. ${Number(g.ratePerDay).toLocaleString("en-IN")}` },
        { label: "Covers", value: g.destinations.map((d) => d.name).join(", ") },
      ]}
    />
  );
}
