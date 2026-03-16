import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
        display: ["var(--font-syne)", "sans-serif"],
      },
      colors: {
        // Spectre brand palette — deep obsidian base, violet accent, threat-grade reds
        obsidian: {
          950: "#060608",
          900: "#0d0d12",
          800: "#13131a",
          700: "#1a1a24",
          600: "#22222f",
          500: "#2e2e3f",
          400: "#3d3d54",
        },
        violet: {
          DEFAULT: "#7c3aed",
          dim: "#5b21b6",
          bright: "#8b5cf6",
          glow: "#a78bfa",
        },
        threat: {
          critical: "#ef4444",
          high: "#f97316",
          medium: "#f59e0b",
          low: "#22c55e",
        },
        grade: {
          A: "#22c55e",
          B: "#84cc16",
          C: "#f59e0b",
          D: "#f97316",
          F: "#ef4444",
        },
      },
      backgroundImage: {
        "grid-obsidian":
          "linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "32px 32px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.25s ease-out",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      boxShadow: {
        violet: "0 0 0 1px rgba(124,58,237,0.4), 0 0 16px rgba(124,58,237,0.15)",
        "violet-sm": "0 0 0 1px rgba(124,58,237,0.3)",
        threat: "0 0 0 1px rgba(239,68,68,0.4), 0 0 12px rgba(239,68,68,0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
