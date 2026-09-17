/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ifood: {
          DEFAULT: "#EA1D2C",
          dark: "#C3131F",
          light: "#FFF0F1",
        },
        primary: {
          DEFAULT: "#EA1D2C",
          dark: "#C3131F",
          light: "#FFF0F1",
          soft: "#A31320",
        },
        rating: "#50A773",
        ink: "#3E3E3E",
        paper: "#FFFFFF",
        mist: "#F7F7F7",
        accent: {
          DEFAULT: "#EA1D2C",
          dark: "#C3131F",
        },
      },
      fontFamily: {
        sans: ["'Nunito'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,.06)",
        lift: "0 4px 16px rgba(0,0,0,.12)",
      },
      borderRadius: {
        ifood: "12px",
      },
    },
  },
  plugins: [],
};
