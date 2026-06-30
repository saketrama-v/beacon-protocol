/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        matrix: {
          bg: '#050A0E',           // Deep space blue/black
          surface: 'rgba(9, 20, 26, 0.7)',
          primary: '#10b981',      // Emerald 500
          primaryHover: '#34d399', // Emerald 400
          text: '#a7f3d0',         // Emerald 200
          border: 'rgba(16, 185, 129, 0.25)',
          critical: '#f43f5e',     // Rose 500
          high: '#f97316',         // Orange 500
          medium: '#eab308',       // Yellow 500
          low: '#06b6d4'           // Cyan 500
        }
      },
      backgroundImage: {
        'matrix-gradient': 'radial-gradient(circle at 50% 0%, rgba(16,185,129,0.15), rgba(5,10,14,1) 60%)',
        'glass-gradient': 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)'
      },
      animation: {
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'grid-scroll': 'grid-scroll 20s linear infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite alternate',
      },
      keyframes: {
        'grid-scroll': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(32px)' }
        },
        'glow-pulse': {
          '0%': { boxShadow: '0 0 15px rgba(16,185,129,0.1)' },
          '100%': { boxShadow: '0 0 35px rgba(16,185,129,0.3)' }
        }
      }
    },
  },
  plugins: [],
}
