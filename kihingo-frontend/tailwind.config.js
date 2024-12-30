module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        georgia: ['Georgia', 'serif'],
      },
      animation: {
        scroll: 'scroll 15s linear',
        'gradient-text': 'gradient-animation 5s linear infinite',
        fadeIn: 'fadeIn 0.2s ease-in-out',
        ping: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
        'scroll-verse': 'scrollVerse 15s linear',
      },
      keyframes: {
        scroll: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'gradient-animation': {
          '0%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
          '100%': { 'background-position': '0% 50%' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scrollVerse: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
      scale: {
        '102': '1.02',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('autoprefixer'),
  ],
}