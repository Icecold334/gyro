/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#041627',
        background: '#fbf9fa',
        surface: '#fbf9fa',
        'surface-container': '#efedef',
        'surface-container-lowest': '#ffffff',
        'surface-container-highest': '#e4e2e3',
        'on-surface': '#1b1c1d',
        'on-surface-variant': '#44474c',
        'secondary-container': '#fcd400',
        'on-secondary-container': '#6e5c00',
        'secondary-fixed-dim': '#e9c400',
        error: '#ba1a1a',
        outline: '#74777d',
        'outline-variant': '#c4c6cd',
      },
    },
  },
  plugins: [],
}
