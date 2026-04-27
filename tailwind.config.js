/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      },
      // Adding the floating animation logic here
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
      },
      // Adding a custom drop shadow for the logo
      dropShadow: {
        'logo': '0 10px 10px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
