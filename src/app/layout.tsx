import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import SmoothScroll from "@/components/SmoothScroll";
import PageTransition from "@/components/PageTransition";
import { CurrencyProvider } from "@/components/CurrencyProvider";

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

export const metadata: Metadata = {
  title: "Droelma Tours & Travels | Guides, Hotels, Transport & Flights",
  description:
    "Book tour guides, hotels, transport, and flights for your Bhutan trip, with GPS-verified trip mileage and live tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${body.variable} min-h-screen bg-stone-50 font-sans text-stone-900 antialiased`}
      >
        <CurrencyProvider>
          <SmoothScroll />
          <NavBar />
          <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer />
        </CurrencyProvider>
      </body>
    </html>
  );
}
