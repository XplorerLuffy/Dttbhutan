/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdfkit loads its font-metric files from disk at runtime; bundling it
  // leaves those behind and the itinerary PDF route throws on the first
  // request in production.
  experimental: {
    serverComponentsExternalPackages: ["pdfkit"],
  },
  images: {
    remotePatterns: [
      {
        // Vercel Blob public URLs — where uploaded photos live in production.
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
