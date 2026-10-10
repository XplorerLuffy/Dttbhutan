/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Keep a visited page's data for 30 seconds so going back and forth
    // between admin pages is instant. Saving always refreshes it (the forms
    // call router.refresh()), so an admin never sees their own change stale.
    staleTimes: { dynamic: 30, static: 180 },

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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Fixed rather than left to each browser's default: the app reads
          // which page made an API call from the Referer header to pick the
          // admin's login or the public site's (src/lib/authRealm.ts), and a
          // policy that dropped the path would make admin uploads fail.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
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
