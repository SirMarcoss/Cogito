/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        panna: {
          DEFAULT: "#FAF6EE",
          soft: "#F4EDE0",
          deep: "#EFE5D2",
          card: "#FFFDF8",
        },
        gold: {
          light: "#E0CFA8",
          DEFAULT: "#A8843E",
          deep: "#856527",
          dark: "#6B501D",
        },
        ink: {
          DEFAULT: "#1E1812",
          secondary: "#4A4035",
          muted: "#6D6153",
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
    },
  },
  plugins: [],
};
