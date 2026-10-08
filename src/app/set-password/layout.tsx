import type { Metadata } from "next";

/** A one-time link meant for one person: never worth a search result, and it must not travel in a Referer. */
export const metadata: Metadata = {
  title: "Set your password",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
