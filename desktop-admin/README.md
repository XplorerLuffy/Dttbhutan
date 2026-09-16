# Droelma Admin (desktop app)

A native desktop wrapper around the Droelma Tours & Travels **admin
dashboard** (`https://dttbhutan.vercel.app/admin`). It's a thin Electron
shell — the dashboard itself is unchanged; this just gives it its own icon,
window, dock/taskbar presence, and menu instead of living in a browser tab.

Logging in works exactly like it does on the website (same email/password).
Electron persists the session the same way a browser profile would, so you
stay logged in between launches.

## What this is / isn't

- **Is:** a native window that loads the live admin dashboard. No new
  backend, no new database, no changes to the website's code.
- **Isn't:** an offline app, a separate codebase for the dashboard UI, or a
  place to add new admin features — those still go in the Next.js app
  (`../src/app/admin`). If the dashboard changes on the website, this app
  picks it up automatically the next time it loads.

## Run it locally (development)

```bash
cd desktop-admin
npm install
npm start
```

## Build an installer

```bash
npm run build:linux    # AppImage (or build:linux:installer for the raw --dir build)
npm run build:win      # Windows installer (.exe via NSIS)
npm run build:mac      # macOS disk image (.dmg)
npm run build:all      # all three, if your machine can build them
```

Output lands in `dist/`.

**Important — build on (or for) the target OS:**
- Windows and Linux builds can usually be produced from any machine.
- A signed, notarized macOS build needs to run on a Mac with an Apple
  Developer account (for code signing/notarization) — `electron-builder`
  will produce an unsigned `.dmg` without one, which macOS Gatekeeper will
  warn about on first launch. For real distribution to other Macs, either
  get an Apple Developer certificate or distribute via TestFlight/an
  internal method that doesn't require notarization.
- Similarly, an unsigned Windows `.exe` will trigger a SmartScreen warning
  on first run. A code-signing certificate removes that.

If you don't have a code-signing certificate yet, that's fine to ship
without for internal/staff use — just expect that first-run warning.

## Changing the target URL

The dashboard URL is set once, near the top of `src/main.js`:

```js
const ADMIN_URL = "https://dttbhutan.vercel.app/admin";
```

Change it (and `ADMIN_HOST` just below it) if you ever need to point this
at a staging environment instead.

## Files

- `src/main.js` — the Electron main process: creates the window, menu,
  and handles offline/error states.
- `src/preload.js` — intentionally empty; no Node APIs are exposed to the
  page since this is a pure wrapper.
- `src/offline.html` — shown if the app can't reach the dashboard (no
  internet, or the site is down), instead of Electron's default error page.
- `build/icon.png` / `.ico` / `.icns` — app icons for Linux/Windows/macOS,
  generated from the site's existing logo mark
  (`../src/components/Logo.tsx`) via `build/generate-icons.js`.

## Known limitation (verified during development)

This app was built and test-launched in a sandboxed development
environment whose network policy blocks outbound requests to
`dttbhutan.vercel.app` specifically (confirmed via the sandbox's own proxy
logs — a policy denial, not a certificate or app error). In that sandbox,
the app correctly falls back to `offline.html` instead of crashing or
showing Electron's raw error screen. On a normal computer with regular
internet access, it will load the real dashboard exactly as a browser
would. If you install this and see the "Can't reach the admin dashboard"
screen, it means an actual connectivity problem (or the site being down),
not the app itself — the **Retry** button reloads the dashboard.
