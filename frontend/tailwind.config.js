/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        actay: ["Actay", "ui-sans-serif", "system-ui"]
      }
    }
  },
  plugins: []
};