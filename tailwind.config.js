/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#B91C1C',
          dark: '#7F1D1D',
          black: '#111111',
          gray: '#1F1F1F',
        }
      },
      fontFamily: {
        heading: ['Oswald', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
