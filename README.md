# Dtt Bhutan

A booking marketplace for a Bhutanese travel agency, covering three vendor
types — tour guides, hotels, and transport (vehicles + drivers) — plus a GPS
tracking module for trip mileage verification and live traveler tracking.

This is a working MVP covering phases 1–3 (and most of 4–5) of the build plan:
vendor registration + admin approval, search/booking, GPS mileage
verification, live tracking, reviews and messaging. See
[Current status & what's stubbed](#current-status--whats-stubbed) below for
exactly what is and isn't wired up to real infrastructure.

## Stack

- **Next.js 14** (App Router, TypeScript) — one app for both the public
  site and API routes.
- **PostgreSQL + Prisma** — see `prisma/schema.prisma` for the full data
  model (users/roles, guides, hotels, transport, bookings, reviews,
  messages, and the GPS tables).
- **Auth**: a lightweight JWT-in-httpOnly-cookie session (`jose` +
  `bcryptjs`), not a third-party auth provider — role-based
  (`TRAVELER` / `GUIDE` / `HOTEL_OPERATOR` / `TRANSPORT_OPERATOR` / `ADMIN`).
- **Maps**: Leaflet + OpenStreetMap tiles (no API key required). The build
  prompt suggested Mapbox/Google Maps as an option — swap in
  `src/components/map/*` if the client prefers one of those (they bill
  per-load at scale; OSM tiles are free but rate-limited for production
  traffic, so a tile provider like MapTiler/Stadia is worth budgeting for
  before real-world usage).
- **GPS pipeline**: `src/lib/gps/` — Haversine distance calc, deviation
  flagging, and a Traccar REST client stub. See
  [`docs/gps-integration.md`](./docs/gps-integration.md) for how this
  connects to real hardware.

## Getting started

```bash
npm install
cp .env.example .env   # then fill in values — see below
npm run db:migrate     # creates the schema in your Postgres database
npm run db:seed        # demo data, including a pre-built mileage dispute
npm run dev
```

Requires a running PostgreSQL instance reachable at `DATABASE_URL` in
`.env`. `AUTH_SECRET` and `GPS_INGEST_SECRET` need real random values in any
non-throwaway environment — see the comments in `.env.example` for how to
generate them.

### Demo logins (after `npm run db:seed`)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@dttbhutan.bt` | `password123` |
| Traveler | `traveler@example.com` | `password123` |
| Guide | `pemba.guide@example.com` | `password123` |
| Hotel operator | `owner@tsheringhotel.bt` | `password123` |
| Transport operator | `dispatch@druktransport.bt` | `password123` |

The seed data includes a **pre-built mileage dispute**: a completed vehicle
trip where the quoted/planned route was 90 km but the GPS trail proves only
~22 km was actually driven. Log in as admin and open **GPS mileage
reports** to see it flagged, with the planned-vs-actual route drawn on the
map — this is the exact scenario described in the brief (a driver
over-reporting distance to overcharge clients). There's also a trip
already `IN_PROGRESS` for testing the live-tracking view without needing to
start one manually.

## Architecture notes / decisions

- **Single Next.js app**, not a separate frontend/backend — the brief left
  this open ("Node.js/Express **or** Next.js API routes"); one deployable
  app is simpler to run and reason about at this stage, and API routes
  under `src/app/api/` can be split out later if the mobile/offline story
  needs a dedicated backend.
- **Auth is hand-rolled**, not NextAuth/Clerk/etc. The role model here
  (five roles, three of which gate a vendor-profile creation flow) is
  simple enough that a ~120-line session module (`src/lib/auth.ts`) is less
  surface area than wiring a full auth library, and avoids adding a
  dependency whose defaults would need to be fought.
- **Availability/booking conflicts** (`src/lib/availability.ts`,
  `src/lib/booking.ts`) are enforced with plain overlapping-date-range
  queries against `Booking`, not a separate calendar/availability table —
  a booking's own date range *is* the availability record. This is
  correct and simple for now; if per-day pricing or partial-day
  availability windows are needed later, a dedicated availability table
  would be the next step.
- **Commission** is tracked per-booking (`Booking.commissionRate`,
  defaulting to 10%) but there's no payment gateway wired up — see below.

## GPS tracking module

Two consumers share one pipeline (device → `GpsPosition` rows → derived
views):

- **Mileage verification** (admin-facing): `/admin/gps/trips` and
  `/admin/gps/trips/[id]`. `src/lib/gps/report.ts` sums Haversine distance
  across a trip's logged positions and compares it to the
  planned/quoted distance captured at booking time, flagging trips that
  deviate past a configurable threshold (`GPS_DEVIATION_FLAG_PERCENT`,
  default 15%). This is the artifact meant to serve as evidence in a
  driver/client mileage dispute.
- **Live tracking** (traveler + public share link):
  `/track/[shareToken]`. No account required — shows last-known location
  with a visible timestamp (not a promise of continuous live video-style
  tracking), an ETA estimate, and a staleness warning after 20 minutes
  with no signal, per the brief's note about patchy connectivity in
  Bhutan's mountainous terrain.

Trip lifecycle (`NOT_STARTED → IN_PROGRESS → COMPLETED`) is controlled from
the transport operator's dashboard (`/vendor/transport`): **Start trip**
opens the window during which incoming GPS positions attach to that trip;
**End trip** closes it and generates the mileage report immediately.

Full integration notes (Traccar setup, the ingest webhook contract, what's
still a stand-in) are in [`docs/gps-integration.md`](./docs/gps-integration.md).

## Current status & what's stubbed

Working end-to-end: vendor registration + admin approval (guides, hotels,
transport), search/filter, booking with availability-conflict checks,
traveler/vendor/admin dashboards, per-booking messaging, reviews tied to
completed bookings, GPS mileage verification, and live tracking with a
public share link.

Not wired up to real infrastructure yet — by design, since these need
answers only the client can give:

- **No real GPS hardware/Traccar server.** The ingest pipeline
  (`/api/gps/ingest`) is a working webhook, but nothing feeds it in this
  build. A "Simulate GPS ping" button on the transport dashboard
  (`/api/dev/simulate-ping/[tripId]`) stands in for real hardware so the
  live-tracking and mileage-report UI can be exercised — remove it (or
  leave it; it's owner/admin-gated) once real devices are reporting. See
  `docs/gps-integration.md` for what's needed to go live: confirm the GPS
  hardware model, stand up Traccar, and point its forwarding config at the
  ingest webhook.
- **No payment gateway.** `Payment` exists in the schema and commission is
  computed per booking, but there's no bank transfer / mobile wallet
  integration — the brief flagged this as needing confirmation from the
  client on what's viable in Bhutan.
- **No TCB license verification API.** A guide's TCB license number is
  captured at registration and shown to the admin, but there's no
  automated check against a registry — per the brief, this is likely a
  manual admin step unless TCB exposes a public verification API.
- **No Dzongkha localization yet** (English only) — brief lists this under
  the final "polish" phase.
- **Maps use OpenStreetMap tiles**, not Mapbox/Google Maps — see the Stack
  section above for why, and the tradeoff.

## Useful scripts

```bash
npm run db:studio    # Prisma Studio — browse/edit data directly
npm run db:migrate   # create a new migration from schema.prisma changes
npm run lint
npm run build
```
