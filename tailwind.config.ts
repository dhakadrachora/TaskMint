import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        emerald: {
          500: "#10B981",
          600: "#059669",
        },
        amber: {
          500: "#F59E0B",
          600: "#D97706",
        },
      },
    },
  },
  plugins: [],
};
export default config;
