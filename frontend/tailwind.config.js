/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bowlby One"', 'cursive'],
        body: ['Nunito', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      colors: {
        // Backgrounds — warm "jungle coffee" tones
        bg: { 0: '#1a1410', 1: '#261c16', 2: '#322519', 3: '#3d2d20' },

        // Foregrounds — cream / warm
        cream: { DEFAULT: '#fef3c7', 2: '#fde68a' },
        warm:  { 3: '#d6a87a', 4: '#a07956', 5: '#6b4f38' },

        // Brand accents
        banana: { DEFAULT: '#fbbf24', 2: '#f59e0b' },
        jungle: { DEFAULT: '#84cc16', 2: '#65a30d' },
        clay:   { DEFAULT: '#f97316', 2: '#ea580c' },
        berry:  '#ec4899',

        // Semantic
        win:   '#84cc16',
        loss:  '#ef4444',
        warn:  '#f97316',

        // LoL tier colors (fixed)
        tier: {
          iron:        '#94a3b8',
          bronze:      '#b45309',
          silver:      '#cbd5e1',
          gold:        '#fbbf24',
          platinum:    '#2dd4bf',
          emerald:     '#34d399',
          diamond:     '#60a5fa',
          master:      '#c084fc',
          grandmaster: '#ef4444',
          challenger:  '#fde047',
          unranked:    '#64748b',
        },
      },
      borderRadius: {
        md: '14px',
        lg: '20px',
        xl: '28px',
      },
      boxShadow: {
        card:    '0 4px 0 #0d0805, 0 8px 24px rgba(0,0,0,0.4)',
        sticker: '0 6px 0 rgba(0,0,0,0.4), 0 10px 24px rgba(0,0,0,0.5)',
        pill:    '0 3px 0 rgba(0,0,0,0.4)',
      },
      animation: {
        bounce: 'bounce-soft 1.4s ease-in-out infinite',
      },
      keyframes: {
        'bounce-soft': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-3px)' },
        },
      },
    },
  },
  plugins: [],
}
