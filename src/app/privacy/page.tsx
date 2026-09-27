import type { Metadata } from "next";
import LegalPageShell, { Clause } from "@/components/legal/LegalPageShell";
import RichText from "@/components/RichText";
import { getCompany } from "@/lib/content";
import { getSections } from "@/lib/content/sections";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "What personal data we collect, why we need it, who we share it with, and how long we keep it.",
};

export default async function PrivacyPage() {
  const [company, { sections }] = await Promise.all([getCompany(), getSections("privacy")]);

  return (
    <LegalPageShell
      title="Privacy policy"
      intro={`What personal data ${company.name} collects, why we need it, and what we do with it.`}
    >
      {sections.map((section) => (
        <Clause key={section.id} heading={section.heading}>
          <RichText body={section.body} />
        </Clause>
      ))}
    </LegalPageShell>
  );
}
