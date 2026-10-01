import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

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

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(requiredEnv("NEXT_PUBLIC_SUPABASE_URL"), requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet) {
        try {
          for (const { name, value, options } of toSet) {
            cookieStore.set(name, value, options);
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
