/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: '#F7F7F5',
        surface: '#FFFFFF',
        surface2: '#F0EFEC',
        border: '#E8E7E3',
        accent: '#0F0F0F',
        muted: '#A8A8A5',
      }
    },
  },
  plugins: [],
}
