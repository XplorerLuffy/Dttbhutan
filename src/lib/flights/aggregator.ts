import "server-only";

/**
 * MOCK flight aggregator client — there is no real airline inventory
 * behind this. Bhutan has no domestic reservation system of its own to
 * sell directly against, so a real integration needs a commercial
 * agreement with an aggregator that already holds airline inventory and
 * can issue real PNRs — Amadeus, Duffel, or a GDS reseller are the usual
 * options (Duffel has the more modern/lightweight REST API and self-serve
 * onboarding; Amadeus has broader global carrier coverage including more
 * South/Southeast Asian carriers, which matters for connecting itineraries
 * out of Paro). That agreement almost always comes with transaction fees
 * per ticket — flag this to the client before committing to one.
 *
 * This module exists so the rest of the app (search UI, booking flow,
 * traveler/admin dashboards) can be built and demoed against a stable
 * interface now, then swapped for a real provider later without touching
 * any calling code — `searchFlights` / `bookFlight` are the two calls a
 * real client needs to implement.
 *
 * Bhutan's two carriers (Drukair / Royal Bhutan Airlines, and Bhutan
 * Airlines) are pinned first in search results out of/into Paro (PBH),
 * matching the brief's suggestion to prioritize them — flip
 * `PIN_BHUTAN_CARRIERS` off for a general international-search feel if
 * the client prefers that instead.
 */

const PIN_BHUTAN_CARRIERS = true;

export type CabinClass = "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";

export type FlightSearchParams = {
  origin: string; // IATA code
  destination: string; // IATA code
  departureDate: string; // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD, omitted for one-way
  passengers: number;
  cabinClass: CabinClass;
};

export type FlightLeg = {
  airline: string;
  airlineCode: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureAt: string; // ISO
  arrivalAt: string; // ISO
  durationMinutes: number;
};

export type FlightOffer = {
  id: string;
  provider: "mock";
  outbound: FlightLeg;
  inbound: FlightLeg | null;
  cabinClass: CabinClass;
  passengers: number;
  pricePerPassenger: number;
  totalPrice: number;
  currency: "BTN";
  isBhutaneseCarrier: boolean;
};

const BHUTAN_AIRPORT_CODES = new Set(["PBH", "BUT"]); // Paro; Bumthang domestic

const CARRIERS: { name: string; code: string; isBhutanese: boolean; speedFactor: number; priceFactor: number }[] = [
  { name: "Drukair (Royal Bhutan Airlines)", code: "KB", isBhutanese: true, speedFactor: 1, priceFactor: 1.1 },
  { name: "Bhutan Airlines", code: "B3", isBhutanese: true, speedFactor: 1.02, priceFactor: 1.05 },
  { name: "Druk Connect Partner Air", code: "DX", isBhutanese: false, speedFactor: 1.15, priceFactor: 0.85 },
];

// Deterministic pseudo-random so the same search repeats the same results
// (nicer for demoing/screenshotting than fully random noise each call).
function seedFrom(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CABIN_MULTIPLIER: Record<CabinClass, number> = {
  ECONOMY: 1,
  PREMIUM_ECONOMY: 1.5,
  BUSINESS: 2.6,
  FIRST: 4,
};

function buildLeg(
  rand: () => number,
  carrier: (typeof CARRIERS)[number],
  origin: string,
  destination: string,
  date: string
) {
  const durationMinutes = Math.round((60 + rand() * 240) * carrier.speedFactor);
  const departureHour = 6 + Math.floor(rand() * 14);
  const departureMinute = Math.floor(rand() * 12) * 5;
  const departureAt = new Date(`${date}T00:00:00Z`);
  departureAt.setUTCHours(departureHour, departureMinute, 0, 0);
  const arrivalAt = new Date(departureAt.getTime() + durationMinutes * 60 * 1000);

  return {
    airline: carrier.name,
    airlineCode: carrier.code,
    flightNumber: `${carrier.code}${100 + Math.floor(rand() * 800)}`,
    origin,
    destination,
    departureAt: departureAt.toISOString(),
    arrivalAt: arrivalAt.toISOString(),
    durationMinutes,
  } satisfies FlightLeg;
}

export async function searchFlights(params: FlightSearchParams): Promise<FlightOffer[]> {
  const origin = params.origin.toUpperCase();
  const destination = params.destination.toUpperCase();
  const involvesBhutan = BHUTAN_AIRPORT_CODES.has(origin) || BHUTAN_AIRPORT_CODES.has(destination);

  const rand = mulberry32(
    seedFrom(`${origin}-${destination}-${params.departureDate}-${params.returnDate ?? ""}-${params.cabinClass}`)
  );

  const carriers = involvesBhutan && PIN_BHUTAN_CARRIERS ? CARRIERS : CARRIERS.slice(2);

  const offers = carriers.map((carrier, i) => {
    const outbound = buildLeg(rand, carrier, origin, destination, params.departureDate);
    const inbound = params.returnDate
      ? buildLeg(rand, carrier, destination, origin, params.returnDate)
      : null;

    const basePrice = 8000 + rand() * 6000; // BTN, one-way per pax baseline
    const legMultiplier = inbound ? 1.85 : 1;
    const pricePerPassenger = Math.round(
      basePrice * legMultiplier * carrier.priceFactor * CABIN_MULTIPLIER[params.cabinClass]
    );

    return {
      id: `mock-${origin}-${destination}-${params.departureDate}-${carrier.code}-${i}`,
      provider: "mock" as const,
      outbound,
      inbound,
      cabinClass: params.cabinClass,
      passengers: params.passengers,
      pricePerPassenger,
      totalPrice: pricePerPassenger * params.passengers,
      currency: "BTN" as const,
      isBhutaneseCarrier: carrier.isBhutanese,
    };
  });

  // Bhutanese carriers first, then cheapest.
  return offers.sort((a, b) => {
    if (a.isBhutaneseCarrier !== b.isBhutaneseCarrier) return a.isBhutaneseCarrier ? -1 : 1;
    return a.totalPrice - b.totalPrice;
  });
}

export type BookFlightResult = {
  pnr: string;
  aggregatorOfferId: string;
};

/**
 * Simulates ticketing: a real aggregator call here would return a genuine
 * PNR from the airline's reservation system. This just fabricates one in
 * the right shape (6 alphanumeric characters, the near-universal PNR
 * format) so the booking flow and confirmation UI can be built and tested
 * end to end.
 */
export async function bookFlight(offer: FlightOffer): Promise<BookFlightResult> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let pnr = "";
  for (let i = 0; i < 6; i++) pnr += chars[Math.floor(Math.random() * chars.length)];
  return { pnr, aggregatorOfferId: offer.id };
}
