import type { Config } from "tailwindcss";

// Tokens mirror app/globals.css CSS variables so you can use either utilities
// or the existing component classes / inline styles from the prototype.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0712", surface: "#14101f", "surface-2": "#1a1529", "surface-3": "#221b34",
        text: "#f3f1fa", "text-2": "#bcb6d2", "text-3": "#837c9c",
        violet: "#a68bff", "violet-deep": "#7c5cff", gold: "#d8d8ea",
        "g-mtg": "#f0a35e", "g-poke": "#ffd23f", "g-op": "#ff5d5d",
      },
      fontFamily: {
        title: ["Cinzel", "Georgia", "serif"],
        display: ["Space Grotesk", "system-ui", "sans-serif"],
        body: ["Manrope", "system-ui", "sans-serif"],
      },
      borderRadius: { sm: "8px", DEFAULT: "14px", lg: "20px", xl: "28px" },
    },
  },
  plugins: [],
};
export default config;
