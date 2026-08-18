import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FFF9F5',
        ink: '#5C4A66',
        muted: '#A794B8',
        soft: '#B7A6C6',
        lavender: '#C9B6FF',
        'lavender-deep': '#A48BD8',
        pink: '#F0A8C8',
        'pink-deep': '#E9899E',
        mint: '#A8DFC0',
        'mint-deep': '#55A374',
        butter: '#FFE8A5',
        'butter-deep': '#DBA83C',
        space: '#4E4368',
        'space-deep': '#3B3154',
        'space-light': '#6B5B8E',
        surface: '#F6F1FB',
        'surface-2': '#FAF6FC',
      },
      fontFamily: {
        sans: ['Pretendard Variable', 'Pretendard', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        card: '26px',
        widget: '20px',
      },
      boxShadow: {
        card: '0 10px 28px rgba(160,130,190,.14)',
        pop: '0 14px 34px rgba(160,130,190,.25)',
        glow: '0 0 22px rgba(201,182,255,.5)',
      },
    },
  },
  plugins: [],
} satisfies Config;
