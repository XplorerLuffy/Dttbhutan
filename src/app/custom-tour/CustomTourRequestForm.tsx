"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { DzongkhagRegion, VehicleType } from "@prisma/client";
import Money from "@/components/Money";
import { REGION_LABEL, REGION_ORDER } from "@/lib/regions";

type Destination = { id: string; name: string; region: DzongkhagRegion };
type Guide = {
  id: string;
  name: string;
  ratePerDay: number;
  languages: string[];
  specialties: string[];
  destinationIds: string[];
};
type RoomType = { id: string; name: string; capacity: number; pricePerNight: number };
type Hotel = { id: string; name: string; destinationId: string; roomTypes: RoomType[] };
type Vehicle = {
  id: string;
  type: VehicleType;
  capacity: number;
  ratePerDay: number;
  operatorName: string;
};

function nightsOrDays(start: string, end: string) {
  if (!start || !end) return 0;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms <= 0) return 0;
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export default function CustomTourRequestForm({
  destinations,
  preselectedDestinationId,
  guides,
  hotels,
  vehicles,
}: {
  destinations: Destination[];
  preselectedDestinationId?: string;
  guides: Guide[];
  hotels: Hotel[];
  vehicles: Vehicle[];
}) {
  const router = useRouter();
  const [selectedDestinations, setSelectedDestinations] = useState<Set<string>>(
    new Set(preselectedDestinationId ? [preselectedDestinationId] : [])
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [travelers, setTravelers] = useState(2);
  const [budgetPerPerson, setBudgetPerPerson] = useState("");
  const [notes, setNotes] = useState("");

  const [guideId, setGuideId] = useState<string>("");
  const [roomTypeId, setRoomTypeId] = useState<string>("");
  const [vehicleId, setVehicleId] = useState<string>("");

  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function toggleDestination(id: string) {
    setSelectedDestinations((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const nights = nightsOrDays(startDate, endDate);

  const relevantGuides = useMemo(() => {
    if (selectedDestinations.size === 0) return guides;
    const matching = guides.filter((g) => g.destinationIds.some((d) => selectedDestinations.has(d)));
    return matching.length > 0 ? matching : guides;
  }, [guides, selectedDestinations]);

  const relevantHotels = useMemo(() => {
    if (selectedDestinations.size === 0) return hotels;
    const matching = hotels.filter((h) => selectedDestinations.has(h.destinationId));
    return matching.length > 0 ? matching : hotels;
  }, [hotels, selectedDestinations]);

  const roomTypeOptions = useMemo(
    () =>
      relevantHotels.flatMap((h) =>
        h.roomTypes.map((rt) => ({ ...rt, hotelName: h.name, hotelId: h.id }))
      ),
    [relevantHotels]
  );

  const suitableVehicles = useMemo(
    () => vehicles.filter((v) => v.capacity >= travelers),
    [vehicles, travelers]
  );

  const selectedGuide = guides.find((g) => g.id === guideId);
  const selectedRoomType = roomTypeOptions.find((rt) => rt.id === roomTypeId);
  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);

  const pricing = useMemo(() => {
    const guideCost = selectedGuide && nights > 0 ? selectedGuide.ratePerDay * nights : 0;
    const roomsNeeded = selectedRoomType ? Math.max(1, Math.ceil(travelers / selectedRoomType.capacity)) : 0;
    const hotelCost = selectedRoomType && nights > 0 ? selectedRoomType.pricePerNight * nights * roomsNeeded : 0;
    const vehicleCost = selectedVehicle && nights > 0 ? selectedVehicle.ratePerDay * nights : 0;
    const totalPrice = guideCost + hotelCost + vehicleCost;
    return {
      roomsNeeded,
      guideCost,
      hotelCost,
      vehicleCost,
      totalPrice,
      pricePerPerson: travelers > 0 ? totalPrice / travelers : 0,
    };
  }, [selectedGuide, selectedRoomType, selectedVehicle, nights, travelers]);

  const hasAnySelection = Boolean(guideId || roomTypeId || vehicleId);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setNeedsLogin(false);

    if (selectedDestinations.size === 0) {
      setError("Select at least one destination you'd like to visit.");
      return;
    }
    if (!startDate || !endDate) {
      setError("Choose your start and end dates.");
      return;
    }
    setIsSubmitting(true);

    const res = await fetch("/api/custom-tour-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate,
        endDate,
        travelers,
        budgetPerPerson: budgetPerPerson || undefined,
        notes: notes || undefined,
        destinationIds: Array.from(selectedDestinations),
        guideId: guideId || undefined,
        roomTypeId: roomTypeId || undefined,
        vehicleId: vehicleId || undefined,
      }),
    });

    setIsSubmitting(false);

    if (res.status === 401) {
      setNeedsLogin(true);
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error?.formErrors?.[0] ?? data.error ?? "Could not send your request");
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="card">
        <h3 className="font-semibold text-pine-800">Request sent</h3>
        <p className="mt-2 text-sm text-stone-600">
          {hasAnySelection
            ? "Our team will confirm availability for your picks and follow up to finalize the quote."
            : "Our team will review your preferences and follow up with a quote."}{" "}
          You can see the status of your request from your dashboard.
        </p>
        <button type="button" onClick={() => router.push("/dashboard")} className="btn-primary mt-4">
          Go to my dashboard
        </button>
      </div>
    );
  }

  const byRegion = new Map<DzongkhagRegion, Destination[]>();
  for (const d of destinations) byRegion.set(d.region, [...(byRegion.get(d.region) ?? []), d]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-6 lg:space-y-0">
      <div className="space-y-6">
        <div>
          <h2 className="mb-3 text-sm font-semibold">Which destinations interest you?</h2>
          {REGION_ORDER.map((region) => {
            const items = byRegion.get(region) ?? [];
            if (items.length === 0) return null;
            return (
              <div key={region} className="mb-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">
                  {REGION_LABEL[region]}
                </p>
                <div className="flex flex-wrap gap-2">
                  {items.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDestination(d.id)}
                      className={
                        selectedDestinations.has(d.id)
                          ? "rounded-full bg-brand-700 px-3 py-1 text-sm text-white"
                          : "rounded-full border border-stone-300 px-3 py-1 text-sm text-stone-600 hover:border-brand-400"
                      }
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="card grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Start date</label>
            <input
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              type="date"
              required
              className="input"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">End date</label>
            <input
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              type="date"
              required
              className="input"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Travelers</label>
            <input
              value={travelers}
              onChange={(e) => setTravelers(Math.max(1, Number(e.target.value) || 1))}
              type="number"
              min={1}
              max={30}
              required
              className="input"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Budget per person (BTN, optional)</label>
            <input
              value={budgetPerPerson}
              onChange={(e) => setBudgetPerPerson(e.target.value)}
              type="number"
              min={1}
              step="0.01"
              className="input"
            />
          </div>
        </div>

        <div>
          <h2 className="mb-1 text-sm font-semibold">Choose your guide</h2>
          <p className="mb-3 text-xs text-stone-500">Optional — leave unselected if you have no preference.</p>
          <div className="space-y-2">
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                guideId === "" ? "border-brand-400 bg-brand-50" : "border-stone-200"
              }`}
            >
              <input type="radio" name="guide" checked={guideId === ""} onChange={() => setGuideId("")} />
              <span className="text-sm text-stone-600">No preference — the agency will assign a guide</span>
            </label>
            {relevantGuides.length === 0 && (
              <p className="text-sm text-stone-500">No approved guides yet.</p>
            )}
            {relevantGuides.map((g) => (
              <label
                key={g.id}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 ${
                  guideId === g.id ? "border-brand-400 bg-brand-50" : "border-stone-200"
                }`}
              >
                <span className="flex items-center gap-3">
                  <input type="radio" name="guide" checked={guideId === g.id} onChange={() => setGuideId(g.id)} />
                  <span>
                    <span className="block text-sm font-medium text-stone-900">{g.name}</span>
                    <span className="block text-xs text-stone-500">
                      {g.languages.join(", ")}
                      {g.specialties.length > 0 ? ` · ${g.specialties.join(", ")}` : ""}
                    </span>
                  </span>
                </span>
                <span className="shrink-0 text-sm font-medium text-stone-700">
                  <Money btn={g.ratePerDay} />/day
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-1 text-sm font-semibold">Choose your hotel or homestay</h2>
          <p className="mb-3 text-xs text-stone-500">Optional — leave unselected if you have no preference.</p>
          <div className="space-y-2">
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                roomTypeId === "" ? "border-brand-400 bg-brand-50" : "border-stone-200"
              }`}
            >
              <input type="radio" name="roomType" checked={roomTypeId === ""} onChange={() => setRoomTypeId("")} />
              <span className="text-sm text-stone-600">No preference — the agency will assign accommodation</span>
            </label>
            {roomTypeOptions.length === 0 && (
              <p className="text-sm text-stone-500">No approved hotels yet.</p>
            )}
            {roomTypeOptions.map((rt) => (
              <label
                key={rt.id}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 ${
                  roomTypeId === rt.id ? "border-brand-400 bg-brand-50" : "border-stone-200"
                }`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="roomType"
                    checked={roomTypeId === rt.id}
                    onChange={() => setRoomTypeId(rt.id)}
                  />
                  <span>
                    <span className="block text-sm font-medium text-stone-900">
                      {rt.hotelName} · {rt.name}
                    </span>
                    <span className="block text-xs text-stone-500">Sleeps {rt.capacity}</span>
                  </span>
                </span>
                <span className="shrink-0 text-sm font-medium text-stone-700">
                  <Money btn={rt.pricePerNight} />/night
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-1 text-sm font-semibold">Choose your vehicle</h2>
          <p className="mb-3 text-xs text-stone-500">
            Optional — only vehicles with enough seats for {travelers} traveler{travelers > 1 ? "s" : ""} are shown.
          </p>
          <div className="space-y-2">
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                vehicleId === "" ? "border-brand-400 bg-brand-50" : "border-stone-200"
              }`}
            >
              <input type="radio" name="vehicle" checked={vehicleId === ""} onChange={() => setVehicleId("")} />
              <span className="text-sm text-stone-600">No preference — the agency will assign a vehicle</span>
            </label>
            {suitableVehicles.length === 0 && (
              <p className="text-sm text-stone-500">No approved vehicles fit this group size yet.</p>
            )}
            {suitableVehicles.map((v) => (
              <label
                key={v.id}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 ${
                  vehicleId === v.id ? "border-brand-400 bg-brand-50" : "border-stone-200"
                }`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="vehicle"
                    checked={vehicleId === v.id}
                    onChange={() => setVehicleId(v.id)}
                  />
                  <span>
                    <span className="block text-sm font-medium text-stone-900">
                      {v.type} · {v.operatorName}
                    </span>
                    <span className="block text-xs text-stone-500">Up to {v.capacity} passengers</span>
                  </span>
                </span>
                <span className="shrink-0 text-sm font-medium text-stone-700">
                  <Money btn={v.ratePerDay} />/day
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Tell us what you&apos;re looking for</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Trekking vs. cultural sites, pace, special occasions, dietary needs..."
            className="input"
          />
        </div>

        {needsLogin && (
          <p className="text-sm text-amber-700">
            <Link href="/login" className="underline">
              Log in
            </Link>{" "}
            as a traveler to send a custom tour request.
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="card h-fit space-y-3 lg:sticky lg:top-4">
        <h3 className="font-display text-base font-semibold text-stone-900">Estimated price</h3>
        {nights === 0 ? (
          <p className="text-sm text-stone-500">Pick your dates to see pricing.</p>
        ) : (
          <>
            <p className="text-xs text-stone-500">
              {nights} night{nights > 1 ? "s" : ""} · {travelers} traveler{travelers > 1 ? "s" : ""}
            </p>
            <dl className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-stone-600">Guide</dt>
                <dd className="font-medium text-stone-900">
                  {selectedGuide ? <Money btn={pricing.guideCost} /> : "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-stone-600">
                  Hotel{pricing.roomsNeeded > 1 ? ` (${pricing.roomsNeeded} rooms)` : ""}
                </dt>
                <dd className="font-medium text-stone-900">
                  {selectedRoomType ? <Money btn={pricing.hotelCost} /> : "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-stone-600">Vehicle</dt>
                <dd className="font-medium text-stone-900">
                  {selectedVehicle ? <Money btn={pricing.vehicleCost} /> : "—"}
                </dd>
              </div>
            </dl>
            <div className="border-t border-stone-200 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-600">Total</span>
                <span className="font-semibold text-stone-900">
                  <Money btn={pricing.totalPrice} />
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-sm text-stone-600">Per person</span>
                <span className="font-display text-lg font-semibold text-brand-800">
                  <Money btn={pricing.pricePerPerson} />
                </span>
              </div>
            </div>
            {!hasAnySelection && (
              <p className="text-xs text-stone-500">
                Pick a guide, hotel, or vehicle above to see a live estimate. Anything left as
                &ldquo;no preference&rdquo; will be quoted separately.
              </p>
            )}
          </>
        )}
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? "Sending..." : "Send request"}
        </button>
      </div>
    </form>
  );
}
