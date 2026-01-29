/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {colors: {
        primary: '#3B82F6', // replace with the actual primary color from your design
        secondary: '#F3F4F6', // background or secondary color
        accent: '#2563EB', // example accent
      },
      spacing: {
        '128': '32rem', // add custom spacing if needed
      },
      borderRadius: {
        'xl': '1rem',
      }},
  },
  plugins: [],
};
