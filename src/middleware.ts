import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Refreshes the Supabase session on every request.
 *
 * Access tokens are short-lived and the refresh has to happen somewhere that
 * can set cookies. A server component cannot, so without this the session
 * would expire mid-visit and a signed-in person would be bounced to the login
 * page for no reason they could see.
 *
 * It does not guard anything. Authorization stays where it was — each page
 * calls getCurrentUser() and checks the role itself — because that check needs
 * the profile row and its role, which lives in the application's own database
 * rather than in the token.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  // Unconfigured (a developer who has not set the keys yet) must not take the
  // whole site down with a 500 on every route.
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(toSet) {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
      },
    },
  });

  // getClaims() verifies the JWT locally against the project's published keys
  // and refreshes it when it is close to expiry. It is the call that makes the
  // cookie-writing above happen; without it the middleware is a no-op.
  await supabase.auth.getClaims();

  return response;
}

export const config = {
  matcher: [
    // Everything except Next's own assets and image files — those never carry
    // a session and refreshing on each one would multiply the auth traffic.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)",
  ],
};
