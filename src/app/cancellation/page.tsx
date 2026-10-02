import type { Metadata } from "next";
import LegalPageShell, { Clause, Confirm } from "@/components/legal/LegalPageShell";
import RichText from "@/components/RichText";
import { getCompany, getSiteContent } from "@/lib/content";
import { getSections } from "@/lib/content/sections";

export const metadata: Metadata = {
  title: "Cancellation & refund policy",
  description:
    "How cancellations, date changes and refunds work, including the refund tiers by notice period.",
  alternates: { canonical: "/cancellation" },
};

export default async function CancellationPage() {
  const [company, content, { sections }] = await Promise.all([
    getCompany(),
    getSiteContent(),
    getSections("cancellation"),
  ]);

  const tiers = [1, 2, 3, 4, 5].map((n) => ({
    window: content(`legal.tier${n}.window`),
    refund: content(`legal.tier${n}.refund`),
  }));

  // A table, not prose, so it stays a slot the clause text positions rather
  // than something retyped into the body — the figures live with the rest of
  // the editable settings and are shared with anything else that quotes them.
  const tiersTable = (
    <div className="overflow-x-auto">
      <table className="mt-2 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-stone-200 text-left text-stone-500">
            <th className="py-2 pr-4 font-medium">When you cancel</th>
            <th className="py-2 font-medium">Refund</th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((tier) => (
            <tr key={tier.window} className="border-b border-stone-100">
              <td className="py-2 pr-4">{tier.window}</td>
              <td className="py-2">
                <Confirm>{tier.refund}</Confirm>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <LegalPageShell
      title="Cancellation & refund policy"
      intro={`How cancellations, changes and refunds work for bookings made with ${company.name}.`}
    >
      {sections.map((section) => (
        <Clause key={section.id} heading={section.heading}>
          <RichText body={section.body} slots={{ "cancellation-tiers": tiersTable }} />
        </Clause>
      ))}
    </LegalPageShell>
  );
}
