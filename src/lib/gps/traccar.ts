import "server-only";

/**
 * Thin client for Traccar's REST API (https://www.traccar.org/api-reference/).
 *
 * NOT WIRED UP TO A LIVE SERVER YET. This project ships a working GPS
 * pipeline via the inbound webhook at `/api/gps/ingest` (see
 * docs/gps-integration.md), which is the simpler integration: Traccar's
 * built-in "Forwarding" feature (Settings > Server > Forwarding URL) can
 * POST each position it receives straight to that endpoint, no polling
 * needed, and Traccar keeps its own full position history / replay UI as a
 * fallback.
 *
 * This client is here for the alternative/complementary integration: pull
 * mode, useful for backfilling a trip's positions from Traccar's own
 * history (e.g. `getRoute`) if the forwarding webhook ever misses events
 * due to connectivity gaps, or for admin tooling that wants to cross-check
 * against Traccar's own report engine.
 *
 * Before using this in anger:
 *   1. Confirm the GPS hardware model already installed in the vehicles —
 *      that determines which of Traccar's 170+ protocols to enable on the
 *      server, and whether the device reports position at a fixed interval
 *      or only on movement/ignition events.
 *   2. Stand up the Traccar server (self-hosted; see traccar.org/download)
 *      and register each vehicle's device under its unique identifier
 *      (IMEI, etc.) — that identifier is what `GpsDevice.deviceIdentifier`
 *      should store.
 *   3. Set TRACCAR_API_URL / TRACCAR_API_USER / TRACCAR_API_PASSWORD.
 */

type TraccarDevice = {
  id: number;
  uniqueId: string;
  name: string;
  status: string;
};

type TraccarPosition = {
  deviceId: number;
  latitude: number;
  longitude: number;
  speed: number; // knots, per Traccar convention
  course: number;
  fixTime: string; // ISO timestamp
};

function getConfig() {
  const baseUrl = process.env.TRACCAR_API_URL;
  if (!baseUrl) {
    throw new Error(
      "TRACCAR_API_URL is not set — Traccar integration is not configured yet."
    );
  }
  return {
    baseUrl,
    user: process.env.TRACCAR_API_USER ?? "",
    password: process.env.TRACCAR_API_PASSWORD ?? "",
  };
}

function authHeader() {
  const { user, password } = getConfig();
  const token = Buffer.from(`${user}:${password}`).toString("base64");
  return `Basic ${token}`;
}

export async function fetchTraccarDevices(): Promise<TraccarDevice[]> {
  const { baseUrl } = getConfig();
  const res = await fetch(`${baseUrl}/devices`, {
    headers: { Authorization: authHeader() },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Traccar /devices request failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Pulls historical positions for a device within a time range — used to
 * backfill a trip if the live forwarding webhook missed events.
 */
export async function fetchTraccarRoute(
  deviceUniqueId: string,
  from: Date,
  to: Date
): Promise<TraccarPosition[]> {
  const { baseUrl } = getConfig();
  const devices = await fetchTraccarDevices();
  const device = devices.find((d) => d.uniqueId === deviceUniqueId);
  if (!device) {
    throw new Error(`No Traccar device found with uniqueId ${deviceUniqueId}`);
  }

  const params = new URLSearchParams({
    deviceId: String(device.id),
    from: from.toISOString(),
    to: to.toISOString(),
  });

  const res = await fetch(`${baseUrl}/reports/route?${params}`, {
    headers: {
      Authorization: authHeader(),
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Traccar /reports/route request failed: ${res.status}`);
  }
  return res.json();
}

/** Traccar reports speed in knots; convert to km/h for storage/display. */
export function knotsToKmh(knots: number) {
  return knots * 1.852;
}
