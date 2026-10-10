import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import SmoothScroll from "@/components/SmoothScroll";
import ViewportInset from "@/components/ViewportInset";
import PageTransition from "@/components/PageTransition";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { getCurrentRates } from "@/lib/fx";
import SiteChrome from "@/components/SiteChrome";
import AiChatWidget from "@/components/ai/AiChatWidget";
import JsonLd from "@/components/JsonLd";
import { organizationJsonLd, siteUrl, SITE_DESCRIPTION, websiteJsonLd } from "@/lib/seo";
import { getCompany, getSiteContent } from "@/lib/content";

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

const baseMetadata: Metadata = {
  // Makes every relative canonical/OG URL below resolve absolutely.
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Bhutan Tour Packages & Travel Agency | Droelma Tours & Travels",
    // Page-level titles become "About us | Droelma Tours & Travels".
    template: "%s | Droelma Tours & Travels",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Droelma Tours & Travels",
  // Ignored by Google, still read by some other engines and directories.
  keywords: [
    "Bhutan tour packages",
    "Bhutan tours",
    "Bhutan travel agency",
    "Bhutan tour operator",
    "Bhutan trekking",
    "Bhutan festival tours",
    "Bhutan travel",
    "DTT Bhutan",
    "Droelma Tours and Travels",
  ],
  category: "travel",
  // No site-wide canonical here: a child page that forgot its own would
  // inherit "/" and tell search engines it is a duplicate of the home page.
  // Each page declares its own; the home page's is in app/page.tsx.
  openGraph: {
    type: "website",
    siteName: "Droelma Tours & Travels",
    title: "Droelma Tours & Travels | Bhutan Tour Packages & Custom Trips",
    description: SITE_DESCRIPTION,
    locale: "en_US",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Droelma Tours & Travels | Bhutan Tour Packages & Custom Trips",
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    // Allow full-size image previews and unlimited snippets in results —
    // Google's default is more conservative without these.
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

/** The base metadata plus the Search Console / Bing codes saved in the SEO dashboard. */
export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent();
  const google = content("seo.googleVerification").trim();
  const bing = content("seo.bingVerification").trim();
  if (!google && !bing) return baseMetadata;
  return {
    ...baseMetadata,
    verification: {
      ...(google ? { google } : {}),
      ...(bing ? { other: { "msvalidate.01": bing } } : {}),
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [rates, company, content] = await Promise.all([
    getCurrentRates(),
    getCompany(),
    getSiteContent(),
  ]);

  return (
    <html lang="en">
      <body
        className={`${display.variable} ${body.variable} min-h-screen bg-stone-50 font-sans text-stone-900 antialiased`}
      >
        <JsonLd data={[organizationJsonLd(company), websiteJsonLd(company)]} />
        <CurrencyProvider rates={rates}>
          <SmoothScroll />
          <ViewportInset />
          <SiteChrome nav={<NavBar />} footer={<Footer />} chat={
              <AiChatWidget
                copy={{
                  name: content("assistant.name"),
                  role: content("assistant.role"),
                  greeting: content("assistant.greeting"),
                  placeholder: content("assistant.placeholder"),
                  questions: content("assistant.questions")
                    .split("\n")
                    .map((q) => q.trim())
                    .filter(Boolean),
                }}
              />
            }>
            <PageTransition>{children}</PageTransition>
          </SiteChrome>
        </CurrencyProvider>
      </body>
    </html>
  );
}
