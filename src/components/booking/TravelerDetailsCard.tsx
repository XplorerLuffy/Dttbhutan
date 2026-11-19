import { PAYMENT_LABEL } from "@/lib/payment";
import { roomOfTraveler, travelerDetailsSchema } from "@/lib/travelerDetails";

const GENDER: Record<string, string> = { F: "Female", M: "Male", X: "Another" };

/**
 * What the traveler entered when booking a departure, on the booking page the
 * traveler and the agency both open. Checked against the same rules before it
 * is shown; a booking without details (older ones) shows nothing.
 */
export default function TravelerDetailsCard({ details }: { details: unknown }) {
  const parsed = travelerDetailsSchema.safeParse(details);
  if (!parsed.success) return null;
  const d = parsed.data;
  const roomFor = roomOfTraveler(d.rooms);

  return (
    <div className="mt-4 border-t border-stone-100 pt-4">
      <h4 className="text-sm font-semibold text-stone-900">Travelers</h4>
      <ul className="mt-2 space-y-2">
        {d.travelers.map((t, i) => (
          <li key={i} className="rounded-lg bg-stone-50 px-3 py-2 text-sm">
            <p className="font-medium text-stone-900">
              {t.firstName} {t.lastName}
              {i === 0 && <span className="ml-2 text-xs font-normal text-stone-500">Lead traveler</span>}
              <span className="ml-2 text-xs font-normal text-stone-500">Room {roomFor[i]}</span>
            </p>
            <p className="text-xs text-stone-600">
              Born {t.dateOfBirth} · {t.nationality}
              {t.gender ? ` · ${GENDER[t.gender]}` : ""}
              {t.dietary ? ` · ${t.dietary}` : ""}
            </p>
          </li>
        ))}
      </ul>
      <dl className="mt-3 space-y-1 text-sm">
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-stone-500">Email</dt>
          <dd className="break-all text-stone-900">{d.contact.email}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-stone-500">Phone</dt>
          <dd className="text-stone-900">{d.contact.phone}</dd>
        </div>
        {d.emergency && (d.emergency.name || d.emergency.phone) && (
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-stone-500">Emergency</dt>
            <dd className="text-stone-900">
              {d.emergency.name} · {d.emergency.phone}
            </dd>
          </div>
        )}
        {d.paymentMethod && (
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-stone-500">Will pay by</dt>
            <dd className="text-stone-900">{PAYMENT_LABEL[d.paymentMethod]}</dd>
          </div>
        )}
        {d.requests && (
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-stone-500">Note</dt>
            <dd className="whitespace-pre-line text-stone-900">{d.requests}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
