/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bitcoin-orange': '#F7931A',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-orange': '0 0 20px rgba(247, 147, 26, 0.5)',
        'glow-orange-lg': '0 0 40px rgba(247, 147, 26, 0.6)',
      },
    },
  },
  plugins: [],
}

