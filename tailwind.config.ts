import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EBF5FF',
          100: '#BFDBFE',
          300: '#93C5FD',
          600: '#1A56DB',
          700: '#1E429F',
        },
        success: {
          DEFAULT: '#0E9F6E',
          light: '#ECFDF5',
        },
        ai: {
          DEFAULT: '#7E3AF2',
          light: '#F5F3FF',
        },
        warning: {
          DEFAULT: '#FF5A1F',
          light: '#FFF3E0',
        },
        danger: {
          DEFAULT: '#E02424',
          light: '#FDF2F2',
        },
        gray: {
          50: '#F9FAFB',
          200: '#E5E7EB',
          500: '#6B7280',
          700: '#374151',
          900: '#111928',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['36px', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.01em' }],
        'display-lg': ['30px', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.01em' }],
        h1: ['24px', { lineHeight: '1.2', fontWeight: '600', letterSpacing: '-0.01em' }],
        h2: ['20px', { lineHeight: '1.2', fontWeight: '600' }],
        h3: ['18px', { lineHeight: '1.2', fontWeight: '500' }],
        'body-lg': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '1.5', fontWeight: '400' }],
        label: ['12px', { lineHeight: '1.5', fontWeight: '500' }],
        caption: ['11px', { lineHeight: '1.5', fontWeight: '400' }],
      },
      maxWidth: {
        page: '1280px',
      },
      width: {
        sidebar: '256px',
      },
    },
  },
  plugins: [],
}

export default config
