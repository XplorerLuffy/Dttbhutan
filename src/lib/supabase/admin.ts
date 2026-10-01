import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * The service-role client: Supabase's admin API.
 *
 * This key bypasses every policy and can read, change or delete any account,
 * so it must never reach the browser. It is used for exactly the things a
 * user cannot do to their own session — creating an account during
 * registration before anyone is signed in, importing the existing users, and
 * deleting an account's auth record when the profile goes.
 *
 * `persistSession: false` because there is no session here to persist; this
 * client acts as the service, not as a person.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must both be set for admin auth operations."
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
