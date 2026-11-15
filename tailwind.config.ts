import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-vazirmatn)", "sans-serif"],
      },
      colors: {
        canvas: "#F8FAFC",
        primary: {
          DEFAULT: "#059669",
          hover: "#047857",
          soft: "#ECFDF5",
        },
        secondary: {
          DEFAULT: "#4F46E5",
          soft: "#EEF2FF",
        },
        finance: {
          credit: {
            text: "#059669",
            bg: "#ECFDF5",
            border: "#A7F3D0",
          },
          debt: {
            text: "#DC2626",
            bg: "#FEF2F2",
            border: "#FECACA",
          },
          warning: {
            text: "#D97706",
            bg: "#FFFBEB",
            border: "#FDE68A",
          },
        },
        typography: {
          primary: "#0F172A",
          secondary: "#475569",
          muted: "#94A3B8",
        },
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      },
      borderRadius: {
        card: "16px",
        ui: "12px",
      },
      keyframes: {
        floatSlow: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseRing: {
          "0%": { transform: "scale(0.95)", opacity: "1" },
          "50%": { transform: "scale(1.1)", opacity: "0.6" },
          "100%": { transform: "scale(0.95)", opacity: "1" },
        },
      },
      animation: {
        float: "floatSlow 4s ease-in-out infinite",
        shimmer: "shimmer 2.5s infinite linear",
        "pulse-ring": "pulseRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
