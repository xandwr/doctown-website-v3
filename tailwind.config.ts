import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      // In Tailwind v4, colors are defined in @theme in app.css
      borderRadius: {
        DEFAULT: "2px", // Minimal, institutional corners
      },
      fontFamily: {
        mono: [
          "ui-monospace",
          "Cascadia Code",
          "Source Code Pro",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
    },
  },
} satisfies Config;
