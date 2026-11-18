/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: ['class', '[data-theme="emerald"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        obsidian: '#070f0c',
        agro: {
          50: '#f0fdf4',
          100: '#dcfce7',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        lime: { neon: '#a3e635' },
        amberterm: '#f59e0b',
      },
      animation: {
        'mesh-drift': 'meshDrift 18s ease-in-out infinite alternate',
        'mesh-drift-slow': 'meshDrift 28s ease-in-out infinite alternate-reverse',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'shimmer': 'shimmer 2.4s linear infinite',
        'float-slow': 'floatSlow 7s ease-in-out infinite',
      },
      keyframes: {
        meshDrift: {
          '0%': { transform: 'translate(0%, 0%) scale(1)' },
          '50%': { transform: 'translate(6%, -4%) scale(1.12)' },
          '100%': { transform: 'translate(-5%, 5%) scale(0.94)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0,0,0,0.35)',
        'glass-lg': '0 20px 60px rgba(0,0,0,0.45)',
        'emerald-glow': '0 0 24px rgba(16,185,129,0.35)',
        'lime-glow': '0 0 18px rgba(163,230,53,0.35)',
      },
    },
  },
  plugins: [],
}
