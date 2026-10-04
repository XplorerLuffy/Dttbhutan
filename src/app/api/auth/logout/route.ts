import { NextRequest, NextResponse } from "next/server";
import { signOut } from "@/lib/auth";
import { isSupabaseAuthConfigured } from "@/lib/supabase/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/adminSession";

/**
 * Logging out must never fail.
 *
 * It 500'd whenever Supabase was not configured, and would have whenever
 * Supabase was slow or down — leaving someone on a shared computer unable to
 * end their session. So the Supabase call is best-effort, and the response
 * clears the session cookies itself regardless of how that call went: a
 * browser that holds no session cookie is logged out, whatever the server
 * thinks.
 *
 * It also clears `dtt_session`, the cookie from before Supabase Auth, which
 * would otherwise linger in browsers for up to fourteen days doing nothing.
 */
export async function POST(req: NextRequest) {
  if (isSupabaseAuthConfigured()) {
    try {
      await signOut();
    } catch (err) {
      console.error("[logout] Supabase signOut failed; clearing cookies anyway:", err);
    }
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  for (const { name } of req.cookies.getAll()) {
    // Supabase's cookies are sb-<project-ref>-auth-token, split into .0, .1…
    // chunks when the token is large.
    if (name === "dtt_session" || (name.startsWith("sb-") && name.includes("-auth-token"))) {
      res.cookies.set(name, "", { path: "/", maxAge: 0 });
    }
  }
  return res;
}
