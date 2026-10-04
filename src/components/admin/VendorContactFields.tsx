"use client";

import { useState } from "react";
import { Field } from "@/components/admin/vendorFormFields";

export type VendorContact = { name: string; email: string; phone: string };

export function useVendorContact() {
  const [value, setValue] = useState<VendorContact>({ name: "", email: "", phone: "" });
  return {
    value,
    set: (field: keyof VendorContact, next: string) => setValue((v) => ({ ...v, [field]: next })),
  };
}

/**
 * Who a listing belongs to, when an admin adds it rather than the vendor
 * signing up. Only the name is required: a blank email makes it a listing the
 * agency manages, with nobody emailed about it and no login (see
 * vendorAccountFor on the server).
 */
export default function VendorContactFields({
  kind,
  contact,
}: {
  kind: "guide" | "hotel";
  contact: ReturnType<typeof useVendorContact>;
}) {
  return (
    <fieldset className="space-y-3 rounded-lg border border-stone-200 p-4">
      <legend className="px-1 text-sm font-semibold text-stone-900">
        {kind === "guide" ? "The guide" : "Hotel owner or contact"}
      </legend>

      <Field label={kind === "guide" ? "Guide's full name" : "Contact name"}>
        <input
          value={contact.value.name}
          onChange={(e) => contact.set("name", e.target.value)}
          required
          className="input"
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Email (optional)"
          help="Used for listing updates. Leave blank if they don't use email."
        >
          <input
            type="email"
            value={contact.value.email}
            onChange={(e) => contact.set("email", e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Phone / WhatsApp (optional)">
          <input
            type="tel"
            value={contact.value.phone}
            onChange={(e) => contact.set("phone", e.target.value)}
            className="input"
          />
        </Field>
      </div>

      <p className="text-xs text-stone-500">
        Listings you add here go live straight away. They&apos;re managed by you from this
        admin panel — the {kind === "guide" ? "guide" : "owner"} doesn&apos;t get a login.
      </p>
    </fieldset>
  );
}
