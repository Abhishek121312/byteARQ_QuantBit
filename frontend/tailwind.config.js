/** @type {import('tailwindcss').Config} */
import daisyuiThemes from "daisyui/src/theming/themes";

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // You can add custom eGov theme extensions here if needed
      colors: {
        'egov-primary': '#0D47A1', // A strong, trustworthy blue
        'egov-secondary': '#FFC107', // A bright, attention-grabbing yellow/gold
      },
    },
  },
  plugins: [require("daisyui")],
  // DaisyUI config
  daisyui: {
    themes: [
      {
        light: {
          ...daisyuiThemes["light"],
          "primary": "#0D47A1", // eGov Blue
          "secondary": "#FFC107", // eGov Yellow
          "accent": "#1976D2", // Lighter Blue
          "neutral": "#374151", // Gray-700
          "base-100": "#ffffff", // White
          "base-200": "#f8fafc", // Slate-50
          "base-300": "#e2e8f0", // Slate-200
          "info": "#2196F3",
          "success": "#4CAF50",
          "warning": "#FF9800",
          "error": "#F44336",
        },
      },
      // You can define a custom 'dark' theme here if you want
      "dark",
    ],
    darkTheme: "light", // Default to light theme for a clean, official look
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: true,
    themeRoot: ":root",
  },
}