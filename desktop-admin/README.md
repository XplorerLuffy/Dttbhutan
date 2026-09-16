# Droelma Admin (desktop app)

A native desktop wrapper around the Droelma Tours & Travels **admin
dashboard** (`https://dttbhutan.vercel.app/admin`). It's a thin Electron
shell — the dashboard itself is unchanged; this just gives it its own icon,
window, and dock/taskbar presence instead of living in a browser tab. There's
no File/View/Window menu bar — it's a single-purpose window, not a browser
(reload is Ctrl/Cmd+R, DevTools is Ctrl/Cmd+Shift+I).

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
npm run build:win      # Windows installer (.exe via NSIS) — works from Linux/macOS/Windows (uses Wine on non-Windows)
npm run build:mac      # macOS disk image (.dmg) — must run ON macOS, see below
npm run build:mac:dir  # macOS .app bundle only, no .dmg wrapper — works from any OS
npm run build:all      # all three, if your machine can build them
```

Output lands in `dist/`.

**Building the Windows installer from Linux/macOS** needs Wine (for the
NSIS installer step): `sudo apt install wine wine32:i386 wine64` on
Debian/Ubuntu (or the equivalent for your distro). Verified working this
way — a real `.exe` installer builds cleanly with Wine installed.

**Building for macOS is genuinely different — read this before trying:**
`npm run build:mac` (the `.dmg` target) **only works when run on an actual
Mac.** The `.dmg`-building step (`dmg-builder`) depends on `dmg-license`,
which in turn depends on `iconv-corefoundation` — a native module that
literally cannot install on Linux or Windows (verified: `npm install
dmg-license` fails outright with `Unsupported platform` on Linux, since
that package wraps a macOS-only CoreFoundation API). This isn't a config
problem to fix; Apple's own DMG format tooling isn't available outside
macOS.

**Workaround that works from any OS:** `npm run build:mac:dir` skips the
`.dmg` step entirely and produces a plain `Droelma Admin.app` bundle under
`dist/mac/`. Zip that folder and send it to a Mac user — they unzip it and
drag `Droelma Admin.app` into `/Applications` themselves. It's the same
app, just without the drag-to-install `.dmg` polish. If you later build on
a real Mac, `npm run build:mac` there will produce a proper `.dmg`.

**Code signing, all platforms:** without a certificate, an unsigned
Windows `.exe` triggers a SmartScreen warning on first run, and an
unsigned macOS app is blocked by Gatekeeper on first open (right-click →
Open → Open gets past it, once). Both are fine for internal/staff use —
just expect that first-run warning until you have signing set up
(a Windows code-signing cert, or an Apple Developer account for macOS
notarization).

## Changing the target URL

The dashboard URL is set once, near the top of `src/main.js`:

```js
const ADMIN_URL = "https://dttbhutan.vercel.app/admin";
```

Change it (and `ADMIN_HOST` just below it) if you ever need to point this
at a staging environment instead.

## No marketing chrome, anywhere in the app

The admin dashboard (`/admin/*`) has its own sidebar instead of the site's
NavBar/Footer, and `/login`/`/register` (where a signed-out visit to
`/admin` lands first) have their own logo + copyright via `AuthLayout`
instead of the marketing header/footer. Both are handled on the website
side (`src/components/SiteChrome.tsx`), so the desktop app just inherits
a chrome-free look everywhere without needing any app-side workaround.

## Files

- `src/main.js` — the Electron main process: creates the window, and
  handles offline/error states.
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
