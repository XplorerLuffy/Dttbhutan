import "server-only";
import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { REALM_HEADER, supabaseCookieOptions, type Realm } from "@/lib/authRealm";
import { asBrowserSessionCookie } from "@/lib/adminSession";

/**
 * The Supabase client for server components, route handlers and actions.
 *
 * Reads and writes the auth cookies through Next's own cookie store, which is
 * what keeps a signed-in session visible to every server render without the
 * page having to pass it down.
 *
 * It uses the publishable (anon) key, so it can do only what an anonymous
 * visitor may do plus whatever the signed-in user's own token allows — never
 * more. Anything that acts on another account goes through
 * `src/lib/supabase/admin.ts` instead.
 */
/** Whether the project is configured at all. Lets callers that can degrade
 * gracefully — chiefly getCurrentUser — do so instead of throwing. */
export function isSupabaseAuthConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  );
}

/** Which login this request uses — set by the middleware, see authRealm.ts. */
export async function currentRealm(): Promise<Realm> {
  return (await headers()).get(REALM_HEADER) === "admin" ? "admin" : "public";
}

export async function createSupabaseServerClient(realm?: Realm) {
  const cookieStore = await cookies();
  const which = realm ?? (await currentRealm());

  return createServerClient(requiredEnv("NEXT_PUBLIC_SUPABASE_URL"), requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    ...supabaseCookieOptions(which),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet) {
        try {
          for (const { name, value, options } of toSet) {
            // The admin's login ends with the browser, however it is renewed.
            cookieStore.set(name, value, which === "admin" ? asBrowserSessionCookie(options) : options);
          }
        } catch {
          // Thrown when called from a server *component*, which may not set
          // cookies. Harmless: the middleware refreshes the session on every
          // request, so the cookie this call would have written is written
          // there instead.
        }
      },
    },
  });
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `${name} is not set. Supabase Auth needs it — see docs/supabase-auth.md for where to find it.`
    );
  }
  return value;
}
