"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Field,
  readError,
  splitList,
  splitLines,
  nullableText,
  nullableNumber,
} from "@/components/admin/vendorFormFields";
import PhotoUpload from "@/components/PhotoUpload";
import VendorContactFields, { useVendorContact } from "@/components/admin/VendorContactFields";

/**
 * Edits a hotel listing — or, with no `hotelId`, adds a new one, which also
 * asks for the owner's details and a first room type (a hotel can't be booked
 * without one; more can be added afterwards from its admin edit page).
 */
export default function HotelEditForm({
  hotelId,
  destinations,
  initial,
}: {
  hotelId?: string;
  destinations: { id: string; name: string }[];
  initial: {
    name: string;
    description: string;
    destinationId: string;
    address: string;
    latitude: string;
    longitude: string;
    amenities: string[];
    photoUrls: string[];
  };
}) {
  const router = useRouter();
  const creating = !hotelId;
  const contact = useVendorContact();
  const [room, setRoom] = useState({ name: "", capacity: "2", pricePerNight: "", totalRooms: "1" });
  const setRoomField = (field: keyof typeof room, value: string) =>
    setRoom((r) => ({ ...r, [field]: value }));

  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [destinationId, setDestinationId] = useState(initial.destinationId);
  const [address, setAddress] = useState(initial.address);
  const [latitude, setLatitude] = useState(initial.latitude);
  const [longitude, setLongitude] = useState(initial.longitude);
  const [amenities, setAmenities] = useState(initial.amenities.join(", "));
  const [photoUrls, setPhotoUrls] = useState(initial.photoUrls.join("\n"));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const details = {
      name,
      description: nullableText(description),
      destinationId,
      address: nullableText(address),
      latitude: nullableNumber(latitude),
      longitude: nullableNumber(longitude),
      amenities: splitList(amenities),
      photoUrls: splitLines(photoUrls),
    };
    const res = await fetch(creating ? "/api/admin/hotels" : `/api/admin/hotels/${hotelId}`, {
      method: creating ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        creating ? { contact: contact.value, hotel: details, roomType: room } : details
      ),
    });

    setIsSubmitting(false);
    if (!res.ok) {
      setError(readError(await res.json().catch(() => ({}))));
      return;
    }
    router.push("/chim/vendors");
    router.refresh();
  }

  const photos = splitLines(photoUrls);

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      {creating && <VendorContactFields kind="hotel" contact={contact} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Hotel name">
          <input value={name} onChange={(e) => setName(e.target.value)} required className="input" />
        </Field>
        <Field label="Dzongkhag">
          <select
            value={destinationId}
            onChange={(e) => setDestinationId(e.target.value)}
            className="input"
          >
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          className="input"
        />
      </Field>

      <Field label="Address" help="Area or street within the dzongkhag.">
        <input value={address} onChange={(e) => setAddress(e.target.value)} className="input" />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Latitude (optional)">
          <input
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            inputMode="decimal"
            className="input"
          />
        </Field>
        <Field label="Longitude (optional)">
          <input
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            inputMode="decimal"
            className="input"
          />
        </Field>
      </div>

      <Field label="Amenities" help="Comma-separated, e.g. Wi-Fi, Restaurant, Airport transfer">
        <input value={amenities} onChange={(e) => setAmenities(e.target.value)} className="input" />
      </Field>

      <PhotoUpload
        label="Add a photo"
        onUploaded={(url) =>
          setPhotoUrls((current) => (current.trim() ? `${current.trim()}\n${url}` : url))
        }
      />

      <Field
        label="Photo URLs"
        help="One per line. The first is used as the card image. Uploaded photos are added here."
      >
        <textarea
          value={photoUrls}
          onChange={(e) => setPhotoUrls(e.target.value)}
          rows={4}
          className="input font-mono text-xs"
        />
      </Field>

      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photos.map((url) => (
            // Vendor-entered URLs, which may be on hosts next/image rejects.
            // eslint-disable-next-line @next/next/no-img-element
            <img key={url} src={url} alt="" className="h-20 w-32 rounded object-cover" />
          ))}
        </div>
      )}

      {creating && (
        <fieldset className="space-y-3 rounded-lg border border-stone-200 p-4">
          <legend className="px-1 text-sm font-semibold text-stone-900">First room type</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Room type name" help="e.g. Deluxe Double, Family Suite">
              <input
                value={room.name}
                onChange={(e) => setRoomField("name", e.target.value)}
                required
                className="input"
              />
            </Field>
            <Field label="Price per night (BTN)">
              <input
                value={room.pricePerNight}
                onChange={(e) => setRoomField("pricePerNight", e.target.value)}
                inputMode="decimal"
                required
                className="input"
              />
            </Field>
            <Field label="Guests per room">
              <input
                value={room.capacity}
                onChange={(e) => setRoomField("capacity", e.target.value)}
                inputMode="numeric"
                required
                className="input"
              />
            </Field>
            <Field label="Number of these rooms">
              <input
                value={room.totalRooms}
                onChange={(e) => setRoomField("totalRooms", e.target.value)}
                inputMode="numeric"
                required
                className="input"
              />
            </Field>
          </div>
        </fieldset>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
        {isSubmitting ? "Saving..." : creating ? "Add hotel" : "Save changes"}
      </button>
    </form>
  );
}
