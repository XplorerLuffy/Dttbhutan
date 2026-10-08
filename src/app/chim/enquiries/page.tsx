import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EnquiryStatusControls from "@/components/admin/EnquiryStatusControls";
import EnquiryReply from "@/components/admin/EnquiryReply";

const STATUS_BADGE: Record<string, string> = {
  NEW: "badge-pending",
  IN_PROGRESS: "badge",
  CLOSED: "badge-approved",
};

export const dynamic = "force-dynamic";

export default async function AdminEnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) return null; // the admin layout shows the sign-in form
  if (user.role !== "ADMIN") return null; // the admin layout shows the sign-in form

  const sp = await searchParams;
  const raw =
    (Array.isArray(sp.status) ? sp.status[0] : sp.status)?.toUpperCase() ?? "";
  const filter = ["NEW", "IN_PROGRESS", "CLOSED"].includes(raw) ? raw : "";

  const all = await prisma.contactMessage.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      traveler: { select: { email: true, role: true } },
      departure: {
        include: { itinerary: { select: { title: true, slug: true } } },
      },
      replies: {
        orderBy: { createdAt: "asc" },
        include: { sentBy: { select: { name: true } } },
      },
    },
  });

  const countOf = (st: string) => all.filter((m) => m.status === st).length;
  const newCount = countOf("NEW");
  const messages = filter ? all.filter((m) => m.status === filter) : all;
  const tabs = [
    { value: "", label: "All", count: all.length },
    { value: "NEW", label: "New", count: newCount },
    {
      value: "IN_PROGRESS",
      label: "In progress",
      count: countOf("IN_PROGRESS"),
    },
    { value: "CLOSED", label: "Closed", count: countOf("CLOSED") },
  ];
  const stats = [
    { label: "All enquiries", value: all.length, status: "" },
    { label: "Unread", value: newCount, status: "NEW" },
    {
      label: "In progress",
      value: countOf("IN_PROGRESS"),
      status: "IN_PROGRESS",
    },
    { label: "Closed", value: countOf("CLOSED"), status: "CLOSED" },
  ];

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
          <h1
            data-hero
            className="font-display text-3xl font-semibold text-stone-900 sm:text-4xl"
          >
            Enquiries
          </h1>
          <p className="mt-1.5 max-w-md text-sm text-stone-700 sm:text-base">
            Messages from the public contact form.{" "}
            {newCount > 0 ? `${newCount} unread.` : "All caught up."}
          </p>
        </div>
      </section>

      <section
        className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
        aria-label="Summary"
      >
        {stats.map((c) => (
          <Link
            key={c.label}
            href={c.status ? `?status=${c.status}` : "?"}
            className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
          >
            <p className="text-sm font-medium text-stone-600">{c.label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-stone-900 sm:text-3xl">
              {c.value}
            </p>
            <p className="mt-0.5 text-xs text-stone-500">
              {c.status ? "show these" : "show all"}
            </p>
          </Link>
        ))}
      </section>

      <div className="flex flex-wrap gap-1.5">
        {tabs.map((t) => {
          const on = t.value === filter;
          return (
            <Link
              key={t.value || "all"}
              href={t.value ? `?status=${t.value}` : "?"}
              aria-current={on ? "true" : undefined}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
                on
                  ? "bg-brand-800 text-white"
                  : "border border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900"
              }`}
            >
              {t.label}
              <span
                className={
                  on ? "ml-1.5 text-white/70" : "ml-1.5 text-stone-400"
                }
              >
                {t.count}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="space-y-3">
        {messages.map((m) => (
          <div key={m.id} className="card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium">
                  {m.subject || "(no subject)"}{" "}
                  <span className={STATUS_BADGE[m.status] ?? "badge"}>
                    {m.status.replace("_", " ")}
                  </span>
                </p>
                <p className="text-sm text-stone-500">
                  {m.name} ·{" "}
                  <a
                    href={`mailto:${m.email}`}
                    className="text-brand-700 hover:underline"
                  >
                    {m.email}
                  </a>
                  {m.phone ? ` · ${m.phone}` : ""} ·{" "}
                  {m.createdAt.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <p className="mt-1 text-xs text-stone-400">
                  {m.traveler
                    ? `Signed in as ${m.traveler.email} (${m.traveler.role})`
                    : "Not signed in — no account"}
                </p>
              </div>
              <EnquiryStatusControls id={m.id} status={m.status} />
            </div>

            {m.departure && (
              <p className="mt-3 rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-900">
                <span className="font-semibold">Departure requested:</span>{" "}
                {m.departure.itinerary.title} ·{" "}
                {m.departure.startDate.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {" → "}
                {m.departure.endDate.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            )}

            <p className="mt-3 whitespace-pre-wrap border-t border-stone-100 pt-3 text-sm text-stone-700">
              {m.message}
            </p>

            <EnquiryReply
              id={m.id}
              email={m.email}
              firstName={m.name.trim().split(/\s+/)[0]}
              defaultSubject={`Re: ${m.subject || "Your enquiry to Droelma Tours & Travels"}`}
              past={m.replies.map((r) => ({
                id: r.id,
                subject: r.subject,
                body: r.body,
                status: r.status,
                error: r.error,
                by: r.sentBy?.name ?? null,
                at: r.createdAt.toISOString(),
              }))}
            />
          </div>
        ))}

        {messages.length === 0 && (
          <p className="rounded-2xl border border-stone-200 bg-white px-4 py-8 text-center text-sm text-stone-500">
            {filter ? "No enquiries with that status." : "No enquiries yet."}
          </p>
        )}
      </div>
    </div>
  );
}
