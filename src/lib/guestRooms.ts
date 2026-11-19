/**
 * The rules for the "Select Guests & Rooms" step, kept apart from the screen so
 * they can be tested and so the screen cannot reach a state they forbid.
 *
 * Assumptions (change the constants if the business rule differs):
 *  - at most 4 rooms and 2 beds per room: beyond that the traveler is sent to
 *    contact us, as the screen says;
 *  - 1 to 4 adults per room, and never more beds than adults;
 *  - a trip with a maximum group size caps the total travelers.
 */
export const MAX_ROOMS = 4;
export const MAX_BEDS_PER_ROOM = 2;
export const MAX_ADULTS_PER_ROOM = 4;

export type Room = { id: string; adults: number; beds: number };

let counter = 0;
const nextId = () => `room-${++counter}`;

export function newRoom(adults = 2): Room {
  const a = clamp(adults, 1, MAX_ADULTS_PER_ROOM);
  return { id: nextId(), adults: a, beds: 1 };
}

/** Spreads a party over a number of rooms as evenly as it divides, each with one bed. */
export function defaultRooms(adults: number, rooms: number): Room[] {
  const count = clamp(rooms, 1, Math.max(1, adults));
  const base = Math.floor(adults / count);
  const extra = adults % count;
  return Array.from({ length: count }, (_, i) => ({
    id: nextId(),
    adults: Math.max(1, base + (i < extra ? 1 : 0)),
    beds: 1,
  }));
}

export const totals = (rooms: Room[]) => ({
  travelers: rooms.reduce((n, r) => n + r.adults, 0),
  rooms: rooms.length,
});

export function withAdults(room: Room, adults: number): Room {
  const a = clamp(adults, 1, MAX_ADULTS_PER_ROOM);
  // Fewer people than beds would leave a bed unused, so the beds follow down.
  return { ...room, adults: a, beds: Math.min(room.beds, a) };
}

export function withBeds(room: Room, beds: number): Room {
  return { ...room, beds: clamp(beds, 1, Math.min(MAX_BEDS_PER_ROOM, room.adults)) };
}

export function canAddRoom(rooms: Room[], maxTravelers: number | null): boolean {
  if (rooms.length >= MAX_ROOMS) return false;
  return maxTravelers === null || totals(rooms).travelers < maxTravelers;
}

/** Every reason the configuration cannot go forward; empty when it can. */
export function validateRooms(rooms: Room[], maxTravelers: number | null): string[] {
  const errors: string[] = [];
  if (rooms.length < 1) errors.push("Add at least one room.");
  if (rooms.length > MAX_ROOMS) errors.push(`For more than ${MAX_ROOMS} rooms, please contact us.`);
  rooms.forEach((r, i) => {
    const label = `Room ${i + 1}`;
    if (!Number.isInteger(r.adults) || r.adults < 1) errors.push(`${label} needs at least one adult.`);
    else if (r.adults > MAX_ADULTS_PER_ROOM) errors.push(`${label} holds at most ${MAX_ADULTS_PER_ROOM} adults.`);
    if (!Number.isInteger(r.beds) || r.beds < 1) errors.push(`${label} needs at least one bed.`);
    else if (r.beds > MAX_BEDS_PER_ROOM) errors.push(`For more than ${MAX_BEDS_PER_ROOM} beds in a room, please contact us.`);
    else if (r.beds > r.adults) errors.push(`${label} has more beds than adults.`);
  });
  const { travelers } = totals(rooms);
  if (maxTravelers !== null && travelers > maxTravelers) {
    errors.push(`This trip takes at most ${maxTravelers} travelers.`);
  }
  return errors;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.trunc(Number.isFinite(n) ? n : min)));
}
