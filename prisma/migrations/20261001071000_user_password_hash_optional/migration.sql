-- Supabase Auth owns passwords now, so a profile row no longer needs a hash.
-- Existing hashes are kept so the import script can hand them to Supabase and
-- nobody is forced to reset their password.
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;
