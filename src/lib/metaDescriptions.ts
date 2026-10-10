/**
 * Search-result descriptions for vendor listings.
 *
 * An admin can write one per listing (the "Google description" box). When none
 * is written, one is built from the listing's own details, so every hotel and
 * guide has a proper description — a sentence that ends where it should —
 * instead of the first 160 characters of whatever was typed at registration.
 */
const MAX = 160;

function fit(text: string): string {
  if (text.length <= MAX) return text;
  const cut = text.slice(0, MAX - 1);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

export function hotelMeta(h: {
  name: string;
  metaDescription: string | null;
  destination: string;
  amenities: string[];
}): string {
  if (h.metaDescription?.trim()) return fit(h.metaDescription.trim());
  const amenities = h.amenities.slice(0, 3).map((a) => a.toLowerCase());
  const extras = amenities.length ? ` with ${amenities.join(", ")}` : "";
  return fit(`Stay at ${h.name} in ${h.destination}, Bhutan${extras}. See rooms and prices and book with Droelma Tours & Travels.`);
}

export function guideMeta(g: {
  name: string;
  metaDescription: string | null;
  yearsExperience: number;
  specialties: string[];
  languages: string[];
}): string {
  if (g.metaDescription?.trim()) return fit(g.metaDescription.trim());
  const years = g.yearsExperience > 0 ? ` with ${g.yearsExperience} years' experience` : "";
  const focus = g.specialties.length ? ` in ${g.specialties.slice(0, 3).join(", ").toLowerCase()} tours` : "";
  const speaks = g.languages.length ? ` Speaks ${g.languages.slice(0, 4).join(", ")}.` : "";
  return fit(`${g.name} is a licensed Bhutanese tour guide${years}${focus}.${speaks} Book through Droelma Tours & Travels.`);
}

export function vehicleMeta(v: {
  metaDescription: string | null;
  typeName: string;
  capacity: number;
  operator: string;
}): string {
  if (v.metaDescription?.trim()) return fit(v.metaDescription.trim());
  return fit(
    `Hire a ${v.typeName.toLowerCase()} with a licensed driver for your Bhutan trip: seats ${v.capacity}, operated by ${v.operator}. Book with Droelma Tours & Travels.`
  );
}
