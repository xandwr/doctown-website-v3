import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      // In Tailwind v4, colors are defined in @theme in app.css
      borderRadius: {
        DEFAULT: "2px", // Minimal, institutional corners
        sm: "4px", // Small roundedness - buttons, badges, small elements
        md: "8px", // Medium roundedness - cards, inputs, modals
        lg: "12px", // Large roundedness - major containers, panels
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
