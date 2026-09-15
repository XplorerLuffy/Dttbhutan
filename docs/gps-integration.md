# GPS integration notes

This app's GPS pipeline is hardware-agnostic by design: anything that can
POST a JSON position update to `/api/gps/ingest` works. This doc covers how
to connect real devices via Traccar (the recommended path from the build
brief), what's already built, and the open questions that need the
client's input before going live.

## What's already built

- **Data model** (`prisma/schema.prisma`): `GpsDevice` maps 1:1 to a
  `Vehicle`; `Trip` maps 1:1 to a `Booking` and holds the planned route +
  distance captured at booking time; `GpsPosition` rows attach to whichever
  `Trip` is currently `IN_PROGRESS` for that device's vehicle.
- **Ingest webhook**: `POST /api/gps/ingest` (`src/app/api/gps/ingest/route.ts`).
  Validates a shared secret header, looks up the device by
  `deviceIdentifier`, and stores the position — attached to the vehicle's
  active trip if one exists, otherwise stored unattached (for
  last-known-location diagnostics between bookings).
- **Trip lifecycle**: `POST /api/trips/[id]/start` and
  `POST /api/trips/[id]/end`, gated to the vehicle's owning transport
  operator (or admin). Ending a trip immediately regenerates its mileage
  report from the logged GPS trail (`src/lib/gps/report.ts`).
- **Distance math**: `src/lib/gps/distance.ts` — Haversine distance between
  consecutive points, with a `maxLegKm` cutoff (default 50 km) so a
  connectivity gap (device offline, then reporting again far away) isn't
  misread as 50 km of real driving.
- **Traccar REST client stub**: `src/lib/gps/traccar.ts` — for *pulling*
  historical positions from Traccar's own `/reports/route` endpoint, as a
  backfill/cross-check path. Not required for the primary (push) flow
  below.

## Recommended integration: Traccar's Forwarding feature

This avoids polling entirely. Once Traccar is receiving positions from the
real devices:

1. Deploy Traccar (self-hosted; see traccar.org/download). Docker is the
   fastest path for a single-server setup.
2. Register each vehicle's device in Traccar under its unique identifier
   (IMEI, or whatever the hardware reports) — this identifier is what goes
   into `GpsDevice.deviceIdentifier` in this app (set at vehicle
   registration, or later via Prisma Studio / an admin edit endpoint).
3. In Traccar, go to **Settings → Server → Forwarding URL** and point it at:

   ```
   https://<your-domain>/api/gps/ingest
   ```

   Traccar POSTs each position it receives to that URL as JSON. Configure
   the `x-ingest-secret` header to match this app's `GPS_INGEST_SECRET` env
   var — Traccar's forwarding supports custom headers as of recent
   versions; if the installed version doesn't, put a tiny bridging script
   in front (see below) that adds the header before relaying to this app.
4. Confirm the JSON shape matches `gpsIngestSchema`
   (`src/lib/validation.ts`): `deviceIdentifier`, `latitude`, `longitude`,
   `recordedAt` (required), `speedKmh`, `heading` (optional). Traccar's
   default forwarding payload uses slightly different field names and
   reports speed in knots — a small transform (in the bridging script, or
   a Traccar "Computed Attributes" rule) is needed either way.

### If a bridging script is simpler

Some teams find it easier to have a small script subscribe to Traccar's
own WebSocket/API and re-POST to this app's webhook, rather than fighting
Traccar's forwarding config for headers/field names. That script is not
included here since it depends on exactly which Traccar version and
device protocol end up in use — happy to add once those are confirmed.

## Open questions before this goes live

1. **What GPS hardware is already installed in the vehicles?** This
   determines which of Traccar's 170+ protocols to enable, and whether
   devices report on a fixed interval or only on movement/ignition
   events (which affects how "last known location" staleness should be
   interpreted).
2. **Does the existing hardware already report to a vendor platform** (a
   fleet-tracking SaaS) instead of raw Traccar? If so, check whether that
   platform exposes a REST API or its own webhook/forwarding feature —
   `src/lib/gps/traccar.ts` would need a vendor-specific sibling, but the
   rest of the pipeline (ingest webhook, distance calc, report
   generation) is provider-agnostic and wouldn't need to change.
3. **Where does Traccar get hosted?** Self-hosted per the brief's
   recommendation (avoids per-vehicle SaaS fees), but needs a server with
   a public IP/domain for devices to report to, and for its forwarding
   config to reach this app.

## Demo/dev-only simulator

Since none of the above is wired up yet, `POST /api/dev/simulate-ping/[tripId]`
(`src/app/api/dev/simulate-ping/[tripId]/route.ts`) fabricates one
plausible GPS ping per call — interpolating along the trip's planned route
with some jitter — so the live-tracking page and mileage report can be
demoed without real hardware. It's gated to the vehicle's owner or an
admin, same as the real trip-lifecycle endpoints. Once real devices are
reporting through `/api/gps/ingest`, this endpoint (and the "Simulate GPS
ping" button on the transport dashboard) can be deleted — nothing else
depends on it.
