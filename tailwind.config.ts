const defaultTheme = require("tailwindcss/defaultTheme");
const { fontFamily } = defaultTheme;

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", ...fontFamily.sans]
      },
      colors: {
        "premium-glow": "#b197fc",
        "gradient-indigo": "#7f5af0",
        "accent-amber": "#fcb045",
        "host-highlight": "#4ade80"
      },
      backgroundImage: {
        "lux-gradient":
          "radial-gradient(circle at top, rgba(127,90,240,0.35), rgba(15,23,42,0.95))",
        "glass-panel":
          "linear-gradient(135deg, rgba(15,23,42,0.85), rgba(30,41,59,0.65))"
      },
      boxShadow: {
        glow: "0 10px 40px rgba(127,90,240,0.35)",
        "card-glass": "0 20px 45px rgba(15,23,42,0.35)"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

