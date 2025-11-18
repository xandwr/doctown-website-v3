import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      colors: {
        // Liminal base tones
        void: "#0a0a0a",
        concrete: "#1a1a1a",
        fog: "#2a2a2a",
        ash: "#3a3a3a",
        dust: "#4a4a4a",

        // Text colors
        whisper: "#a0a0a0",
        echo: "#707070",
        shadow: "#505050",

        // Functional accents
        decay: "#7a6b5e",
        rust: "#8a7060",
        corpse: "#6b7a7a",
        static: "#606060",

        // Strategic accent
        blood: "#6b3a3a",
      },
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
