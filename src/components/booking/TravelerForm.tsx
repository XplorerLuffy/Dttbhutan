"use client";

import Link from "next/link";
import { useId } from "react";
import { COUNTRIES } from "@/lib/countries";
import type { Room } from "@/lib/guestRooms";
import { roomOfTraveler, type TravelerDraft } from "@/lib/travelerDetails";

type FieldProps = { id: string; "aria-invalid"?: boolean; "aria-describedby"?: string };

/**
 * A labelled field with its message. Kept at module level on purpose: a
 * component defined inside TravelerForm would be a new type on every render,
 * and React would rebuild each input on every keystroke, dropping the cursor.
 */
function Field({ id, label, message, hint, children }: { id: string; label: string; message?: string; hint?: string; children: (p: FieldProps) => React.ReactNode }) {
  const describedBy = message ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-semibold text-stone-800">
        {label}
      </label>
      {children({ id, "aria-invalid": message ? true : undefined, "aria-describedby": describedBy })}
      {message ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-700">
          {message}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-[11px] text-stone-600">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Step 2: who is travelling. One card per traveler (grouped by the room they
 * were put in on step 1), then how to reach the lead traveler, an optional
 * emergency contact, a free note and the terms.
 *
 * Messages come from the same rules the server applies (lib/travelerDetails);
 * they appear only after Continue has been pressed once, so nobody is told
 * they are wrong before they have finished typing.
 */
export default function TravelerForm({
  rooms,
  draft,
  onDraft,
  errors,
  showErrors,
  signedIn,
  loginNext,
}: {
  rooms: Room[];
  draft: TravelerDraft;
  onDraft: (d: TravelerDraft) => void;
  errors: Record<string, string>;
  showErrors: boolean;
  signedIn: boolean | null;
  loginNext: string;
}) {
  const uid = useId();
  const roomFor = roomOfTraveler(rooms);
  const err = (path: string) => (showErrors ? errors[path] : undefined);
  const maxDob = (() => {
    const d = new Date();
    d.setUTCFullYear(d.getUTCFullYear() - 18);
    return d.toISOString().slice(0, 10);
  })();

  const setTraveler = (i: number, patch: Partial<TravelerDraft["travelers"][number]>) =>
    onDraft({ ...draft, travelers: draft.travelers.map((t, j) => (j === i ? { ...t, ...patch } : t)) });

  const field = "input !py-2";
  const bad = (path: string) => (err(path) ? " !border-red-500" : "");

  return (
    <div className="mt-3 space-y-4">
      <p className="text-sm text-stone-800">
        Tell us who is travelling. Please enter names exactly as they appear on each traveler&apos;s passport.
      </p>

      {signedIn === false && (
        <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
          You&apos;ll need an account to book.{" "}
          <Link href={`/login?next=${loginNext}`} className="font-semibold underline">
            Log in
          </Link>{" "}
          or{" "}
          <Link href={`/register?next=${loginNext}`} className="font-semibold underline">
            create a free account
          </Link>
          . What you&apos;ve entered here is kept, and you&apos;ll come straight back.
        </p>
      )}

      {draft.travelers.map((t, i) => (
        <section key={i} aria-label={`Traveler ${i + 1}`} className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 bg-gold-50 px-4 py-2.5">
            <h3 className="text-sm font-bold text-brand-950">
              Traveler {i + 1}
              {i === 0 && <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-gold-800">Lead traveler</span>}
            </h3>
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-600">Room {roomFor[i]}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4">
            <Field id={`${uid}-t${i}-first`} label="First name" message={err(`travelers.${i}.firstName`)}>
              {(p) => <input {...p} autoComplete={i === 0 ? "given-name" : "off"} value={t.firstName} onChange={(e) => setTraveler(i, { firstName: e.target.value })} className={field + bad(`travelers.${i}.firstName`)} />}
            </Field>
            <Field id={`${uid}-t${i}-last`} label="Last name" message={err(`travelers.${i}.lastName`)}>
              {(p) => <input {...p} autoComplete={i === 0 ? "family-name" : "off"} value={t.lastName} onChange={(e) => setTraveler(i, { lastName: e.target.value })} className={field + bad(`travelers.${i}.lastName`)} />}
            </Field>
            <Field id={`${uid}-t${i}-dob`} label="Date of birth" message={err(`travelers.${i}.dateOfBirth`)}>
              {(p) => <input {...p} type="date" min="1900-01-01" max={maxDob} autoComplete={i === 0 ? "bday" : "off"} value={t.dateOfBirth} onChange={(e) => setTraveler(i, { dateOfBirth: e.target.value })} className={field + bad(`travelers.${i}.dateOfBirth`)} />}
            </Field>
            <Field id={`${uid}-t${i}-nat`} label="Nationality" message={err(`travelers.${i}.nationality`)}>
              {(p) => (
                <select {...p} value={t.nationality} onChange={(e) => setTraveler(i, { nationality: e.target.value })} className={field + bad(`travelers.${i}.nationality`)}>
                  <option value="">Select</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field id={`${uid}-t${i}-gender`} label="Gender (optional)" message={err(`travelers.${i}.gender`)}>
              {(p) => (
                <select {...p} value={t.gender} onChange={(e) => setTraveler(i, { gender: e.target.value })} className={field}>
                  <option value="">Prefer not to say</option>
                  <option value="F">Female</option>
                  <option value="M">Male</option>
                  <option value="X">Another</option>
                </select>
              )}
            </Field>
            <Field id={`${uid}-t${i}-diet`} label="Dietary needs (optional)" message={err(`travelers.${i}.dietary`)}>
              {(p) => <input {...p} value={t.dietary} maxLength={200} placeholder="e.g. vegetarian" onChange={(e) => setTraveler(i, { dietary: e.target.value })} className={field + bad(`travelers.${i}.dietary`)} />}
            </Field>
          </div>
        </section>
      ))}

      <section aria-label="Contact details" className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-bold text-brand-950">How can we reach you?</h3>
        <p className="mt-0.5 text-xs text-stone-600">For the lead traveler. We send the booking confirmation here.</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field id={`${uid}-email`} label="Email" message={err("contact.email")}>
            {(p) => <input {...p} type="email" autoComplete="email" value={draft.email} onChange={(e) => onDraft({ ...draft, email: e.target.value })} className={field + bad("contact.email")} />}
          </Field>
          <Field id={`${uid}-phone`} label="Phone / WhatsApp" message={err("contact.phone")} hint="With country code, e.g. +975 17 123 456">
            {(p) => <input {...p} type="tel" autoComplete="tel" value={draft.phone} onChange={(e) => onDraft({ ...draft, phone: e.target.value })} className={field + bad("contact.phone")} />}
          </Field>
        </div>
      </section>

      <section aria-label="Emergency contact" className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-bold text-brand-950">
          Emergency contact <span className="font-normal text-stone-600">(optional)</span>
        </h3>
        <p className="mt-0.5 text-xs text-stone-600">Someone at home we can call if needed. Not travelling with you.</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field id={`${uid}-em-name`} label="Name" message={err("emergency.name")}>
            {(p) => <input {...p} autoComplete="off" value={draft.emergencyName} onChange={(e) => onDraft({ ...draft, emergencyName: e.target.value })} className={field + bad("emergency.name")} />}
          </Field>
          <Field id={`${uid}-em-phone`} label="Phone" message={err("emergency.phone")}>
            {(p) => <input {...p} type="tel" autoComplete="off" value={draft.emergencyPhone} onChange={(e) => onDraft({ ...draft, emergencyPhone: e.target.value })} className={field + bad("emergency.phone")} />}
          </Field>
        </div>
      </section>

      <Field id={`${uid}-notes`} label="Anything else we should know? (optional)" message={err("requests")}>
        {(p) => <textarea {...p} rows={3} maxLength={1000} value={draft.requests} onChange={(e) => onDraft({ ...draft, requests: e.target.value })} className={field + bad("requests")} placeholder="Allergies, mobility, celebrations, preferred hotels…" />}
      </Field>

      <div>
        <label className="flex items-start gap-3 text-sm text-stone-800">
          <input
            type="checkbox"
            checked={draft.acceptedTerms}
            aria-invalid={err("acceptedTerms") ? true : undefined}
            aria-describedby={err("acceptedTerms") ? `${uid}-terms-error` : undefined}
            onChange={(e) => onDraft({ ...draft, acceptedTerms: e.target.checked })}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-stone-400 text-brand-800"
          />
          <span>
            I confirm the names match each traveler&apos;s passport, and I accept the{" "}
            <Link href="/terms" target="_blank" className="font-semibold text-brand-800 underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/cancellation" target="_blank" className="font-semibold text-brand-800 underline">
              Cancellation policy
            </Link>
            .
          </span>
        </label>
        {err("acceptedTerms") && (
          <p id={`${uid}-terms-error`} className="mt-1 text-xs text-red-700">
            {err("acceptedTerms")}
          </p>
        )}
      </div>
    </div>
  );
}
