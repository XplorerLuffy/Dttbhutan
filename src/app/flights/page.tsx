import { pageMetadata } from "@/lib/pageMeta";
import { AIRPORTS, ROUTES as ROUTE_ROWS, airportLabel, destinationsFrom, findRoute } from "@/lib/flights/network";
import FlightRequestForm from "@/components/booking/FlightRequestForm";
import { getSiteContent } from "@/lib/content";
import { flightSearchSchema } from "@/lib/validation";

import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("flights", "/flights");
}

export const dynamic = "force-dynamic";

type SearchParams = {
  origin?: string;
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  passengers?: string;
  cabinClass?: string;
};

const CABIN_OPTIONS = [
  { value: "ECONOMY", label: "Economy" },
  { value: "BUSINESS", label: "Business" },
];

export default async function FlightsSearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const parsed = flightSearchSchema.safeParse({
    origin: sp.origin?.toUpperCase(),
    destination: sp.destination?.toUpperCase(),
    departureDate: sp.departureDate,
    returnDate: sp.returnDate || undefined,
    passengers: sp.passengers ?? "1",
    cabinClass: sp.cabinClass === "BUSINESS" ? "BUSINESS" : "ECONOMY",
  });
  const search = parsed.success ? parsed.data : null;
  const route = search ? findRoute(search.origin, search.destination) : null;

  const content = await getSiteContent();
  const airports = Object.values(AIRPORTS);
  const cabin = sp.cabinClass === "BUSINESS" ? "BUSINESS" : "ECONOMY";

  const summary = search
    ? [
        `Flight fare request`,
        `Route: ${airportLabel(search.origin)} to ${airportLabel(search.destination)}${search.returnDate ? " (return)" : " (one way)"}`,
        `Departing: ${search.departureDate}${search.returnDate ? `, returning ${search.returnDate}` : ""}`,
        `Passengers: ${search.passengers}`,
        `Cabin: ${search.cabinClass === "BUSINESS" ? "Business" : "Economy"}`,
      ].join("\n")
    : "";

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">{content("flights.heading")}</h1>
      {content("flights.intro") && (
        <p className="mb-6 text-sm text-stone-600">{content("flights.intro")}</p>
      )}

      <form className="card mb-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-6" method="get">
        <AirportSelect name="origin" label="From" value={sp.origin} airports={airports} />
        <AirportSelect name="destination" label="To" value={sp.destination} airports={airports} />
        <input name="departureDate" type="date" defaultValue={sp.departureDate ?? ""} required className="input" aria-label="Departure date" />
        <input name="returnDate" type="date" defaultValue={sp.returnDate ?? ""} className="input" aria-label="Return date (optional)" />
        <select name="cabinClass" defaultValue={cabin} className="input" aria-label="Cabin">
          {CABIN_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <input name="passengers" type="number" min={1} max={9} defaultValue={sp.passengers ?? "1"} className="input" aria-label="Passengers" />
          <button type="submit" className="btn-primary shrink-0">
            Search
          </button>
        </div>
      </form>

      {!search ? (
        <RouteList />
      ) : !route ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Drukair and Bhutan Airlines don&apos;t fly {airportLabel(search.origin)} to {airportLabel(search.destination)} directly.</p>
          {destinationsFrom(search.origin).length > 0 ? (
            <p className="mt-1">
              From {airportLabel(search.origin)} you can fly to:{" "}
              {destinationsFrom(search.origin).map(airportLabel).join(", ")}.
            </p>
          ) : (
            <p className="mt-1">Every flight to Bhutan lands at Paro (PBH). Choose Paro as one end of your journey, or ask us to arrange a connection.</p>
          )}
        </div>
      ) : (
        <div className="card space-y-4 p-5">
          <div>
            <p className="font-display text-xl font-bold text-brand-900">
              {airportLabel(search.origin)} → {airportLabel(search.destination)}
            </p>
            <p className="text-sm text-stone-600">
              {search.departureDate}
              {search.returnDate ? ` – ${search.returnDate}` : " · one way"} · {search.passengers} passenger
              {search.passengers > 1 ? "s" : ""} · {search.cabinClass === "BUSINESS" ? "Business" : "Economy"}
            </p>
          </div>
          <ul className="space-y-2">
            {route.airlines.map((a) => (
              <li key={a.code} className="flex flex-wrap items-center gap-2 rounded-lg bg-stone-50 px-3 py-2 text-sm">
                <span className="badge bg-gold-100 text-gold-800">{a.code}</span>
                <span className="font-medium text-stone-900">{a.name}</span>
                <span className="text-stone-500">· {route.note}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-stone-600">
            Send us your request and we&apos;ll reply with the available flights, times and the fare for your
            dates. Seats are confirmed by our team before you pay anything.
          </p>
          <FlightRequestForm summary={summary} />
        </div>
      )}
    </div>
  );
}

function AirportSelect({
  name,
  label,
  value,
  airports,
}: {
  name: string;
  label: string;
  value?: string;
  airports: { code: string; city: string; country: string }[];
}) {
  return (
    <select name={name} defaultValue={value?.toUpperCase() ?? ""} required className="input" aria-label={label}>
      <option value="" disabled>
        {label}
      </option>
      {["Bhutan", "India", "Nepal", "Bangladesh", "Thailand", "Singapore"].map((country) => (
        <optgroup key={country} label={country}>
          {airports
            .filter((a) => a.country === country)
            .map((a) => (
              <option key={a.code} value={a.code}>
                {a.city} ({a.code})
              </option>
            ))}
        </optgroup>
      ))}
    </select>
  );
}

function RouteList() {
  return (
    <div className="card p-5">
      <h2 className="mb-3 font-display text-lg font-bold text-brand-900">Flights to and from Paro</h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {ROUTE_ROWS.map((r) => (
          <li key={r.to} className="rounded-lg bg-stone-50 px-3 py-2 text-sm">
            <p className="font-medium text-stone-900">Paro ⇄ {airportLabel(r.to)}</p>
            <p className="text-xs text-stone-500">
              {r.airlines.map((a) => a.name).join(" · ")} · {r.note}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
