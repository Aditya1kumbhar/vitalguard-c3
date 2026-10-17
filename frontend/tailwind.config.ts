import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      opacity: {
        '3': '0.03',
        '4': '0.04',
        '5': '0.05',
        '6': '0.06',
        '8': '0.08',
      },
      colors: {
        app: "var(--bg-app)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        card: "var(--bg-card)",
        border: "var(--border-color)",
      },
    },
  },
  plugins: [],
};
export default config;
