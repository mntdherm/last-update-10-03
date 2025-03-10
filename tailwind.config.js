/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Ubuntu', 'sans-serif'],
        ubuntu: ['Ubuntu', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
      screens: {
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      borderRadius: {
        'ios': '1.25rem',
      },
      colors: {
        'ios': {
          'gray': '#f2f2f7',
          'blue': '#007AFF',
          'green': '#34C759',
          'red': '#FF3B30',
        },
        'bilo': {
          'silver': '#C0C0C0',
          'navy': '#2C3E50',
          'emerald': '#2ECC71',
          'gray': '#F2F2F2'
        }
      },
      animation: {
        'ios-slide-up': 'iosSlideUp 0.3s ease-out',
        'ios-scale': 'iosScale 0.2s ease-out',
        'slide-left': 'slideLeft 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
      },
      keyframes: {
        slideLeft: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
