import { searchFlights } from "@/lib/flights/aggregator";
import { flightSearchSchema } from "@/lib/validation";
import FlightBookingButton from "@/components/booking/FlightBookingButton";
import ScrollReveal from "@/components/ScrollReveal";
import MotionListItem from "@/components/MotionListItem";
import type { FlightLeg, FlightOffer } from "@/lib/flights/aggregator";

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
  { value: "PREMIUM_ECONOMY", label: "Premium Economy" },
  { value: "BUSINESS", label: "Business" },
  { value: "FIRST", label: "First" },
];

export default async function FlightsSearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const parsed = flightSearchSchema.safeParse({
    origin: sp.origin,
    destination: sp.destination,
    departureDate: sp.departureDate,
    returnDate: sp.returnDate || undefined,
    passengers: sp.passengers ?? "1",
    cabinClass: sp.cabinClass ?? "ECONOMY",
  });

  const offers = parsed.success ? await searchFlights(parsed.data) : [];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Flights</h1>
      <p className="mb-6 text-sm text-stone-600">
        Bhutan-specific routes (Drukair, Bhutan Airlines) are shown first out
        of/into Paro. This search runs against a demo flight aggregator — see
        the README for what a production integration needs.
      </p>

      <form className="card mb-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-6" method="get">
        <input
          name="origin"
          placeholder="From (e.g. PBH)"
          maxLength={3}
          defaultValue={sp.origin ?? ""}
          required
          className="input uppercase"
        />
        <input
          name="destination"
          placeholder="To (e.g. BKK)"
          maxLength={3}
          defaultValue={sp.destination ?? ""}
          required
          className="input uppercase"
        />
        <input
          name="departureDate"
          type="date"
          defaultValue={sp.departureDate ?? ""}
          required
          className="input"
        />
        <input
          name="returnDate"
          type="date"
          defaultValue={sp.returnDate ?? ""}
          placeholder="Return (optional)"
          className="input"
        />
        <select name="cabinClass" defaultValue={sp.cabinClass ?? "ECONOMY"} className="input">
          {CABIN_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <input
            name="passengers"
            type="number"
            min={1}
            max={9}
            defaultValue={sp.passengers ?? "1"}
            className="input"
            aria-label="Passengers"
          />
          <button type="submit" className="btn-primary shrink-0">
            Search
          </button>
        </div>
      </form>

      {!parsed.success ? (
        <p className="text-stone-500">
          Enter an origin, destination, and departure date to search flights.
        </p>
      ) : offers.length === 0 ? (
        <p className="text-stone-500">No flights found for these dates.</p>
      ) : (
        <ScrollReveal className="space-y-3">
          {offers.map((offer) => (
            <FlightOfferCard key={offer.id} offer={offer} />
          ))}
        </ScrollReveal>
      )}
    </div>
  );
}

function FlightOfferCard({ offer }: { offer: FlightOffer }) {
  return (
    <MotionListItem className="listing-row sm:flex-row sm:items-center sm:justify-between p-4">
      <div className="flex-1 space-y-3">
        {offer.isBhutaneseCarrier && (
          <span className="badge bg-gold-100 text-gold-800">Bhutanese carrier</span>
        )}
        <LegRow leg={offer.outbound} />
        {offer.inbound && <LegRow leg={offer.inbound} />}
        <p className="text-xs text-stone-400">
          {offer.passengers} passenger{offer.passengers > 1 ? "s" : ""} ·{" "}
          {offer.cabinClass.replace("_", " ").toLowerCase()}
        </p>
      </div>
      <div className="mt-4 border-t border-stone-100 pt-3 text-right sm:mt-0 sm:ml-6 sm:border-0 sm:pt-0">
        <p className="font-display text-xl font-bold text-brand-800">
          Nu. {offer.totalPrice.toLocaleString()}
        </p>
        <p className="mb-2 text-xs text-stone-500">total</p>
        <FlightBookingButton offer={offer} />
      </div>
    </MotionListItem>
  );
}

function LegRow({ leg }: { leg: FlightLeg }) {
  return (
    <div className="flex items-center gap-4 text-sm">
      <div>
        <p className="font-medium">
          {leg.origin} → {leg.destination}
        </p>
        <p className="text-stone-500">
          {leg.airline} · {leg.flightNumber}
        </p>
      </div>
      <div className="text-stone-600">
        {formatTime(leg.departureAt)} → {formatTime(leg.arrivalAt)}
      </div>
      <div className="text-stone-400">{formatDuration(leg.durationMinutes)}</div>
    </div>
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}
