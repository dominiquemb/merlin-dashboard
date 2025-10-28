/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#151515',
        'neutral-100': '#ffffff',
        'neutral-200': '#f7f9fa',
        'neutral-300': '#ebebf0',
        'neutral-400': '#dbdbdd',
        'neutral-500': '#9e9fa8',
        'neutral-600': '#7e7f88',
        'neutral-700': '#494b5c',
        'neutral-800': '#151515',
        'accent': '#ffc604',
        'accent-light': '#fff8e4',
        'yellow': '#ffc604',
        'cream': '#f7f9fa',
        'gold': '#ffc604',
      },
      fontFamily: {
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'display': ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'sm': '0 2px 6px rgba(27, 30, 62, 0.08)',
        'md': '0 2px 12px rgba(20, 20, 43, 0.08)',
        'lg': '0 8px 28px rgba(20, 20, 43, 0.1)',
      },
    },
  },
  plugins: [],
}
