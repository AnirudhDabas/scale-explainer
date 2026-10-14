import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { teal: "rgb(110,210,200)" },
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
