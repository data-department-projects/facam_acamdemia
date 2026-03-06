import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        montserrat: ['var(--font-montserrat)', 'system-ui', 'sans-serif'],
        blacksword: ['var(--font-blacksword)', 'cursive'],
      },
      colors: {
        facam: {
          blue: '#001b61',
          'blue-mid': '#002a6e',
          dark: '#000d32',
          yellow: '#ffae03',
          white: '#ffffff',
          black: '#000000',
          'blue-tint': '#f0f4fa',
        },
        /* Rétrocompatibilité primary → facam */
        primary: {
          50: '#f0f4fa',
          100: '#e0e9f5',
          200: '#c2d3eb',
          300: '#93b4dc',
          400: '#5e8fc9',
          500: '#3b6fb5',
          600: '#001b61',
          700: '#00154d',
          800: '#000d32',
          900: '#000824',
        },
      },
      boxShadow: {
        facam: '0 4px 14px 0 rgba(0, 27, 97, 0.15)',
        'facam-lg': '0 10px 40px -10px rgba(0, 27, 97, 0.2)',
      },
    },
  },
  plugins: [],
};

export default config;
