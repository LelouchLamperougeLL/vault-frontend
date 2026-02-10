/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        vault: {
          950: "#020617" // slate-950 fallback
        }
      }
    }
  },
  plugins: []
};
