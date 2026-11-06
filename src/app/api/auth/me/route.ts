import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

/**
 * "Who is signed in on the public site?" — asked by the header, so it can show
 * the visitor's account instead of always saying "Log in" (public pages are
 * cached and shared, so the server cannot put this in the page itself).
 *
 * Answers only about the caller's own session, and 200 either way: being
 * signed out is a normal answer, not an error to log in the browser console.
 * (/api/auth/session is the admin dashboard's equivalent.)
 */
export async function GET() {
  const user = await getCurrentUser();
  const res = user
    ? NextResponse.json({
        signedIn: true,
        name: user.name,
        email: user.email,
        role: user.role,
        dashboardPath: dashboardPathForRole(user.role),
      })
    : NextResponse.json({ signedIn: false });
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}
