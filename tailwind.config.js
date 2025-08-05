/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Epilogue', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        primary: {
          50: '#f0f2ff',
          100: '#e6eaff',
          200: '#d1daff',
          300: '#adbfff',
          400: '#77A1E2',
          500: '#3C47D3',
          600: '#0C147B',
          700: '#050A53',
          800: '#030642',
          900: '#020332',
        },
        coral: {
          400: '#F19F90',
          500: '#EB8774',
          600: '#e57561',
        },
        success: {
          50: '#E0F7E6',
          100: '#c6f0d0',
          500: '#2CA14D',
          600: '#228a42',
        },
        error: {
          50: '#FFE4E4',
          100: '#ffd1d1',
          500: '#CC071E',
          600: '#b50619',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '16px' }],
        'sm': ['14px', { lineHeight: '20px' }],
        'base': ['16px', { lineHeight: '24px' }],
        'lg': ['18px', { lineHeight: '28px' }],
        'xl': ['20px', { lineHeight: '32px' }],
        '2xl': ['24px', { lineHeight: '36px' }],
        '3xl': ['30px', { lineHeight: '42px' }],
        '4xl': ['36px', { lineHeight: '48px' }],
      },
      spacing: {
        '18': '4.5rem', // 72px
        '52': '13rem',  // 208px for button heights
      },
      borderRadius: {
        'lg': '8px',
      },
      screens: {
        'sm': '720px',
        'md': '1024px',
        'lg': '1280px',
      },
    },
  },
  plugins: [],
}