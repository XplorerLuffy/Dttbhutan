# Supabase Auth

Supabase owns credentials and sessions. The agency's own `User` table stays,
and holds everything else about a person — name, phone, role, and the
relationships to bookings, guide profiles, hotels and messages.

## Why the profile did not move into `auth.users`

`User.id` is a cuid, and ten tables point at it with live data. Supabase's auth
users are uuids. Re-keying every foreign key to match would have been a large,
risky migration that bought nothing: the role and the relationships still have
to live somewhere the application can query and join.

So `User.authId` is the join. Supabase answers "is this person who they say
they are"; `User` answers "and who is that to us".

## Why roles are not in the token

A guide's role changes the moment an admin approves them. A role baked into a
JWT's `app_metadata` stays wrong until that token refreshes — up to an hour of
someone seeing the wrong dashboard. `getCurrentUser()` reads the profile row
anyway, so reading the role from it costs nothing extra and is never stale.

## Environment

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon / publishable key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>     # server only, never NEXT_PUBLIC_
```

The service role key bypasses every policy. It is used in exactly three
places: creating an account during registration (before anyone is signed in),
changing an admin's sign-in address, and the one-off import below.

## Importing the accounts that already exist

Supabase hashes with bcrypt, which is what this project already used, so the
existing hashes transfer as-is and nobody has to reset a password.

```
npm run auth:migrate-users -- --dry-run   # says what it would do
npm run auth:migrate-users
```

Idempotent. A profile that already has an `authId` is skipped; one whose
address Supabase already knows is linked to that user rather than duplicated,
so a half-finished run is fixed by running it again.

After seeding a fresh database, run it: `prisma/seed.ts` writes profile rows
with a bcrypt hash and no `authId`, and they cannot sign in until this links
them.

## Before this goes live

**Row Level Security must be enabled first.** Shipping Supabase Auth puts the
anon key in the browser, and every table in `public` currently has RLS off
while `anon` holds full read and write grants. Until RLS is on, that key is
enough to read and change any row through the Data API — including `User`,
`Booking` and `ContactMessage`.

Two ways to close it, either is enough:

- Turn the Data API off entirely (Settings → API → Data API). Nothing in this
  project uses PostgREST, and Prisma connects straight to Postgres.
- Or `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` on every table in `public`,
  with no policies. Prisma connects as `postgres`, which has `rolbypassrls`,
  so the application is unaffected; `anon` and `authenticated` are not, and
  are locked out.

## Confirmation emails

There are none yet, so both registration and an admin's address change set
`email_confirm: true` through the service role, applying immediately. When a
confirmation flow is wired up, turn that off in
`src/app/api/auth/register/route.ts` and
`src/app/api/admin/account/route.ts` — and note that with Supabase's default
"Confirm email change" on, a plain `updateUser({ email })` only *requests* the
change, which is why the address goes through the admin client today.

## Two logins: the public site and the admin dashboard

Browser tabs share cookies, so a single login meant that signing in as a guide
in one tab replaced the admin in every other tab: the dashboard stayed on
screen, and its next Save was refused (403) because the cookie now belonged to
a guide.

The admin dashboard therefore has its own Supabase session, in its own cookie,
kept apart from the public site's (`src/lib/authRealm.ts`):

| | cookie | used by |
|---|---|---|
| public | `sb-<project>-auth-token` | travellers, guides, hotels, operators |
| admin | `dtt-admin-auth` (+ `dtt_admin_session`, see below) | `/chim` only |

- The middleware picks the login per request: `/chim/*`, `/api/admin/*`,
  `/api/auth/session`, and any `/api/*` call made from an admin page (read from
  `Referer`, hence the fixed `Referrer-Policy` in `next.config.mjs`). It passes
  the choice on in the `x-dtt-realm` header, overwriting whatever a client sent.
- `getCurrentUser()` follows it. The public site never recognises an admin and
  the admin dashboard never recognises anyone else, so an admin in one tab and
  a guide in the next are two people.
- `/api/auth/login` and `/api/auth/logout` take `{ realm: "admin" }` from the
  `/chim` form and refuse the wrong kind of account. The public login answers
  an admin's credentials with "Invalid email or password" so `/chim` is never
  hinted at.
- Admins open bookings at `/chim/bookings/:id`, not `/dashboard/bookings/:id`.

The admin login also ends when the browser closes, after 30 minutes idle and
after 12 hours (`src/lib/adminSession.ts`).
