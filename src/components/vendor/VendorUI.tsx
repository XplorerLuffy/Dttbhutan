import Image from "next/image";
import type { ReactNode } from "react";
import StatusBadge from "@/components/StatusBadge";

/** Page frame shared by the three vendor dashboards, matching the admin overview's look. */
export function VendorPage({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      {children}
    </div>
  );
}

export function VendorHero({
  title,
  subtitle,
  status,
}: {
  title: string;
  subtitle: string;
  status: string;
}) {
  return (
    <section className="relative isolate overflow-hidden rounded-2xl border border-stone-200 bg-[#fcf6e9]">
      <Image
        src="/media/packages/dzong-ridge.webp"
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) 64rem, 100vw"
        className="-z-10 object-cover object-right opacity-60"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#fcf6e9] via-[#fcf6e9]/90 to-transparent" />
      <div className="px-5 py-8 sm:px-8 sm:py-10">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-semibold text-stone-900 sm:text-4xl">
            {title}
          </h1>
          <StatusBadge status={status} />
        </div>
        <p className="mt-1.5 max-w-md text-sm text-stone-700 sm:text-base">
          {subtitle}
        </p>
      </div>
    </section>
  );
}

export function VendorNotice({
  tone,
  children,
}: {
  tone: "amber" | "red";
  children: ReactNode;
}) {
  const cls =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : "border-red-200 bg-red-50 text-red-800";
  return (
    <p className={`rounded-2xl border px-4 py-3 text-sm sm:px-5 ${cls}`}>
      {children}
    </p>
  );
}

export function VendorStats({
  items,
}: {
  items: { label: string; value: string | number }[];
}) {
  return (
    <section
      className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
      aria-label="Summary"
    >
      {items.map((c) => (
        <div
          key={c.label}
          className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <p className="text-sm font-medium text-stone-600">{c.label}</p>
          <p className="mt-1 font-display text-2xl font-bold text-stone-900 sm:text-3xl">
            {c.value}
          </p>
        </div>
      ))}
    </section>
  );
}

export function VendorPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="mb-3 font-display text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function EmptyRow({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
      {children}
    </p>
  );
}
