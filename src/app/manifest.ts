import type { MetadataRoute } from "next";

/** What a phone shows when the site is added to the home screen, and the
 * name and colours browsers associate with it. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Droelma Tours & Travels",
    short_name: "DTT Bhutan",
    description: "Bhutan tour packages, treks, festival tours and custom trips.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    // The site header's navy (brand-900), so the browser chrome matches it.
    theme_color: "#0a3159",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
