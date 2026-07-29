import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/content/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "var(--color-primary)",
          "primary-dark": "var(--color-primary-dark)",
          secondary: "var(--color-secondary)",
          accent: "var(--color-accent)",
          surface: "var(--color-surface)",
          ink: "var(--color-ink)",
        },
      },
      fontFamily: {
        body: "var(--font-body)",
        display: "var(--font-display)",
      },
      boxShadow: {
        soft: "0 16px 40px rgb(41 35 31 / 0.10)",
      },
      container: {
        center: true,
        padding: {
          DEFAULT: "1rem",
          sm: "2rem",
          lg: "4rem",
          xl: "5rem",
        },
        screens: {
          xl: "1200px",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
