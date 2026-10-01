import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

/**
 * Decides "does this trip exist" before anything is streamed.
 *
 * The page below has its own loading.tsx skeleton, and a skeleton is a
 * Suspense boundary: Next sends the 200 and starts streaming the moment it
 * reaches one. A notFound() from inside the page then arrives too late to
 * change the status, and a mistyped or deleted trip URL rendered "not found"
 * under a 200 — a soft 404, which search engines index as a real page.
 *
 * A layout sits outside its own segment's loading boundary, so a notFound()
 * here is thrown before the first byte goes out and the response is a real
 * 404. It costs one indexed lookup; the page does its full query as before.
 */
export default async function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const trip = await prisma.itinerary.findUnique({
    where: { slug },
    select: { status: true },
  });
  if (!trip || trip.status !== "PUBLISHED") notFound();

  return children;
}
