#!/usr/bin/env bash
# Copies the live database (public data + Supabase login accounts) into a new
# Supabase project. Run it on your own computer — it needs both passwords.
#
#   OLD_DB="postgresql://..."  NEW_DB="postgresql://..."  bash scripts/migrate-db.sh
#
# Use each project's *Session pooler* connection string (port 5432). Nothing is
# changed in the old database; it is only read. See docs/migrate-database.md.
set -euo pipefail

: "${OLD_DB:?Set OLD_DB to the current database connection string}"
: "${NEW_DB:?Set NEW_DB to the new database connection string}"
command -v pg_dump >/dev/null || { echo "Install the PostgreSQL client tools (pg_dump, pg_restore, psql) first."; exit 1; }

work="$(mktemp -d)"
echo "Working in $work"

echo "1/5  Reading the app data from the old database..."
pg_dump "$OLD_DB" --schema=public --no-owner --no-privileges --format=custom -f "$work/public.dump"

echo "2/5  Reading the login accounts from the old database..."
pg_dump "$OLD_DB" --data-only --no-owner --no-privileges \
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
q="select 'auth.users', count(*) from auth.users
   union all select 'User', count(*) from public.\"User\"
   union all select 'Booking', count(*) from public.\"Booking\"
   union all select 'Itinerary', count(*) from public.\"Itinerary\"
   union all select 'ContactMessage', count(*) from public.\"ContactMessage\"
   union all select 'SiteContent', count(*) from public.\"SiteContent\"
   union all select 'migrations', count(*) from public._prisma_migrations
   order by 1"
echo "--- OLD ---"; psql "$OLD_DB" -At -F '  ' -c "$q"
echo "--- NEW ---"; psql "$NEW_DB" -At -F '  ' -c "$q"
echo "If every number matches, the copy is good. Keep the old database untouched for a couple of weeks."
