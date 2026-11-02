/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#07070A',
          900: '#0B0B0F',
          850: '#101015',
          800: '#14141B',
          700: '#1D1D26',
          600: '#2A2A36',
          500: '#3B3B4A',
        },
        brand: {
          50: '#FFF1F2',
          100: '#FFE0E3',
          300: '#FF8A94',
          400: '#F65A68',
          500: '#E11D2E',
          600: '#C4122A',
          700: '#9E0E22',
        },
        gold: {
          DEFAULT: '#E5A93C',
          300: '#FDE047',
          400: '#FACC15',
          500: '#E5A93C',
          600: '#D97706',
          700: '#B45309',
        },
        smoke: '#A1A1AD',
        cinema: {
          gold: '#E5A93C',
          amber: '#F59E0B',
          ruby: '#E50914',
          velvet: '#140D10',
          noir: '#070709',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Outfit', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        marquee: ['Cinzel', 'Outfit', 'serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(225,29,46,0.35), 0 18px 50px -18px rgba(225,29,46,0.55)',
        gold: '0 0 0 1px rgba(229,169,60,0.35), 0 18px 50px -18px rgba(229,169,60,0.45)',
        cinema: '0 25px 60px -15px rgba(0,0,0,0.95), 0 0 45px rgba(229,9,20,0.2)',
        card: '0 22px 50px -24px rgba(0,0,0,0.9)',
        panel: '0 30px 80px -40px rgba(0,0,0,0.95)',
      },
      aspectRatio: {
        poster: '2 / 3',
        backdrop: '16 / 9',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-700px 0' },
          '100%': { backgroundPosition: '700px 0' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.55s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.4s ease-out both',
        shimmer: 'shimmer 1.6s linear infinite',
        'pulse-slow': 'pulse-slow 2.4s ease-in-out infinite',
        'slide-down': 'slide-down 0.25s ease-out both',
      },
      minHeight: {
        screen: '100svh',
      },
    },
  },
  plugins: [],
};
