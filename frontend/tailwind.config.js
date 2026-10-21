/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Dark base surfaces
        base: {
          950: '#0a0d14',
          900: '#0f131c',
          850: '#131825',
          800: '#181f2f',
          750: '#1d2638',
          700: '#232d42',
          650: '#2a3550',
          600: '#324063',
        },
        // Primary — teal/cyan for AI/tech feel
        primary: {
          50: '#ecfdf8',
          100: '#d0fbe9',
          200: '#a4f5d4',
          300: '#6ceaba',
          400: '#34d99c',
          500: '#14b87e',
          600: '#0d9466',
          700: '#0c7553',
          800: '#0d5d45',
          900: '#0b4d3a',
        },
        // Accent — amber for highlights
        accent: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        success: {
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
        },
        error: {
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        },
        info: {
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': '0.6875rem',
      },
      borderRadius: {
        'xl': '0.875rem',
        '2xl': '1.125rem',
      },
      boxShadow: {
        'glow': '0 0 24px -4px rgba(20, 184, 126, 0.25)',
        'glow-lg': '0 0 40px -8px rgba(20, 184, 126, 0.30)',
        'card': '0 2px 8px -2px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 8px 24px -4px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 2s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-12px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
