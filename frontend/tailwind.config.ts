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
        brand: {
          50:  "#f0f4ff",
          100: "#e0e9ff",
          200: "#c0d2ff",
          300: "#93b0ff",
          400: "#6085ff",
          500: "#3b5bfc",
          600: "#2a3ef1",
          700: "#1f2dde",
          800: "#1b25b4",
          900: "#1a258e",
          950: "#111654",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      boxShadow: {
        "soft": "0 2px 8px 0 rgba(0,0,0,0.06)",
        "card": "0 4px 24px 0 rgba(0,0,0,0.08)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.15s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
