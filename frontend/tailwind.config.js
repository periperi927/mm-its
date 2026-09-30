/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        its: {
          // Royal Blue Palette (Primary backgrounds, cards, sidebars)
          blue: {
            950: '#0b192c', // Main App Dark Background
            900: '#1e3a8a', // Card & Panel Backgrounds
            800: '#1e40af', // Hover & Secondary Accent
            700: '#3b82f6', // Active Borders & Focus Rings
          },
          // Gold / Yellow Palette (Secondary, Accents, Highlights)
          yellow: {
            500: '#eab308', // Primary Gold Accent
            400: '#facc15', // Bright Gold Highlight Text
            300: '#fde047', // Muted Gold Hover
          },
          // Crimson Red Palette (Emergency Corridors, Alerts, Unpaid Violations)
          red: {
            600: '#dc2626', // Primary Crimson Red Accent / Pulse
            500: '#ef4444', // Red Signal Status
            700: '#b91c1c', // Dark Crimson Hover
          },
        },
      },
    },
  },
  plugins: [],
};