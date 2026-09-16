import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Droelma Tours & Travels brand palette, matched to the logo: a
        // strong royal blue (brand) with a gold/orange flame-petal accent
        // (gold), plus pine green kept as a UI-only success/positive
        // semantic color (unrelated to brand identity).
        brand: {
          50: "#f0f7fd",
          100: "#dcebf9",
          200: "#b6d5f0",
          300: "#82b6e6",
          400: "#4a92d6",
          500: "#1c72c4",
          600: "#0b5ea8",
          700: "#094a86",
          800: "#0a3c6b",
          900: "#0a3159",
          950: "#071f38",
        },
        gold: {
          50: "#fef8ec",
          100: "#fcecc9",
          200: "#f9d68e",
          300: "#f5b94f",
          400: "#f2a227",
          500: "#e8871a",
          600: "#c96914",
          700: "#a54f15",
          800: "#864017",
          900: "#6f3517",
        },
        pine: {
          50: "#eff8f3",
          100: "#d1ecdd",
          200: "#a4d9bd",
          300: "#74c19b",
          400: "#47a578",
          500: "#298257",
          600: "#1c6741",
          700: "#175136",
          800: "#123f2a",
          900: "#0e3020",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-body)"],
      },
    },
  },
  plugins: [],
};
export default config;
