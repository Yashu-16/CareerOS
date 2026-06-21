/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#13182B',
          50: '#F4F5F8',
          100: '#E4E6ED',
          200: '#C3C7D6',
          300: '#9499B3',
          400: '#5D6280',
          500: '#3A3F5C',
          600: '#262B45',
          700: '#1B2038',
          800: '#13182B',
          900: '#0A0D1A',
        },
        paper: {
          DEFAULT: '#FAF8F4',
          dim: '#F0EDE5',
        },
        saffron: {
          DEFAULT: '#E8964A',
          50: '#FDF3E9',
          100: '#FAE3C9',
          300: '#F0B679',
          500: '#E8964A',
          600: '#D67A2C',
          700: '#B0611E',
        },
        success: {
          DEFAULT: '#2F9E68',
          50: '#EAF7EF',
          500: '#2F9E68',
          700: '#1F7A4E',
        },
        alert: {
          DEFAULT: '#E25B4F',
          50: '#FCEEEC',
          500: '#E25B4F',
          700: '#B83F35',
        },
        slate: {
          DEFAULT: '#6B7280',
        },
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jbmono)', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '10px',
        lg: '16px',
        xl: '22px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(19, 24, 43, 0.04), 0 4px 16px rgba(19, 24, 43, 0.06)',
        cardHover: '0 2px 4px rgba(19, 24, 43, 0.06), 0 8px 28px rgba(19, 24, 43, 0.10)',
        ticket: '0 1px 2px rgba(19, 24, 43, 0.05), 0 6px 20px rgba(19, 24, 43, 0.08)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease-out',
      },
    },
  },
  plugins: [],
};
