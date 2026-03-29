/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#3d4a35",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        "background-dark": "#C2CCBA",
        "background-light": "#E8EDE4",
        "stone-matte": "#D0D8CB",
        "fluid-dark": "#B0BBA8",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        "serif-exp": ["Bodoni Moda", "Playfair Display", "serif"],
        ragika: ["Ragika", "serif"],
        ciguatera: ["Ciguatera", "serif"],
        agatho: ["Agatho", "serif"],
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        morph: {
          "0%, 100%": { borderRadius: "40% 60% 70% 30% / 40% 50% 60% 50%" },
          "34%": { borderRadius: "70% 30% 50% 50% / 30% 30% 70% 70%" },
          "67%": { borderRadius: "100% 60% 60% 100% / 100% 100% 60% 60%" },
        },
        ripple: {
          "0%": { transform: "translate(0,0) rotate(0deg)" },
          "100%": { transform: "translate(20px, 20px) rotate(3deg)" },
        },
        "spin-noise": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "draw-path": {
          to: { strokeDashoffset: "0" },
        },
        "pulse-dot": {
          "0%": { strokeWidth: "0", strokeOpacity: "0.4" },
          "70%": { strokeWidth: "10px", strokeOpacity: "0" },
          "100%": { strokeWidth: "0", strokeOpacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        morph: "morph 8s ease-in-out infinite",
        ripple: "ripple 20s linear infinite",
        "spin-noise": "spin-noise 4s linear infinite",
        "draw-path": "draw-path 3s linear forwards",
        "pulse-dot": "pulse-dot 2s infinite",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
