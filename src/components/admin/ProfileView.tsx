import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";

/** Read-only profile of a vendor listing, shown inside the admin dashboard. */
export default function ProfileView({
  title,
  kind,
  status,
  photo,
  editHref,
  rows,
  about,
  photos = [],
  adminNote,
}: {
  title: string;
  kind: string;
  status: string;
  photo?: string | null;
  editHref: string;
  rows: { label: string; value: string | null | undefined }[];
  about?: string | null;
  photos?: string[];
  adminNote?: string | null;
}) {
  return (
    <div className="space-y-5">
      <Link href="/chim/vendors" className="text-sm text-stone-600 hover:underline">
        ← All vendors
      </Link>
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start gap-4">
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" className="h-24 w-24 rounded-xl object-cover" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{kind}</p>
            <h1 data-hero className="font-display text-2xl font-semibold text-stone-900">{title}</h1>
            <div className="mt-2"><StatusBadge status={status} /></div>
          </div>
          <Link href={editHref} className="btn-primary">Edit</Link>
        </div>
        <dl className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {rows
            .filter((r) => r.value)
            .map((r) => (
              <div key={r.label}>
                <dt className="text-xs font-medium text-stone-500">{r.label}</dt>
                <dd className="text-sm text-stone-900">{r.value}</dd>
              </div>
            ))}
        </dl>
        {about && <p className="mt-5 whitespace-pre-line border-t border-stone-100 pt-4 text-sm text-stone-700">{about}</p>}
        {adminNote && <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">Admin note: {adminNote}</p>}
      </section>
      {photos.length > 0 && (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {photos.map((u) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={u} src={u} alt="" className="aspect-[4/3] w-full rounded-xl object-cover" />
          ))}
        </section>
      )}
    </div>
  );
}
