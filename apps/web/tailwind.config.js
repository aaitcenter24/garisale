/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          dark: '#1D4ED8',
        },
        background: '#F9FAFB',
        surface: '#FFFFFF',
        textPrimary: '#111827',
        textSecondary: '#6B7280',
        deal: {
          great: '#16A34A',
          greatBg: '#DCFCE7',
          good: '#0D9488',
          goodBg: '#CCFBF1',
          fair: '#D97706',
          fairBg: '#FEF3C7',
          overpriced: '#DC2626',
          overpricedBg: '#FEE2E2',
          none: '#9CA3AF',
          noneBg: '#F3F4F6',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        outfit: ['var(--font-outfit)', 'sans-serif'],
        bengali: ['var(--font-noto-bengali)', 'sans-serif'],
      },
      spacing: {
        'stack-sm': '8px',
        'stack-md': '16px',
        'stack-lg': '32px',
        'gutter': '24px',
        'container-max': '1280px',
      },
      borderRadius: {
        DEFAULT: '12px',
        btn: '8px',
        card: '12px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.1)',
      }
    },
  },
  plugins: [],
}
