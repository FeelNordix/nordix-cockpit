import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-axiforma)", "Inter", "Arial", "sans-serif"],
        display: ["var(--font-axiforma)", "Inter", "Arial", "sans-serif"]
      },
      colors: {
        nordix: {
          ink: "#00263a",
          pine: "#c5003e",
          fjord: "#7d8d96",
          snow: "#f6f4f1",
          mist: "#e4ddd7"
        }
      }
    }
  },
  plugins: []
};

export default config;
