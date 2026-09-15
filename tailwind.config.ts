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
        // Bhutanese-motif palette: deep temple-maroon (brand), saffron/gold
        // (accent — prayer flags, monastic robes), and pine green (the
        // forested valleys) — standing in for the generic blue/white SaaS
        // default.
        brand: {
          50: "#fbf1f2",
          100: "#f4dde0",
          200: "#e8bcc3",
          300: "#d8919d",
          400: "#c26375",
          500: "#a53d52",
          600: "#86233a",
          700: "#6b1a2e",
          800: "#551526",
          900: "#451220",
        },
        gold: {
          50: "#fdf7ec",
          100: "#faecd0",
          200: "#f4d69f",
          300: "#ecbb69",
          400: "#e3a03f",
          500: "#d1842a",
          600: "#ac6820",
          700: "#874f1c",
          800: "#6d411c",
          900: "#5c371b",
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
