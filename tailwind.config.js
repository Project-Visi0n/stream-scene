export default {
  content: ['./client/**/*.{html,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        'tall': { 'raw': '(min-height: 800px)' },
        'touch': { 'raw': '(hover: none) and (pointer: coarse)' },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      minHeight: {
        'screen-90': '90vh',
        'touch-target': '44px',
      },
      maxHeight: {
        'screen-90': '90vh',
        'modal': '90vh',
      },
      keyframes: {
        reelspin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        reelspin: 'reelspin 4s linear infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
      },
      fontSize: {
        'responsive-xs': 'clamp(0.75rem, 3vw, 0.875rem)',
        'responsive-sm': 'clamp(0.875rem, 4vw, 1rem)',
        'responsive-base': 'clamp(1rem, 5vw, 1.125rem)',
        'responsive-lg': 'clamp(1.125rem, 6vw, 1.25rem)',
        'responsive-xl': 'clamp(1.25rem, 8vw, 1.5rem)',
        'responsive-2xl': 'clamp(1.5rem, 10vw, 1.875rem)',
      },
    },
  },
  plugins: [],
};
