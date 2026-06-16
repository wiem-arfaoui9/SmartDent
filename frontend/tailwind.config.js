/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        accent: { 500: '#06d6a0', 600: '#059669' },
      },
      fontFamily: {
        sans: ['Sora', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: { xl: '1rem', '2xl': '1.25rem' },
      boxShadow: {
        card: '0 2px 16px rgba(59,130,246,0.08)',
        'card-hover': '0 8px 32px rgba(59,130,246,0.16)',
      },
    },
  },
  plugins: [],
}
