/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'flip': 'flip 400ms ease-in-out',
        'shake': 'shake 400ms ease-in-out',
        'pulse-slot': 'pulse-slot 600ms ease-in-out',
        'cascade-reveal': 'cascade-reveal 300ms ease-out',
        'slide-down-fade': 'slide-down-fade 500ms ease-out forwards',
        'confetti': 'confetti 1s ease-out',
        'ellipsis': 'ellipsis 1.2s steps(4, end) infinite',
      },
      keyframes: {
        flip: {
          '0%': { transform: 'rotateY(0deg)' },
          '50%': { transform: 'rotateY(90deg)' },
          '100%': { transform: 'rotateY(0deg)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
        'pulse-slot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        'cascade-reveal': {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-down-fade': {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0.3', transform: 'translateY(20px)' },
        },
      },
    },
  },
  plugins: [],
};
