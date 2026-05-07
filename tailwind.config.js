/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0E0D16', // fondo principal — azul muy oscuro
          800: '#1A1928', // cards
          700: '#222136', // bordes, inputs
          600: '#2E2C45', // hover, divisores
          500: '#3D3B57', // estados muted
          400: '#6B6980', // texto muted
          sidebar: '#110F1E', // sidebar ligeramente más oscura
        },
        accent: {
          orange: '#F97316',
          green:  '#22C55E',
          red:    '#EF4444',
          yellow: '#F59E0B',
          // mantenidos para compatibilidad — usar con moderación
          cyan:    '#00D9FF',
          magenta: '#B24BF3',
          purple:  '#8B5CF6',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        error:   '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'card':   '10px',
        'button': '7px',
        'input':  '6px',
      },
      boxShadow: {
        'card':         '0 1px 3px rgba(0,0,0,0.4)',
        'card-hover':   '0 4px 16px rgba(0,0,0,0.3)',
        'sidebar-glow': '0 0 20px rgba(249,115,22,0.15)',
      },
    },
  },
  plugins: [],
}
