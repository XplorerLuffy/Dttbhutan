import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { CURRENCIES } from "@/lib/currency";
import { FALLBACK_BTN_PER_UNIT } from "@/lib/fx";
import RefreshRatesButton from "@/components/admin/RefreshRatesButton";

export const dynamic = "force-dynamic";

export default async function AdminExchangeRatesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect(dashboardPathForRole(user.role));

  const rows = await prisma.exchangeRate.findMany();
  const byCurrency = new Map(rows.map((r) => [r.currency, r]));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Exchange rates</h1>
      <p className="mb-6 text-sm text-stone-600">
        BTN is the real currency every booking is charged in. These rates only control what
        travelers see while browsing in USD, AUD, INR, EUR, or GBP. USD/AUD/EUR/GBP refresh
        automatically once a day from a live source (frankfurter.app, ECB reference rates);
        INR is always 1:1 with BTN by the Royal Monetary Authority&apos;s peg.
      </p>

      <RefreshRatesButton />

      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-stone-200 text-stone-500">
            <th className="py-2 pr-4">Currency</th>
            <th className="py-2 pr-4">1 unit =</th>
            <th className="py-2 pr-4">Source</th>
            <th className="py-2 pr-4">Last updated</th>
          </tr>
        </thead>
        <tbody>
          {CURRENCIES.filter((c) => c.code !== "BTN").map((c) => {
            const row = byCurrency.get(c.code);
            const rate =
              c.code === "INR" ? 1 : Number(row?.btnPerUnit ?? FALLBACK_BTN_PER_UNIT[c.code as "USD" | "AUD" | "EUR" | "GBP"]);
            return (
              <tr key={c.code} className="border-b border-stone-100">
                <td className="py-2 pr-4 font-medium">
                  {c.code} <span className="text-stone-400">· {c.label}</span>
                </td>
                <td className="py-2 pr-4">Nu. {rate.toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                <td className="py-2 pr-4 text-stone-500">
                  {c.code === "INR" ? "Fixed peg" : row?.source ?? "Not fetched yet (using fallback)"}
                </td>
                <td className="py-2 pr-4 text-stone-500">
                  {c.code === "INR" ? "—" : row ? row.updatedAt.toLocaleString() : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
