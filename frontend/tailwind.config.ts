import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ============================================
      // COLOR PALETTE
      // ============================================
      colors: {
        primary: {
          50: '#fef3e2',
          100: '#fde4b9',
          200: '#fcd48b',
          300: '#fbc35d',
          400: '#fab539',
          500: '#f9a825',
          600: '#f59121',
          700: '#ef7a1c',
          800: '#e86417',
          900: '#dd400f',
        },
        dark: {
          50: '#f7f7f8',
          100: '#eeeef0',
          200: '#d9d9de',
          300: '#b8b8c1',
          400: '#91919f',
          500: '#737384',
          600: '#5d5d6c',
          700: '#4c4c58',
          800: '#41414b',
          900: '#393941',
          950: '#1a1a1f',
        },
      },

      // ============================================
      // ANIMATION DURATION TOKENS
      // ============================================
      transitionDuration: {
        'fast': '150ms',
        'normal': '300ms',
        'slow': '500ms',
      },

      // ============================================
      // ANIMATION TIMING FUNCTIONS
      // ============================================
      transitionTimingFunction: {
        'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'ease-in-out-expo': 'cubic-bezier(0.87, 0, 0.13, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      // ============================================
      // ENHANCED BOX SHADOWS
      // ============================================
      boxShadow: {
        // Glow effects for primary color
        'glow-sm': '0 0 10px rgba(249, 168, 37, 0.15)',
        'glow-md': '0 0 20px rgba(249, 168, 37, 0.25)',
        'glow-lg': '0 0 30px rgba(249, 168, 37, 0.35)',
        'glow-primary': '0 0 25px rgba(249, 168, 37, 0.4)',

        // Card shadows
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',

        // Elevated shadows
        'elevated': '0 10px 15px -3px rgba(0, 0, 0, 0.25), 0 4px 6px -4px rgba(0, 0, 0, 0.15)',
        'elevated-lg': '0 25px 50px -12px rgba(0, 0, 0, 0.4)',

        // Inner shadow for inputs
        'inner-sm': 'inset 0 1px 2px rgba(0, 0, 0, 0.1)',
      },

      // ============================================
      // BORDER RADIUS SCALE
      // ============================================
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },

      // ============================================
      // KEYFRAME ANIMATIONS
      // ============================================
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-left': {
          '0%': { opacity: '0', transform: 'translateX(10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'fade-in-right': {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'scale-in-bounce': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '50%': { transform: 'scale(1.02)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-up': {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-1deg)' },
          '50%': { transform: 'rotate(1deg)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },

      // ============================================
      // ANIMATION UTILITIES
      // ============================================
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-in-up': 'fade-in-up 0.4s ease-out',
        'fade-in-down': 'fade-in-down 0.4s ease-out',
        'fade-in-left': 'fade-in-left 0.4s ease-out',
        'fade-in-right': 'fade-in-right 0.4s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'scale-in-bounce': 'scale-in-bounce 0.4s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-in-left': 'slide-in-left 0.3s ease-out',
        'slide-in-up': 'slide-in-up 0.3s ease-out',
        'slide-in-down': 'slide-in-down 0.3s ease-out',
        shimmer: 'shimmer 2s infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'bounce-slow': 'bounce 2s ease-in-out infinite',
        wiggle: 'wiggle 0.3s ease-in-out',
        'spin-slow': 'spin-slow 3s linear infinite',
        float: 'float 3s ease-in-out infinite',
      },

      // ============================================
      // BACKDROP BLUR
      // ============================================
      backdropBlur: {
        xs: '2px',
      },

      // ============================================
      // FONT SIZE ADJUSTMENTS
      // ============================================
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
    },
  },
  plugins: [],
};

export default config;
