import type { Metadata } from "next";

/** Signed-in vendor pages: private, and noindex in case a link to one is ever shared publicly. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
