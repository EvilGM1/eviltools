/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        parchment: {
          50: '#fdfbf7',
          100: '#f7f3e8',
          200: '#ede6d6',
          300: '#e4dac7',
          400: '#d4c8b2',
          500: '#baa98b',
          600: '#8c7a5c',
          700: '#5c4f39',
          800: '#383022',
          900: '#1e1a12',
        },
        forge: {
          50: '#fdf3f3',
          100: '#fae4e4',
          500: '#c53030',
          600: '#9b2828',
          700: '#8b2323',
          800: '#4a1c1c',
          900: '#2b1313',
          950: '#180a0a',
        },
        arcane: {
          50: '#f0f6fe',
          100: '#dce8fd',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#2b4570',
          800: '#1b2845',
          900: '#111a2e',
          950: '#0a101d',
        },
        gold: {
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#d4af37',
        }
      },
      fontFamily: {
        sans: ['Signika', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Cinzel', 'Georgia', 'serif'],
      }
    },
  },
  plugins: [],
}
