import { type Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // StreakSync Design System - Dark First
        background: '#0D0D0F',
        surface: '#16161A',
        border: '#2A2A32',
        primary: '#6366F1',    // Indigo
        accent: '#F97316',     // Orange - fire, streaks
        success: '#22C55E',    // Green - completed
        danger: '#EF4444',     // Red - missed
        text: '#F4F4F5',       // Near-white
        muted: '#71717A',      // Gray
      },
      fontFamily: {
        heading: ['Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'streak-glow': 'streakGlow 2s ease-in-out infinite alternate',
        'fire-pulse': 'firePulse 1.5s ease-in-out infinite',
        'confetti': 'confettiFall 3s ease-out forwards',
      },
      keyframes: {
        streakGlow: {
          '0%': { opacity: 1, transform: 'scale(1)' },
          '100%': { opacity: 0.8, transform: 'scale(1.02)' },
        },
        firePulse: {
          '0%': { opacity: 1, filter: 'brightness(1)' },
          '50%': { opacity: 1, filter: 'brightness(1.3) drop-shadow(0 0 8px #F97316)' },
          '100%': { opacity: 1, filter: 'brightness(1)' },
        },
        confetti: {
          to: { transform: 'translateY(-100vh)', opacity: 0 },
        },
      },
    },
  },
  plugins: [],
} satisfies Config