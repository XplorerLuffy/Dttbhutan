import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Dtt Bhutan | Guides, Hotels & Transport",
  description:
    "Book tour guides, hotels, and transport for your Bhutan trip, with GPS-verified trip mileage and live tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">
        <NavBar />
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
