/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        forest: {
          50:  '#EAF5EC',
          100: '#C8E8CD',
          300: '#6DB87B',
          500: '#4A9B5C',
          700: '#2C5530',
          800: '#1C2B1E',
          900: '#0D1A0F',
        },
        clay: {
          100: '#F5E6CC',
          500: '#C8974A',
        }
      }
    },
  },
  plugins: [],
}
