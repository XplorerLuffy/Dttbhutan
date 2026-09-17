import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api",
        "/dashboard",
        "/vendor",
        "/login",
        "/register",
        // Shared live-tracking links point at a real vehicle's current
        // location. They're unguessable by design; keeping them out of search
        // results keeps them that way.
        "/track",
      ],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
