export default {
  content: ['./client/**/*.{html,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        reelspin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        reelspin: 'reelspin 4s linear infinite',
      },
    },
  },
  plugins: [],
};
