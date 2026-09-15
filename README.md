# Dtt Bhutan

A booking marketplace for a Bhutanese travel agency, functionally modeled on
Booking.com's search/compare/book UX, covering four bookable categories —
tour guides, hotels, transport (vehicles + drivers), and flights — plus a
GPS tracking module for trip mileage verification and live traveler
tracking.

This is a working MVP covering phases 1–5 (and most of 6–7) of the build
plan: vendor registration + admin approval, unified search/booking across
all four categories, GPS mileage verification, live tracking, flights via a
mock aggregator, reviews, messaging, and a first design/animation pass. See
[Current status & what's stubbed](#current-status--whats-stubbed) below for
exactly what is and isn't wired up to real infrastructure.

## Stack

- **Next.js 14** (App Router, TypeScript) — one app for both the public
  site and API routes.
- **PostgreSQL + Prisma** — see `prisma/schema.prisma` for the full data
  model (users/roles, guides, hotels, transport, flights, bookings,
  reviews, messages, and the GPS tables).
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
- **Flights**: `src/lib/flights/aggregator.ts` — a mock client behind the
  interface a real aggregator (Amadeus/Duffel/a GDS reseller) would
  implement. See [Flights](#flights) below.
- **Animation**: GSAP + ScrollTrigger (scroll-triggered reveals, hero
  parallax), Framer Motion (page transitions, hover/tap micro-interactions,
  animated map marker), Lenis (site-wide smooth scroll). All respect
  `prefers-reduced-motion`.
- **Fonts**: Fraunces (display/headings) + Plus Jakarta Sans (body), via
  `next/font/google` — a deliberate pairing instead of system fonts.

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
already `IN_PROGRESS` for testing the live-tracking view, and a confirmed
flight booking with a demo PNR, without needing to create either manually.

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
- **Unified search** (the homepage's category-tabbed search bar,
  `src/components/home/SearchTabs.tsx`) is a thin UI layer over the four
  categories' existing search pages — each tab is a plain GET form
  submitting to `/guides`, `/hotels`, `/vehicles`, or `/flights` with that
  page's existing query params. There's no separate cross-category search
  index; each category still queries its own table (or, for flights, calls
  the aggregator) independently.
- **Photo uploads** (`src/app/api/uploads/route.ts`) write to local disk
  under `public/uploads/` — fine for development, but this does not
  survive a redeploy on most hosting platforms and won't work across
  multiple server instances. Swap for S3/Cloudinary/R2 before production;
  the upload API's contract (`POST` multipart form → `{ url }`) wouldn't
  need to change on the calling side.

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
  Bhutan's mountainous terrain. The vehicle marker eases between GPS pings
  (`src/components/map/LiveTrackingMap.tsx`) instead of jumping instantly.

Trip lifecycle (`NOT_STARTED → IN_PROGRESS → COMPLETED`) is controlled from
the transport operator's dashboard (`/vendor/transport`): **Start trip**
opens the window during which incoming GPS positions attach to that trip;
**End trip** closes it and generates the mileage report immediately.

Full integration notes (Traccar setup, the ingest webhook contract, what's
still a stand-in) are in [`docs/gps-integration.md`](./docs/gps-integration.md).

## Flights

`src/lib/flights/aggregator.ts` is a **mock aggregator** — there is no real
airline inventory behind it. Bhutan has no domestic reservation system of
its own to sell against directly, so a production build needs a commercial
agreement with a real aggregator:

- **Duffel** — modern REST API, self-serve onboarding, good starting point.
- **Amadeus** — broader global carrier coverage, useful for connecting
  itineraries out of Paro through South/Southeast Asian hubs.
- A **GDS reseller** — an alternative if the client already has a travel
  agency IATA/GDS relationship.

Any of these typically comes with per-ticket transaction fees — flag this
to the client before committing. The mock provider exposes the same two
calls a real one needs (`searchFlights`, `bookFlight`), so swapping it out
shouldn't require touching the search page, booking flow, or dashboards.

Bhutan's two carriers (Drukair / Royal Bhutan Airlines, and Bhutan
Airlines) are pinned first in results for routes into/out of Paro (PBH) —
flip `PIN_BHUTAN_CARRIERS` in that file to `false` for a general
international-search feel instead, if the client prefers that.

## Photo upload (camera + gallery)

`src/components/PhotoUpload.tsx` is a single `<input type="file"
accept="image/*" capture="environment">` control — on mobile this prompts
most browsers to offer "take a photo" alongside "choose from library" in
one native picker (exact behavior varies by browser/OS; some launch the
camera directly). There's no standards-based way to force a two-button
choice every time without a custom camera UI built on `getUserMedia`, which
brings its own reliability tradeoffs — this was judged the more robust
default. Wired into guide profile and hotel cover-photo registration.

## Design & animation

- **Palette**: a Bhutanese-motif palette (`tailwind.config.ts`) — deep
  temple-maroon (`brand`), saffron/gold (`gold`), and pine green (`pine`)
  — replacing a generic blue/white SaaS default. Status badges use `pine`
  for success states, `amber` for pending, `red` for rejected/cancelled.
- **Typography**: Fraunces (serif display, headings) + Plus Jakarta Sans
  (body), loaded via `next/font/google` (self-hosted at build time, no
  runtime request to Google's CDN).
- **Smooth scroll**: Lenis, mounted once in the root layout
  (`src/components/SmoothScroll.tsx`), skipped entirely under
  `prefers-reduced-motion`.
- **Scroll-triggered reveals**: `src/components/ScrollReveal.tsx` (GSAP +
  ScrollTrigger) staggers a section's children in the first time they
  scroll into view — used on the homepage and every listing page's result
  grid.
- **Page transitions**: `src/components/PageTransition.tsx` (Framer
  Motion `AnimatePresence`, keyed by pathname) — a short fade/slide
  between routes instead of a hard cut.
- **Micro-interactions**: `MotionCard` / `MotionListItem` give listing
  cards a hover lift and tap feedback; the homepage's category-tab
  underline uses a Framer Motion `layoutId` for a shared-element slide.
- **Hero**: a maroon-to-gold gradient with two GSAP-driven parallax
  mountain-silhouette layers (inline SVG, no image assets) behind the
  unified search widget. A Three.js/React Three Fiber hero was considered
  per the brief but skipped for this pass — the bundle-size and
  SSR-compatibility risk wasn't worth it against a CSS/SVG treatment that
  already reads as premium; worth revisiting if the client wants to invest
  further in the hero specifically.
- **Loading states**: `loading.tsx` per listing route renders an animated
  skeleton grid (`src/components/SkeletonGrid.tsx`) instead of a blank
  screen or spinner while results load.
- **Live map marker**: eases between GPS pings (`requestAnimationFrame` +
  cubic easing) rather than jumping — see the GPS section above.
- **Reduced motion**: a global CSS rule collapses all CSS
  transitions/animations under `prefers-reduced-motion: reduce`
  (`globals.css`), and every GSAP/Framer Motion effect additionally checks
  `useReducedMotion()` / `matchMedia` and either skips or renders the final
  state directly.

Not yet done from the brief's animation wishlist: true edge-to-edge
(viewport-width) hero bleed — the hero is full-width *within* the
`max-w-6xl` content container, not the browser viewport, since that would
need a homepage-specific layout exception; and no dedicated
performance pass on a real mid-range Android device (only checked with
desktop Chromium in this environment) — worth doing before launch given
the brief's connectivity concerns.

## Current status & what's stubbed

Working end-to-end: vendor registration + admin approval (guides, hotels,
transport), search/filter and booking across all four categories with
availability-conflict checks, traveler/vendor/admin dashboards,
per-booking messaging, reviews tied to completed bookings, GPS mileage
verification, live tracking with a public share link, and flight search +
booking with a generated PNR.

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
- **No real flight aggregator.** See [Flights](#flights) above.
- **No payment gateway.** `Payment` exists in the schema and commission is
  computed per booking, but there's no bank transfer / mobile wallet
  integration — the brief flagged this as needing confirmation from the
  client on what's viable in Bhutan.
- **No TCB license verification API.** A guide's TCB license number is
  captured at registration and shown to the admin, but there's no
  automated check against a registry — per the brief, this is likely a
  manual admin step unless TCB exposes a public verification API.
- **Photo uploads use local disk storage** — see the note under
  Architecture notes above.
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
