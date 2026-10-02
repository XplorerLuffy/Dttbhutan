import type { Metadata } from "next";
import LegalPageShell, { Clause } from "@/components/legal/LegalPageShell";
import CompanyFact from "@/components/company/CompanyFact";
import RichText from "@/components/RichText";
import { getCompany } from "@/lib/content";
import { getSections } from "@/lib/content/sections";

export const metadata: Metadata = {
  title: "Terms & conditions",
  description:
    "The terms that apply when booking guides, accommodation, transport, flights and package tours.",
  alternates: { canonical: "/terms" },
};

export default async function TermsPage() {
  const [company, { sections }] = await Promise.all([getCompany(), getSections("terms")]);

  return (
    <LegalPageShell
      title="Terms & conditions"
      intro={`The terms that apply when you book travel arrangements through ${company.name}.`}
    >
      {sections.map((section) => (
        <Clause key={section.id} heading={section.heading}>
          <RichText
            body={section.body}
            slots={{
              // Kept as a slot rather than typed into the clause: these are
              // the registered name and licence number, which belong to the
              // company record and must not drift from it.
              "company-identity": (
                <div className="space-y-2">
                  <p>
                    {company.name} is a tour operator based in Bhutan, arranging guides,
                    accommodation, transport, flights and complete itineraries for visitors.
                  </p>
                  <p className="space-x-2">
                    <CompanyFact label="Registered name" value={company.legalName} />{" "}
                    <CompanyFact label="TCB licence" value={company.tcbLicenceNumber} />
                  </p>
                </div>
              ),
            }}
          />
        </Clause>
      ))}
    </LegalPageShell>
  );
}
