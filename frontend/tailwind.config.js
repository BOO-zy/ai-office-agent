/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        shuhei: ['AlimamaShuHeiTi', 'system-ui', 'sans-serif'],
        heading: ['AlimamaShuHeiTi', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#F0F7FF',
          100: '#E0EFFF',
          500: '#1F4E78',
          600: '#163B5C',
          700: '#0F2942',
        }
      }
    },
  },
  plugins: [],
}
