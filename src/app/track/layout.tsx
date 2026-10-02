import type { Metadata } from "next";

/** A tracking link shows a vehicle's live position to whoever holds it; it must never surface in a search index. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
