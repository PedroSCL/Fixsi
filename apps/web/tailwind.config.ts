import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#F97316", dark: "#EA580C", soft: "#FFF1E8" },
        ink: "#17233B",
        muted: "#667085",
        line: "#E7E2DA",
        accent: "#FFB15A",
      },
    },
  },
  plugins: [],
};
export default config;
