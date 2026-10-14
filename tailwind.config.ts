import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        blue: "#7dd3fc",
        "blue-dim": "rgba(125,211,252,0.65)",
        base: "#060a12",
      },
      fontFamily: {
        display: ["Bricolage Grotesque", "sans-serif"],
        sans: ["DM Sans", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["JetBrains Mono", "SF Mono", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
