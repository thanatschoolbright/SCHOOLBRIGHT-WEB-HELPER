import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", // ตรวจสอบว่าพาธนี้ยังคงถูกต้อง
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-google-sans)", "Google Sans", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 10s infinite",
      },
      transitionProperty: {
        colors: "background-color, border-color, color, fill, stroke",
      },
    },
  },
  plugins: [],
};

export default config;
