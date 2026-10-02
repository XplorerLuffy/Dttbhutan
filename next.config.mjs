/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // pdfkit is loaded from node_modules at runtime rather than bundled.
    serverComponentsExternalPackages: ["pdfkit", "nodemailer"],

    // ...but that alone is not enough, and the itinerary download 500'd in
    // production with "Cannot find module .../pdfkit/js/standard-fonts/
    // Helvetica.cjs". Vercel ships a serverless function with only the files
    // its tracer can see being imported, and pdfkit reaches its font files
    // through its package "exports" map in a way the tracer does not follow —
    // the traced list for this route held three pdfkit files and none of the
    // fonts. Locally the whole of node_modules is on disk, so it worked here
    // and failed only when deployed.
    //
    // Listing them explicitly is what puts them in the bundle. Check with:
    //   .next/server/app/packages/[slug]/itinerary.pdf/route.js.nft.json
    outputFileTracingIncludes: {
      "/packages/[slug]/itinerary.pdf": [
        "./node_modules/pdfkit/js/standard-fonts/**/*",
        "./node_modules/pdfkit/js/data/**/*",
      ],
    },
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
