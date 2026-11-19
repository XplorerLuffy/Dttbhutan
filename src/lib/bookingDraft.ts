import { blankDraft, type TravelerDraft } from "@/lib/travelerDetails";
import type { Room } from "@/lib/guestRooms";

/**
 * The booking in progress, kept in this browser tab only (sessionStorage), per
 * departure. It is there so that a traveler who is sent to log in or sign up
 * partway through comes back to their rooms and what they typed, not to a
 * blank form. It ends with the tab, and is cleared once the booking is sent.
 */
const key = (departureId: string) => `dtt-booking-draft:${departureId}`;

export type SavedBooking = { rooms: Room[]; draft: TravelerDraft };

export function loadSaved(departureId: string): SavedBooking | null {
  try {
    const raw = window.sessionStorage.getItem(key(departureId));
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<SavedBooking>;
    if (!v || !Array.isArray(v.rooms) || !v.draft || !Array.isArray(v.draft.travelers)) return null;
    const rooms = v.rooms
      .filter((r) => r && Number.isInteger(r.adults) && Number.isInteger(r.beds))
      .map((r, i) => ({ id: `saved-${i}`, adults: r.adults, beds: r.beds }));
    if (rooms.length === 0) return null;
    return { rooms, draft: { ...blankDraft(0), ...v.draft } };
  } catch {
    return null;
  }
}

export function save(departureId: string, value: SavedBooking): void {
  try {
    window.sessionStorage.setItem(key(departureId), JSON.stringify(value));
  } catch {
    // Private windows can refuse storage; the form simply won't survive a reload.
  }
}

export function clearSaved(departureId: string): void {
  try {
    window.sessionStorage.removeItem(key(departureId));
  } catch {
    // nothing to clear
  }
}
