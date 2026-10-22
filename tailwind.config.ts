import type { Config } from "tailwindcss";

// Bistro Arafat: black luxury ground, the logo's red as the only accent, warm white text.
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#0a0909", 2: "#121110", 3: "#1a1817", 4: "#24211f" },
        cream: { DEFAULT: "#f4efe8", muted: "#a39d95", dim: "#6f6a64" },
        brand: { DEFAULT: "#e21b2c", deep: "#b0101e", soft: "#ff4d5b" },
        ok: "#3fb27f",
        warn: "#e0a43b",
      },
      borderColor: { line: "rgba(244,239,232,.09)" },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        latin: ["var(--font-latin)", "serif"],
      },
      maxWidth: { site: "1200px" },
    },
  },
  plugins: [],
} satisfies Config;
