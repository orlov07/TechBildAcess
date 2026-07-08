/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0b0b12',
          soft: '#12121c',
          card: '#16161f',
          elevated: '#1c1c28',
        },
        border: {
          DEFAULT: '#262636',
        },
        brand: {
          50: '#eef0ff',
          100: '#e0e3ff',
          200: '#c7ccff',
          300: '#a5a8ff',
          400: '#8b7bff',
          500: '#7c5cfc',
          600: '#6d3ff2',
          700: '#5b2fd6',
          800: '#4a29ad',
          900: '#3d2689',
        },
        accent: '#22d3ee',
        success: '#22c55e',
        danger: '#ef4444',
        warn: '#f59e0b',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(124,92,252,0.25), 0 12px 40px -12px rgba(124,92,252,0.45)',
        card: '0 8px 30px -12px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        'grid-fade':
          'radial-gradient(circle at 50% 0%, rgba(124,92,252,0.14), transparent 55%)',
      },
      borderRadius: {
        xl: '0.9rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
}
