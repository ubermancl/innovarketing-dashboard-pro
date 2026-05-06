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
          900: '#0A0A0A', // fondo body — true black
          800: '#111111', // tarjetas
          700: '#1A1A1A', // bordes de tarjetas, inputs
          600: '#252525', // divisores
          500: '#383838', // texto muted bg
          400: '#555555', // texto muted
        },
        accent: {
          orange: '#F97316', // naranja principal
          cyan: '#00D9FF',
          magenta: '#B24BF3',
          purple: '#8B5CF6',
          pink: '#EC4899',
          yellow: '#FFD93D',
          green: '#10B981',
          red: '#EF4444',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#F97316',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'card': '12px',
        'button': '8px',
        'input': '6px',
      },
      boxShadow: {
        'card': '0 0 0 1px rgba(255,255,255,0.04)',
        'card-hover': '0 0 24px rgba(249, 115, 22, 0.12)',
        'glow-orange': '0 0 24px rgba(249, 115, 22, 0.3)',
        'glow-cyan': '0 0 20px rgba(0, 217, 255, 0.25)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.25)',
        'glow-magenta': '0 0 20px rgba(178, 75, 243, 0.25)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
        'gradient-card': 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
      },
    },
  },
  plugins: [],
}
