# Move the database to a new Supabase project (Mumbai)

Why: the site's functions and database should be in the same region, close to
Bhutan. New project: **Droelma** (`vzgulhstiipwndfiihxk`, Mumbai / ap-south-1).

Plan: copy the data → check it → switch the site to the new database → check
again → keep the old one for two weeks. Nothing in the old database is changed.

## Before you start
- A quiet moment (about 20 minutes). Don't edit content or take bookings while copying.
- PostgreSQL client tools on your computer (`pg_dump`, `pg_restore`, `psql`), version 15 or newer.
- Two connection strings, each from Supabase → project → **Connect** → **Session pooler** (port 5432):
  - **OLD**: the one the live site uses — Vercel → Settings → Environment Variables → `DATABASE_URL` (use the `DIRECT_URL` value if it is a session pooler string).
  - **NEW**: the Droelma project. Replace `[YOUR-PASSWORD]` with its database password (Project Settings → Database → Reset password if you don't have it).

## 1. Copy the data
```bash
OLD_DB="postgresql://…old…" NEW_DB="postgresql://…new…" bash scripts/migrate-db.sh
```
It refuses to run if the new database isn't empty, and prints row counts for old
and new at the end. Every number must match.

## 2. Settings that are NOT copied (set these in the new project)
Supabase → **Authentication**:
- **URL Configuration**: Site URL `https://dttbhutan.com`; add `https://www.dttbhutan.com` and `https://dttbhutan.com/**` to Redirect URLs.
- **Sign In / Providers → Email**: match the old project ("Confirm email" on/off).
- **Emails / SMTP**: match the old project's custom SMTP and templates, if any.

## 3. Switch the site (Vercel → Settings → Environment Variables, Production)
| Variable | New value |
|---|---|
| `DATABASE_URL` | new project's **Transaction pooler** string (port 6543), add `?pgbouncer=true` as before |
| `DIRECT_URL` | new project's **Session pooler** string (port 5432) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://vzgulhstiipwndfiihxk.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | new project's anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | new project's service-role key (keep it secret) |

Then tell Claude: it sets the functions to Mumbai (`bom1` in `vercel.json`) and
pushes, which redeploys. (Do this at the same time — functions and database
should move together.)

## 4. Check
- Home page, a package page and the admin dashboard load.
- Log in as admin, as a traveller and as a vendor.
- The Enquiries page shows the same messages; send one test enquiry.
- Photos still show (they are stored in Vercel Blob, not Supabase, so nothing to move).

## 5. Afterwards
Keep the old database for two weeks, then pause it. If anything is wrong, put the
old `DATABASE_URL`, `DIRECT_URL` and Supabase keys back in Vercel and redeploy — the
old database was never changed.
