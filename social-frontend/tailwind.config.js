/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8B5CF6', // Violet 500
          dark: '#7C3AED',    // Violet 600
          light: '#A78BFA',   // Violet 400
        },
        secondary: {
          DEFAULT: '#3B82F6', // Blue 500
          dark: '#2563EB',    // Blue 600
          light: '#60A5FA',   // Blue 400
        },
        accent: {
          DEFAULT: '#EC4899', // Pink 500
          dark: '#DB2777',    // Pink 600
          light: '#F472B6',   // Pink 400
        },
        gray: {
          50: '#F8FAFC',    // Slate 50
          100: '#F1F5F9',   // Slate 100
          200: '#E2E8F0',   // Slate 200
          300: '#CBD5E1',   // Slate 300
          400: '#94A3B8',   // Slate 400
          500: '#64748B',   // Slate 500
          600: '#475569',   // Slate 600
          700: '#334155',   // Slate 700
          800: '#1E293B',   // Slate 800
          900: '#0F172A',   // Slate 900
        },
        brand: {
          bg: '#F3E8FF', // Light purple background
          'bg-dark': '#1D1B20',
        }
      },
      spacing: {
        '1/2': '0.125rem',
        '1': '0.25rem',
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
        '5': '1.25rem',
        '6': '1.5rem',
        '8': '2rem',
        '10': '2.5rem',
        '12': '3rem',
        '16': '4rem',
        '20': '5rem',
        '24': '6rem',
        '32': '8rem',
        '40': '10rem',
        '48': '12rem',
        '56': '14rem',
        '64': '16rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'outline': '0 0 0 3px rgba(66, 153, 225, 0.5)',
        'none': 'none',
      },
    },
  },
  plugins: [],
}
