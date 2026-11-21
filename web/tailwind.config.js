/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        imdb: {
          yellow: "#f5c518",
          dark: "#0b0c0e",
          card: "#14161b",
          border: "#242731",
          muted: "#8b949e",
          accent: "#ff9900",
        },
        swipe: {
          watched: "#10b981",   // Emerald green for watched (Right)
          watchlist: "#3b82f6", // Blue/cyan for want to watch (Left)
          pass: "#ef4444",      // Red/rose for not interested (Down)
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 20px 40px -15px rgba(0, 0, 0, 0.7)',
        'glow-watched': '0 0 35px rgba(16, 185, 129, 0.45)',
        'glow-watchlist': '0 0 35px rgba(59, 130, 246, 0.45)',
        'glow-pass': '0 0 35px rgba(239, 68, 68, 0.45)',
      }
    },
  },
  plugins: [],
}
