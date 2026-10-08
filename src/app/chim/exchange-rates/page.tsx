import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CURRENCIES } from "@/lib/currency";
import { FALLBACK_BTN_PER_UNIT } from "@/lib/fx";
import RefreshRatesButton from "@/components/admin/RefreshRatesButton";

export const dynamic = "force-dynamic";

export default async function AdminExchangeRatesPage() {
  const user = await getCurrentUser();
  if (!user) return null; // the admin layout shows the sign-in form
  if (user.role !== "ADMIN") return null; // the admin layout shows the sign-in form

  const rows = await prisma.exchangeRate.findMany();
  const byCurrency = new Map(rows.map((r) => [r.currency, r]));

  const currencies = CURRENCIES.filter((c) => c.code !== "BTN");

  return (
    <div className="space-y-6">
      <section className="relative isolate overflow-hidden rounded-2xl border border-stone-200 bg-[#fcf6e9]">
        <Image
          src="/media/packages/dzong-ridge.webp"
          alt=""
          fill
          sizes="(min-width: 1024px) 70vw, 100vw"
          className="-z-10 object-cover object-right opacity-60"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#fcf6e9] via-[#fcf6e9]/90 to-transparent" />
        <div className="px-5 py-7 sm:px-8 sm:py-9">
          <h1 data-hero className="font-display text-3xl font-semibold text-stone-900 sm:text-4xl">
            Exchange rates
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-stone-700 sm:text-base">
            BTN is the real currency every booking is charged in. These rates only control what
            travelers see while browsing in USD, AUD, INR, EUR, or GBP. USD/AUD/EUR/GBP refresh
            automatically once a day from a live source (frankfurter.app, ECB reference rates); INR
            is always 1:1 with BTN by the Royal Monetary Authority&apos;s peg.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="mb-3 font-display text-lg font-semibold">Update now</h2>
        <RefreshRatesButton />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3" aria-label="Current rates">
        {currencies.map((c) => {
          const row = byCurrency.get(c.code);
          const rate =
            c.code === "INR" ? 1 : Number(row?.btnPerUnit ?? FALLBACK_BTN_PER_UNIT[c.code as "USD" | "AUD" | "EUR" | "GBP"]);
          return (
            <div key={c.code} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
              <p className="text-sm font-medium text-stone-600">
                {c.code} <span className="text-stone-400">· {c.label}</span>
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-stone-900 sm:text-3xl">
                Nu. {rate.toLocaleString(undefined, { maximumFractionDigits: 4 })}
              </p>
              <p className="mt-0.5 text-xs text-stone-500">for 1 {c.code}</p>
              <dl className="mt-3 space-y-1 border-t border-stone-100 pt-3 text-xs text-stone-500">
                <div className="flex justify-between gap-3">
                  <dt>Source</dt>
                  <dd className="text-right text-stone-700">
                    {c.code === "INR" ? "Fixed peg" : row?.source ?? "Not fetched yet (using fallback)"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Last updated</dt>
                  <dd className="text-right text-stone-700">
                    {c.code === "INR" ? "—" : row ? row.updatedAt.toLocaleString() : "—"}
                  </dd>
                </div>
              </dl>
            </div>
          );
        })}
      </section>
    </div>
  );
}
