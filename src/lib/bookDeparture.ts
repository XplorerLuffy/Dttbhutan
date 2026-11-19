/**
 * Asks the server for a pending booking on a scheduled departure. Shared by
 * the open row's Book Now and the guests-and-rooms drawer, so both behave the
 * same: a signed-out visitor is told to log in, the server's own reason is
 * shown when it refuses (sold out, duplicate, too many travelers), and a
 * network failure never leaves the button stuck.
 */
export type BookResult =
  | { kind: "ok"; id: string; reference: string }
  | { kind: "login" }
  | { kind: "error"; message: string };

export async function bookDeparture(args: {
  itineraryId: string;
  departureId: string;
  startDate: string;
  travelers: number;
  rooms: number;
}): Promise<BookResult> {
  try {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "ITINERARY", ...args }),
    });
    if (res.status === 401) return { kind: "login" };
    const data = (await res.json().catch(() => ({}))) as { id?: string; reference?: string; error?: unknown };
    if (!res.ok || !data.id || !data.reference) {
      return {
        kind: "error",
        message:
          typeof data.error === "string"
            ? data.error
            : "We couldn't create the booking. Please check your details and try again.",
      };
    }
    return { kind: "ok", id: data.id, reference: data.reference };
  } catch {
    return { kind: "error", message: "Couldn't reach the server. Check your connection and try again." };
  }
}
