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
        primary: "#F97316",
        "primary-dark": "#EA6C0A",
        secondary: "#1E3A5F",
        "secondary-light": "#2D5A8E",
      },
    },
  },
  plugins: [],
};

export default config;