import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import SmoothScroll from "@/components/SmoothScroll";
import PageTransition from "@/components/PageTransition";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { getCurrentRates } from "@/lib/fx";
import SiteChrome from "@/components/SiteChrome";
import AiChatWidget from "@/components/ai/AiChatWidget";
import { organizationJsonLd, siteUrl } from "@/lib/seo";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

const DESCRIPTION =
  "Book licensed tour guides, hotels, transport and flights for your Bhutan trip, with GPS-verified trip mileage and live tracking.";

export const metadata: Metadata = {
  // Makes every relative canonical/OG URL below resolve absolutely.
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Droelma Tours & Travels | Guides, Hotels, Transport & Flights",
    // Page-level titles become "About us | Droelma Tours & Travels".
    template: "%s | Droelma Tours & Travels",
  },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Droelma Tours & Travels",
    title: "Droelma Tours & Travels | Bhutan trips, properly arranged",
    description: DESCRIPTION,
    locale: "en_US",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Droelma Tours & Travels",
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const rates = await getCurrentRates();

  return (
    <html lang="en">
      <body
        className={`${display.variable} ${body.variable} min-h-screen bg-stone-50 font-sans text-stone-900 antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
        <CurrencyProvider rates={rates}>
          <SmoothScroll />
          <SiteChrome nav={<NavBar />} footer={<Footer />} chat={<AiChatWidget />}>
            <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
              <PageTransition>{children}</PageTransition>
            </main>
          </SiteChrome>
        </CurrencyProvider>
      </body>
    </html>
  );
}
