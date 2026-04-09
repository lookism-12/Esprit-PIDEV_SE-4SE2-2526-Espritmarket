/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8B0000', // Brand Red
          dark: '#5a0000',
          light: '#A52A2A',
          100: '#fee2e2',
          900: '#450000',
        },
        secondary: {
          DEFAULT: '#BD9C7C', // Secondary Background
          light: '#FFDDBB', // Primary Background
        },
        accent: {
          DEFAULT: '#E0B84A', // Gold
          dark: '#c19c3b',
          red: '#dc2626',
        },
        dark: '#212121',
      },
      boxShadow: {
        'premium': '0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 5px 15px -8px rgba(0, 0, 0, 0.05)',
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
      },
      backgroundImage: {
        'gradient-header': 'linear-gradient(135deg, #8B0000 0%, #5a0000 100%)',
        'gradient-primary': 'linear-gradient(135deg, #8B0000 0%, #A52A2A 100%)',
        'shimmer-gradient': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
      },
      animation: {
        'shimmer': 'shimmer 2s infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
