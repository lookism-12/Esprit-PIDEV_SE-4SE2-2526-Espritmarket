/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          dark: '#250000',
          DEFAULT: '#8B0000',
          light: '#A52A2A'
        },
        accent: {
          green: '#10B981',
          red: '#EF4444',
          yellow: '#F59E0B',
          blue: '#3B82F6',
          purple: '#8B5CF6'
        }
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #250000 0%, #8B0000 100%)',
        'gradient-header': 'linear-gradient(90deg, #250000 0%, #8B0000 100%)',
      }
    },
  },
  plugins: [],
}
