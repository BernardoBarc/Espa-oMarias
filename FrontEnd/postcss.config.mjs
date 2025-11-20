/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        titulo: ['Dancing Script', 'cursive'],
        texto: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [["@tailwindcss/postcss"]],
}
