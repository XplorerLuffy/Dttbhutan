# JT808 GPS server

A small, separate TCP service (`gps-server/`) that receives positions from
trackers speaking the JT808 protocol in the supplier's document
(`JT808-_PROTOCOL.doc`) and hands them to the website's existing
`POST /api/gps/ingest`. No Traccar, no per-device fees.

```
tracker --TCP/JT808--> gps-server (VPS) --HTTPS + secret--> /api/gps/ingest (Vercel) --> Supabase
                                  \--HTTPS + secret--> /api/gps/device   ("is this tracker registered and active?")
```

The listener must run on its own always-on host. Vercel functions cannot hold
a TCP port open, so nothing here runs on Vercel except the two HTTP routes.

**Status: verified against the specification document with simulated devices
only. It has not been tried on a physical tracker.** See "Test report" and
"Outstanding questions".

---

## 1. Audit of what existed

| Piece | State found |
|---|---|
| `POST /api/gps/ingest` | Working. Shared-secret header, zod validation, device looked up by `GpsDevice.deviceIdentifier`, position stored, attached to the vehicle's in-progress trip. |
| `src/lib/gps/traccar.ts` | A client stub. Not connected to any server and not used by the pipeline. Left untouched. |
| Schema | `GpsDevice` (1:1 with `Vehicle`, `deviceIdentifier` unique, `status` ACTIVE/INACTIVE), `Trip`, `GpsPosition` (lat, lng, speedKmh, heading, recordedAt, receivedAt; indexed on `(deviceId, recordedAt)` and `(tripId, recordedAt)`), `TripDistanceReport`. No GPS-specific migrations after the initial one. |
| Mileage report | `src/lib/gps/report.ts` sums haversine legs over the trip's positions ordered by `recordedAt`; legs over 50 km are treated as dropouts. Unchanged by this work. |
| Auth/tenancy | The device never supplies an organization. Operator ownership comes from `GpsDevice.vehicleId -> Vehicle`. |

Gaps found in the old `/api/gps/ingest` (all fixed, none needs a migration):

1. **Secret compared with `!==`** (not constant-time). Now `timingSafeEqual`.
2. **`GpsDevice.status` was never checked**, so a deactivated tracker could still write. Now 403.
3. **No duplicate protection.** A retry after a lost response, or a tracker re-sending a stored point, created a second row and inflated `pointCount`. Now the same `(device, recordedAt)` answers `200 {duplicate:true}` and stores nothing. This is checked in application code (an existing index covers the lookup). A database `UNIQUE` index would be stronger but could fail the Vercel build if old duplicates exist, so it is left as a follow-up that needs a data check first.
4. **Trip attachment ignored `recordedAt`.** Any position arriving while a trip was in progress joined that trip, so a tracker uploading points it stored earlier (before the trip) would corrupt the mileage. Now a point joins the trip only if it was recorded at or after the trip's `startedAt`.

Not changed, but worth knowing: ignition, odometer and alarm flags from the tracker cannot be stored because `GpsPosition` has no columns for them. They are decoded and tested, then dropped. Storing them needs a migration (see "Production prerequisites").

## 2. Protocol compatibility assessment (from the supplied document)

Implemented, each with tests built from hand-assembled packets:

| Feature | Spec | Notes |
|---|---|---|
| Framing, `0x7E` delimiters, `0x7D` escapes | 2.4 | Spec's own escape example is a test. |
| Header, big-endian, BCD phone, serial | 2.4.3 | Sub-package header is *parsed*; sub-packaged messages are answered "not supported" (see questions). |
| XOR checksum | 2.4.4 | Over header+body. |
| Registration `0x0100` / reply `0x8100` | 7.4, 7.5 | Replies only for registered, active devices; code is returned in the reply. |
| Authentication `0x0102` | 8.7 | Code must match the one derived for that phone number. |
| Heartbeat `0x0002` | 7.3 | Acknowledged with `0x8001`. |
| Platform reply `0x8001` | 6.2 | Result 0 ok, 1 failed, 2 bad message, 3 not supported. |
| Location `0x0200` | 7.11, Tables 16-19 | lat/lon /1e6, speed /10, hemisphere bits 2/3, located bit 1, ACC bit 0, mileage extra `0x01`. |
| Stored positions `0x0704` | 8.6 | Count, type, then length-prefixed `0x0200` blocks. |

**Places the document is internally inconsistent, and what was done**

- *Location table offsets.* The table prints direction at byte 20 and time at 21; the fields' own sizes (WORD, BCD[6]) put the time at 22 (this is also the standard JT808 layout). Implemented at 22. A real capture will settle it.
- *Registration layout.* The document lays out a 25-byte fixed part (8-byte terminal model, JT808-2011). JT808-2013 uses a 20-byte model. The server reads only the manufacturer id (same offset in both) and identifies the device from the header phone number, so it works with either.
- *`0x0704` offsets.* The table shows the type byte at offset 1; the standard puts a 2-byte count first. Implemented as count(2) + type(1).
- *Timestamps.* The document says all times are GMT+8. The server uses `GPS_DEVICE_TZ_OFFSET_MINUTES` (default 480) and **discards** positions more than 10 minutes in the future or older than 30 days, rather than silently shifting them. If the tracker really sends Bhutan time (GMT+6), positions will all be dropped and counted under `positionsImplausible` in `/status`, which is the signal to change the setting. Bhutan is GMT+6.
- *Device identity.* The only identifier in every message is the 12-digit BCD phone number in the header. `GpsDevice.deviceIdentifier` must be exactly that string (leading zeros kept). Confirm with the supplier whether it is the SIM number, an IMEI-derived value or something they assign.

**Not implemented** (not needed for position tracking): all platform-to-terminal control (parameter setting, terminal control, text, area/route setting), `0x8201` queries, multimedia, and RSA encryption (rejected). **No remote engine cut-off / fuel cut / door control is implemented, deliberately.** GT06 and Tianqin are separate protocols and are not included; they need their own compatibility assessment and adapter.

## 3. How a message is handled

- Connection: limits per address and in total, a 30 s window to authenticate, an idle timeout, and a per-connection message rate limit. Frames are bounded at 4 KB; an endless frame closes the connection.
- Before authentication only `0x0100` and `0x0102` are accepted; everything else is dropped.
- A frame whose header phone number differs from the authenticated connection is dropped (this is what stops one device writing as another).
- A new connection from the same phone number replaces the old one (spec 3.3).
- **Acknowledgement means stored.** A position is acknowledged only after the website answers `200/201` with a position id. If the website is unreachable or returns 5xx or 401, the server stays silent; the tracker keeps the point and resends (spec 4.2). A retransmission of an already-answered message is re-acknowledged without reprocessing; the website's duplicate check covers restarts.
- Unlocated fixes, `0,0`, impossible coordinates and implausible times are acknowledged (resending cannot help) but not stored, and counted.

### Security

- Device auth code = `HMAC-SHA256(GPS_DEVICE_AUTH_SECRET, "jt808:"+phone)`, first 16 hex characters. Nothing stored; a code is useless for any other phone number; rotating the secret invalidates all codes.
- Registration and authentication both require the website to confirm the phone number is a registered, active `GpsDevice`. The TCP server never receives or sends a vehicle, operator or trip id; tenancy is resolved only by the website from `GpsDevice`.
- Website calls use a shared secret over HTTPS (plain HTTP is refused unless the host is localhost or `GPS_ALLOW_INSECURE_INGEST=1`).
- Logs contain phone numbers and counts only: no authentication codes, secrets or coordinates.
- Secrets live in `/etc/dtt-gps-server.env` (mode 600) on the server and in Vercel's environment variables, never in the repository.

The TCP link itself (tracker to server) is plain JT808 and is not encrypted; that is a property of the trackers. The authentication code travels in clear on that link, so treat it as a device password, not as proof against someone who can read the mobile network traffic.

## 4. Files

Added
- `gps-server/` — the listener: `src/protocol/{frame,messages}.ts`, `src/server.ts`, `src/website.ts`, `src/auth.ts`, `src/config.ts`, `src/health.ts`, `src/logger.ts`, `src/main.ts`, `src/simulator.ts`, `src/authCodeCli.ts`, `test/*`, `.env.example`.
- `src/lib/gps/ingest.ts` — the ingest logic, separated from Next/Prisma so it can be tested.
- `src/app/api/gps/device/route.ts` — registered/active check for the listener.
- `src/lib/tests/gpsIngest.test.ts`, `deploy/dtt-gps-server.service`, this document.

Changed
- `src/app/api/gps/ingest/route.ts` — now uses `ingest.ts` (same request format, same 201 response; adds 403 for inactive devices and `200 {duplicate:true}`).
- `tsconfig.json` — excludes `gps-server/` from the website's type check.
- `package.json` — `npm run test:gps`.

No migration was added or applied.

## 5. Running it locally (simulator)

```bash
# terminal 1: the listener, pointed at a website you can reach
cd gps-server && npm install
GPS_INGEST_URL=http://127.0.0.1:3000/api/gps/ingest \
GPS_INGEST_SECRET=<same as the website's GPS_INGEST_SECRET> \
GPS_DEVICE_AUTH_SECRET=<24+ random characters> \
GPS_ALLOW_INSECURE_INGEST=1 npm start

# terminal 2: a pretend tracker (the phone number must exist as a GpsDevice.deviceIdentifier)
GPS_DEVICE_AUTH_SECRET=<same> npx tsx src/simulator.ts --phone 013900000001 --count 5 --interval 1000
```

Without `--auth-secret` the simulator registers first and uses the code it is given. To print the code a device must be configured with: `GPS_DEVICE_AUTH_SECRET=... npm run auth-code -- 013900000001`.

Tests: `npm run test:gps` from the repo root (69 tests; needs no database, network or secrets).

## 6. Deploying to a VPS (do not do this until you approve a provider)

Any small Linux VPS works (1 vCPU / 1 GB is plenty for dozens of trackers). Pick a region close to Bhutan for lower latency. Open **one** inbound TCP port for trackers (default `8808`) plus SSH.

```bash
# as root on Ubuntu 22.04/24.04
apt update && apt install -y nodejs npm ufw git   # Node 20+; use NodeSource if the repo version is older
adduser --system --group --home /opt/dtt-gps-server dttgps
git clone <repo-url> /opt/dtt-gps-server && chown -R dttgps:dttgps /opt/dtt-gps-server
cd /opt/dtt-gps-server/gps-server && sudo -u dttgps npm ci --omit=dev || sudo -u dttgps npm install --omit=dev

cp .env.example /etc/dtt-gps-server.env && chmod 600 /etc/dtt-gps-server.env && chown root:root /etc/dtt-gps-server.env
nano /etc/dtt-gps-server.env        # fill in the two secrets and the ingest URL

cp /opt/dtt-gps-server/deploy/dtt-gps-server.service /etc/systemd/system/
systemctl daemon-reload && systemctl enable --now dtt-gps-server

ufw allow OpenSSH && ufw allow 8808/tcp && ufw enable    # health port 8809 stays closed (localhost only)
```

Also set the **same** `GPS_INGEST_SECRET` in Vercel's environment variables (it is already used by the existing route), and use a *different* long random `GPS_DEVICE_AUTH_SECRET` only on the VPS.

Check it:
```bash
curl -s localhost:8809/healthz        # {"status":"ok"}
curl -s localhost:8809/readyz         # 200 when listening and the website last answered
curl -s localhost:8809/status         # counters + each connected device's last message time
journalctl -u dtt-gps-server -f       # structured JSON logs
```

Restart and shutdown: systemd restarts the service on failure (`Restart=always`); `systemctl stop` sends SIGTERM, the server stops accepting, finishes in-flight positions (up to 10 s), then closes sockets. Trackers reconnect on their own and resend anything unacknowledged.

**Upgrade:** `cd /opt/dtt-gps-server && git fetch && git log --oneline HEAD..origin/<branch>` to review, `git pull`, `cd gps-server && npm ci --omit=dev`, `systemctl restart dtt-gps-server`, then check `/readyz` and the logs. **Roll back:** `git checkout <previous-commit>` and restart. The service holds no state, so rollback loses nothing.

**Backup/recovery:** the server stores nothing; its only state is `/etc/dtt-gps-server.env`. Keep the two secrets in your password manager. Losing `GPS_DEVICE_AUTH_SECRET` means trackers must re-register (or be reconfigured with new codes). Position data lives in Supabase and is covered by its backups. If the VPS dies, create a new one, redo the steps above and point the trackers' DNS name/IP at it. Use a DNS name for the tracker server address if the trackers allow it, so a replacement VPS does not need re-programming.

## 7. Checklist for the supplier

Ask them to confirm, in writing:
1. Exact tracker model and firmware version, and whether this document is the protocol that firmware speaks (the file's title says "A6F communication protocol").
2. How to set the server address and port (SMS command, config tool or platform) and whether a **domain name** is accepted.
3. TCP or UDP. The server implements TCP only.
4. What value the tracker uses as its terminal number (header phone number): the SIM number, or something they program? Is it always 12 digits?
5. Does the tracker register with `0x0100` and then store the returned code, or must we pre-program an authentication code? Maximum length of the code (ours is 16 characters)?
6. Time zone of the timestamps it sends (the document says GMT+8; Bhutan is GMT+6).
7. Reporting interval and what triggers a report (time, distance, ignition); does it send `0x0704` stored data after losing coverage, and as type 0 or 1?
8. Does it ever send sub-packaged messages (bit 13 of the properties word)?
9. Are coordinates ever "encrypted/offset" (status bit 5)? They must be plain WGS-84.
10. Which additional items it attaches to `0x0200` (mileage `0x01`, others) and the units.
11. A **raw hex capture** of a real session (registration, authentication, heartbeat, several locations, a stored batch). These become the real-device tests.
12. The SMS/config command to restore a tracker if it is pointed at a wrong server.

## 8. Test report

**Simulated (automated, `npm run test:gps`, 69 tests, all passing on the last run):**
- Framing: spec escape example, hand-assembled heartbeat and location packets (checksums computed independently of the encoder), checksum/length/BCD/encryption/escape errors, sub-package header, byte-by-byte, coalesced and partial streams, oversized frames.
- Messages: coordinates, hemispheres, speed, heading, GMT+8 and GMT+6 conversion, invalid dates, unlocated and encrypted-coordinate fixes, odometer extra, truncated extras, batch parsing and malformed batches.
- Server (real TCP sockets, a simulated tracker, and an in-memory website running the real `ingestPosition`): registration, authentication, wrong/foreign codes, inactive and unknown devices, pre-auth drops, auth and idle timeouts, reconnect replacement, heartbeat, stored positions, duplicates and out-of-order batches, no acknowledgement when the website is down (then success on resend), a fake-200 response not counted as stored, trip window, tenant isolation (a forged phone number on another device's connection stores nothing; concurrent devices stay separate), 25 concurrent devices, fragmentation, corrupt frames, garbage floods, oversized frames, rate limit, per-address limit, graceful shutdown.
- Ingest logic: not found, inactive, duplicate, trip window, constant-time secret check; mileage maths unchanged (duplicated point adds nothing, dropout legs skipped).
- I deliberately broke four safety checks (phone mismatch, acknowledge-without-confirmation, duplicate check, inactive check) and confirmed each break made the tests fail.

**Not tested (and therefore not claimed):**
- Any physical tracker. Compatibility with the real hardware is **unproven**.
- The real Next route and Supabase: the website side of the tests is an in-memory stand-in that runs the real ingest logic but not the Prisma glue in the route file, and there was no database in the test environment. After deploy, verify with one real or simulated position and check the row in Supabase.
- Behaviour under real mobile networks, long uptime and load beyond 25 concurrent devices.
- The deployment steps on an actual VPS.
- The type check passes for both the website and `gps-server`; the Vercel build for the changed route is confirmed by the deployment status.

## 9. Outstanding questions and production prerequisites

Before trusting it with real trips:
1. Answers to the supplier checklist above, and a raw capture from a real tracker.
2. One physical tracker tested end to end on a VPS (registration, auth, positions, a coverage loss and stored upload, a reconnect).
3. A VPS provider/region chosen and approved, and a DNS name for the tracker server address.
4. `GPS_INGEST_SECRET` confirmed in Vercel; new `GPS_DEVICE_AUTH_SECRET` generated and kept safe.
5. `GpsDevice.deviceIdentifier` entered for each vehicle as the exact 12-digit terminal number the tracker sends.
6. Decide whether to store ignition, odometer and alarm flags. That needs a migration adding columns to `GpsPosition` (and a data check for duplicate `(deviceId, recordedAt)` rows if you also want a database-level unique index). Not done, by design.
7. Sub-packaged messages, UDP, GT06 and Tianqin are unsupported until a real device shows they are needed.
8. Monitoring/alerting on `/readyz` and on `lastMessageAt` per device (the data is exposed; no alerting is wired up).
