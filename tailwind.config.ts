import type { Config } from "tailwindcss"
import { screens } from "./lib/design-tokens"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  future: {
    hoverOnlyWhenSupported: true, // Better performance on mobile
  },
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        xs: "475px",
        sm: screens.sm,
        md: screens.md,
        lg: screens.lg,
        xl: screens.xl,
        "2xl": screens["2xl"],
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        heading: ["var(--font-heading)"],
        bauhaus: ["var(--font-bauhaus)"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: "hsl(350, 100%, 95%)",
          100: "hsl(350, 100%, 90%)",
          200: "hsl(350, 100%, 80%)",
          300: "hsl(350, 100%, 70%)",
          400: "hsl(350, 100%, 60%)",
          500: "hsl(350, 100%, 50%)",
          600: "hsl(350, 100%, 45%)",
          700: "hsl(350, 100%, 40%)",
          800: "hsl(350, 100%, 35%)",
          900: "hsl(350, 100%, 30%)",
          950: "hsl(350, 100%, 20%)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
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
        haus: {
          red: "#FF3B30",
          black: "#000000",
          white: "#FFFFFF",
          gray: "#F5F5F5",
        },
        status: {
          live: {
            bg: "bg-red-500/20",
            text: "text-red-500",
            border: "border-red-500/50",
          },
          upcoming: {
            bg: "bg-blue-500/20",
            text: "text-blue-500",
            border: "border-blue-500/50",
          },
          completed: {
            bg: "bg-green-500/20",
            text: "text-green-500",
            border: "border-green-500/50",
          },
          created: {
            bg: "bg-amber-500/20",
            text: "text-amber-500",
            border: "border-amber-500/50",
          },
          finalized: {
            bg: "bg-purple-500/20",
            text: "text-purple-500",
            border: "border-purple-500/50",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        fadeOut: {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "shimmer": "shimmer 2s linear infinite",
        "fade-in": "fadeIn 0.3s ease-in-out",
        "fade-out": "fadeOut 0.3s ease-in-out",
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      transitionTimingFunction: {
        'in-expo': 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
        'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
      },
      transitionDuration: {
        '0': '0ms',
        '400': '400ms',
        '600': '600ms',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
