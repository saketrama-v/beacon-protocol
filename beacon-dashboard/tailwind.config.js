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
          bg: '#000000',
          surface: 'rgba(0, 20, 0, 0.7)',
          primary: '#00FF41',
          primaryHover: '#00C832',
          text: '#008F11',
          border: 'rgba(0, 255, 65, 0.3)',
          critical: '#EF4444',
          high: '#F97316',
          medium: '#EAB308',
          low: '#06B6D4'
        }
      },
      backgroundImage: {
        'matrix-gradient': 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,20,0,1) 100%)',
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
