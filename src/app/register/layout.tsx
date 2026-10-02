import type { Metadata } from "next";

/** The page is a client component, so its metadata lives here. Never worth a search result — robots.txt already asks crawlers to stay out; noindex covers links from elsewhere. */
export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
