import { pageMetadata } from "@/lib/pageMeta";
import type { Metadata } from "next";
import LegalPageShell, { Clause } from "@/components/legal/LegalPageShell";
import RichText from "@/components/RichText";
import { getCompany } from "@/lib/content";
import { getSections } from "@/lib/content/sections";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("privacy", "/privacy");
}

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
