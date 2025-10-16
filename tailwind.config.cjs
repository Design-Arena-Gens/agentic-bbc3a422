/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"]
      },
      colors: {
        brand: {
          50: "#eef8ff",
          100: "#d5edff",
          200: "#adddff",
          300: "#75c5ff",
          400: "#3aaaff",
          500: "#178bff",
          600: "#096ef2",
          700: "#0654c0",
          800: "#094994",
          900: "#0d3f75"
        }
      }
    }
  },
  plugins: []
};
