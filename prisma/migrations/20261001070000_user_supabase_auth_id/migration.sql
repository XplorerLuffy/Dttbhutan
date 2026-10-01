-- Link each profile row to its Supabase auth user.
--
-- Nullable: the table already has rows, and they are linked by the import
-- script (prisma/migrate-users-to-supabase-auth.ts) rather than by this
-- migration, which cannot create auth users. Unique so one auth user can
-- never end up owning two profiles.
ALTER TABLE "User" ADD COLUMN "authId" UUID;

CREATE UNIQUE INDEX "User_authId_key" ON "User"("authId");
