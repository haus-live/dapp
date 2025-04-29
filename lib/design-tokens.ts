/**
 * Design Tokens
 * 
 * This file contains all the design tokens used throughout the application.
 * Using this ensures consistency across the UI.
 */

// Color palette
export const colors = {
  // Brand colors
  primary: {
    50: 'hsl(350, 100%, 95%)',
    100: 'hsl(350, 100%, 90%)',
    200: 'hsl(350, 100%, 80%)',
    300: 'hsl(350, 100%, 70%)',
    400: 'hsl(350, 100%, 60%)',
    500: 'hsl(350, 100%, 50%)', // Main brand color: HAUS red
    600: 'hsl(350, 100%, 45%)',
    700: 'hsl(350, 100%, 40%)',
    800: 'hsl(350, 100%, 35%)',
    900: 'hsl(350, 100%, 30%)',
    950: 'hsl(350, 100%, 20%)',
  },
  // Status colors - consistent with our EventCard status colors
  status: {
    live: {
      bg: 'bg-red-500/20',
      text: 'text-red-500',
      border: 'border-red-500/50'
    },
    upcoming: {
      bg: 'bg-blue-500/20',
      text: 'text-blue-500',
      border: 'border-blue-500/50'
    },
    completed: {
      bg: 'bg-green-500/20',
      text: 'text-green-500',
      border: 'border-green-500/50'
    },
    created: {
      bg: 'bg-amber-500/20',
      text: 'text-amber-500',
      border: 'border-amber-500/50'
    },
    finalized: {
      bg: 'bg-purple-500/20',
      text: 'text-purple-500',
      border: 'border-purple-500/50'
    }
  }
}

// Spacing scale - used for margin, padding, gap, etc.
export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
}

// Border radius
export const borderRadius = {
  none: '0',
  sm: '0.125rem',
  default: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
}

// Typography
export const typography = {
  fontFamily: {
    // Font stacks for consistent typography
    sans: 'var(--font-sans)',
    mono: 'var(--font-mono)',
    // Special branded font for headers
    bauhaus: 'var(--font-bauhaus)',
  },
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1' }],
    '6xl': ['3.75rem', { lineHeight: '1' }],
    '7xl': ['4.5rem', { lineHeight: '1' }],
    '8xl': ['6rem', { lineHeight: '1' }],
    '9xl': ['8rem', { lineHeight: '1' }],
  },
}

// Animations and transitions
export const animations = {
  transition: {
    fast: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    default: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  keyframes: {
    shimmer: {
      '0%': { backgroundPosition: '-200% 0' },
      '100%': { backgroundPosition: '200% 0' },
    },
    fadeIn: {
      from: { opacity: '0' },
      to: { opacity: '1' },
    },
    fadeOut: {
      from: { opacity: '1' },
      to: { opacity: '0' },
    },
  }
}

// Z-index scale
export const zIndex = {
  0: '0',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',
  auto: 'auto',
  dropdown: '1000',
  modal: '1300',
  tooltip: '1400',
}

// Media queries for responsiveness
export const screens = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
}

// Common elevated shadows
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',
} 