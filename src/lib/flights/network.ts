/**
 * The routes Bhutan's two airlines fly, from their published networks.
 *
 * Only Drukair (KB, Royal Bhutan Airlines) and Bhutan Airlines (B3) fly to
 * Bhutan, and every international flight lands at Paro (PBH). This is what
 * the flights page offers, so a visitor can only pick a journey that exists.
 *
 * Frequencies are typical and change by season, so they are shown as
 * guidance ("usually daily") — the team confirms the actual flight, time and
 * fare when it quotes. Review this file when an airline adds or drops a route
 * (Drukair announced Guwahati–Bangkok and more Singapore flights for 2026;
 * Dubai is paused).
 */

export type Airline = { code: "KB" | "B3"; name: string };

export const DRUKAIR: Airline = { code: "KB", name: "Drukair – Royal Bhutan Airlines" };
export const BHUTAN_AIRLINES: Airline = { code: "B3", name: "Bhutan Airlines" };

export type Airport = { code: string; city: string; name: string; country: string };

export const AIRPORTS: Record<string, Airport> = {
  PBH: { code: "PBH", city: "Paro", name: "Paro International Airport", country: "Bhutan" },
  BUT: { code: "BUT", city: "Bumthang (Jakar)", name: "Bathpalathang Airport", country: "Bhutan" },
  GLU: { code: "GLU", city: "Gelephu", name: "Gelephu Airport", country: "Bhutan" },
  YON: { code: "YON", city: "Trashigang (Yonphula)", name: "Yonphula Airport", country: "Bhutan" },
  DEL: { code: "DEL", city: "Delhi", name: "Indira Gandhi International", country: "India" },
  CCU: { code: "CCU", city: "Kolkata", name: "Netaji Subhas Chandra Bose International", country: "India" },
  IXB: { code: "IXB", city: "Bagdogra (Siliguri)", name: "Bagdogra Airport", country: "India" },
  GAU: { code: "GAU", city: "Guwahati", name: "Lokpriya Gopinath Bordoloi International", country: "India" },
  GAY: { code: "GAY", city: "Bodh Gaya (Gaya)", name: "Gaya Airport", country: "India" },
  KTM: { code: "KTM", city: "Kathmandu", name: "Tribhuvan International", country: "Nepal" },
  DAC: { code: "DAC", city: "Dhaka", name: "Hazrat Shahjalal International", country: "Bangladesh" },
  BKK: { code: "BKK", city: "Bangkok", name: "Suvarnabhumi Airport", country: "Thailand" },
  SIN: { code: "SIN", city: "Singapore", name: "Changi Airport", country: "Singapore" },
};

export type Route = {
  /** The non-Bhutan end, or the other Bhutan airport for a domestic route. */
  from: string;
  to: string;
  airlines: Airline[];
  note: string;
};

const BOTH = [DRUKAIR, BHUTAN_AIRLINES];

/** Each route is listed once, in the direction away from Paro; it is flown both ways. */
export const ROUTES: Route[] = [
  { from: "PBH", to: "DEL", airlines: BOTH, note: "Usually daily" },
  { from: "PBH", to: "KTM", airlines: BOTH, note: "Usually daily" },
  { from: "PBH", to: "BKK", airlines: BOTH, note: "Usually daily" },
  { from: "PBH", to: "CCU", airlines: BOTH, note: "Several flights a week" },
  { from: "PBH", to: "DAC", airlines: [DRUKAIR], note: "Twice a week" },
  { from: "PBH", to: "IXB", airlines: [DRUKAIR], note: "Twice a week" },
  { from: "PBH", to: "GAU", airlines: [DRUKAIR], note: "Twice a week" },
  { from: "PBH", to: "SIN", airlines: [DRUKAIR], note: "Three times a week" },
  { from: "PBH", to: "GAY", airlines: [DRUKAIR], note: "Seasonal, roughly December to February" },
  { from: "PBH", to: "BUT", airlines: [DRUKAIR], note: "Domestic — schedule varies by season" },
  { from: "PBH", to: "GLU", airlines: [DRUKAIR], note: "Domestic — schedule varies by season" },
  { from: "PBH", to: "YON", airlines: [DRUKAIR], note: "Domestic — schedule varies by season" },
];

/** The route between two airports in either direction, or null if neither airline flies it. */
export function findRoute(a: string, b: string): Route | null {
  return (
    ROUTES.find((r) => (r.from === a && r.to === b) || (r.from === b && r.to === a)) ?? null
  );
}

/** Airports reachable from `code`, for filling the second dropdown. */
export function destinationsFrom(code: string): string[] {
  return ROUTES.filter((r) => r.from === code || r.to === code).map((r) =>
    r.from === code ? r.to : r.from
  );
}

export const airportLabel = (code: string) => {
  const a = AIRPORTS[code];
  return a ? `${a.city} (${a.code})` : code;
};
