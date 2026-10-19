#!/usr/bin/env bash
# Copies the live data and the Supabase login accounts into a new Supabase
# project. Run it on your own computer — it needs the passwords.
#
#   OLD_DB="postgresql://..." AUTH_DB="postgresql://..." NEW_DB="postgresql://..." \
#     bash scripts/migrate-db.sh
#
# OLD_DB  = the database the app's data lives in (Vercel's DATABASE_URL).
# AUTH_DB = the Supabase project the site's LOGINS live in (the project named in
#           NEXT_PUBLIC_SUPABASE_URL). It can be a different project from OLD_DB.
#           Leave it out only if both are the same project.
# NEW_DB  = the new, empty database.
#
# Use each project's *Session pooler* connection string (port 5432). Nothing is
# changed in the old projects; they are only read. See docs/migrate-database.md.
set -euo pipefail

: "${OLD_DB:?Set OLD_DB to the current data database connection string}"
: "${NEW_DB:?Set NEW_DB to the new database connection string}"
AUTH_DB="${AUTH_DB:-$OLD_DB}"
command -v pg_dump >/dev/null || { echo "Install the PostgreSQL client tools (pg_dump, pg_restore, psql) first."; exit 1; }

work="$(mktemp -d)"
echo "Working in $work"

echo "1/5  Reading the app data..."
pg_dump "$OLD_DB" --schema=public --no-owner --no-privileges --format=custom -f "$work/public.dump"

echo "2/5  Reading the login accounts..."
pg_dump "$AUTH_DB" --data-only --no-owner --no-privileges \
  --table=auth.users --table=auth.identities -f "$work/auth.sql"

echo "3/5  The new database must be empty. Checking..."
tables=$(psql "$NEW_DB" -Atc "select count(*) from information_schema.tables where table_schema='public'")
if [ "$tables" != "0" ]; then
  echo "The new database already has $tables tables in 'public'. Stop here and ask for help rather than overwrite anything."
  exit 1
fi

echo "4/5  Writing into the new database..."
psql "$NEW_DB" -v ON_ERROR_STOP=1 -q -c "set session_replication_role = replica;" -f "$work/auth.sql"
pg_restore --no-owner --no-privileges --schema=public --exit-on-error -d "$NEW_DB" "$work/public.dump"

echo "5/5  Comparing row counts (old vs new)..."
qa="select 'auth.users', count(*) from auth.users"
q="select 'User', count(*) from public.\"User\"
   union all select 'Booking', count(*) from public.\"Booking\"
   union all select 'Itinerary', count(*) from public.\"Itinerary\"
   union all select 'ContactMessage', count(*) from public.\"ContactMessage\"
   union all select 'SiteContent', count(*) from public.\"SiteContent\"
   union all select 'migrations', count(*) from public._prisma_migrations
   order by 1"
echo "--- OLD ---"
psql "$AUTH_DB" -At -F '  ' -c "$qa"
psql "$OLD_DB" -At -F '  ' -c "$q"
echo "--- NEW ---"
psql "$NEW_DB" -At -F '  ' -c "$qa"
psql "$NEW_DB" -At -F '  ' -c "$q"
echo "If every number matches, the copy is good. Keep the old projects untouched for a couple of weeks."
