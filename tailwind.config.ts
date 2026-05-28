import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic tokens — driven by CSS variables so they flip with theme.
        page: "rgb(var(--page) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-2": "rgb(var(--surface-2) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        // "Tropical Luxury" palette from the product brief
        ocean: {
          50: "#eff9ff",
          100: "#def2ff",
          200: "#b6e7ff",
          300: "#75d4ff",
          400: "#2cbeff",
          500: "#02a6f5",
          600: "#0084d1",
          700: "#0069a9",
          800: "#03598b",
          900: "#094a73",
        },
        sunset: {
          400: "#ff8a4c",
          500: "#ff6b35",
          600: "#ed4f12",
        },
        sand: "#f7f1e8",
        charcoal: "#1f2630",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0) rotate(-8deg)" },
          "50%": { transform: "translateY(-10px) rotate(-2deg)" },
        },
        "bar-grow": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out both",
        "scale-in": "scale-in 0.3s ease-out both",
        float: "float 3s ease-in-out infinite",
        "bar-grow": "bar-grow 0.7s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
