import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'hd': '1280px',
        'fhd': '1920px',
        '2k': '2560px',
        '4k': '3840px',
      },
      colors: {
        // Warm off-white so every text-white / bg-white utility matches the terminal palette.
        white: "#E9E6DF",
        base: "#080A0D",
        surface: "#0F1317",
        primary: {
          DEFAULT: "#ECA35F",
          dim: "#D4883F",
          glow: "#F2B77D",
        },
        secondary: {
          DEFAULT: "#7FA88B",
          dim: "#6A9077",
        },
        accent: {
          DEFAULT: "#7AA5C4",
          dim: "#5B87A8",
        },
        text: {
          DEFAULT: "#E9E6DF",
          secondary: "#98A2AB",
          muted: "#7D8792", // readable on the dark background (WCAG AA)
        },
      },
      fontFamily: {
        // Font variables come from next/font in app/layout.tsx.
        sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        display: ["var(--font-mono)", "ui-monospace", "monospace"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        // Pixel font used only for the name in the hero heading.
        pixel: ["var(--font-pixel)", "var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "radial-glow":
          "radial-gradient(circle at center, rgba(236,163,95,0.18), transparent 70%)",
      },
      boxShadow: {
        glow: "0 0 40px rgba(236, 163, 95, 0.35)",
        "glow-cyan": "0 0 40px rgba(127, 168, 139, 0.3)",
        "glow-pink": "0 0 40px rgba(122, 165, 196, 0.3)",
        glass: "0 8px 32px rgba(0, 0, 0, 0.37)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 9s ease-in-out infinite",
        "spin-slow": "spin 12s linear infinite",
        glow: "glow 3s ease-in-out infinite",
        marquee: "marquee 30s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-16px)" },
        },
        glow: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
