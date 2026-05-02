/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        db: {
          bg:       '#07070f',
          bg2:      '#0c0c1a',
          card:     '#101022',
          elevated: '#161630',
          border:   'rgba(255,255,255,0.07)',
          red:      '#e63946',
          'red-d':  '#b71c1c',
          'red-g':  'rgba(230,57,70,0.25)',
          blue:     '#3a86ff',
          'blue-d': '#1565c0',
          'blue-g': 'rgba(58,134,255,0.20)',
          gold:     '#ffd60a',
          green:    '#06d6a0',
          'green-g':'rgba(6,214,160,0.20)',
          text:     '#ffffff',
          text2:    '#94a3b8',
          muted:    '#4a5568',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'slide-up':   'slideUp 0.3s ease-out',
        'fade-in':    'fadeIn 0.25s ease-out',
        'crash':      'crash 0.4s ease-in forwards',
        'win-pop':    'winPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'float':      'float 3s ease-in-out infinite',
        'shimmer':    'shimmer 2s linear infinite',
        'spin-slow':  'spin 4s linear infinite',
      },
      keyframes: {
        glowPulse: {
          '0%,100%': { textShadow: '0 0 20px var(--glow-color), 0 0 40px var(--glow-color)' },
          '50%':     { textShadow: '0 0 40px var(--glow-color), 0 0 80px var(--glow-color), 0 0 120px var(--glow-color)' },
        },
        slideUp: {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        crash: {
          '0%':   { transform: 'scale(1)',    filter: 'brightness(1)' },
          '30%':  { transform: 'scale(1.2)', filter: 'brightness(2) saturate(0)' },
          '100%': { transform: 'scale(0.95)', filter: 'brightness(1)' },
        },
        winPop: {
          '0%':   { transform: 'scale(0.8)', opacity: '0' },
          '60%':  { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)',   opacity: '1' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition:  '200% center' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'shimmer-gradient': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
      },
      boxShadow: {
        'red-glow':  '0 0 20px rgba(230,57,70,0.4), 0 0 60px rgba(230,57,70,0.2)',
        'blue-glow': '0 0 20px rgba(58,134,255,0.4), 0 0 60px rgba(58,134,255,0.2)',
        'green-glow':'0 0 20px rgba(6,214,160,0.4), 0 0 60px rgba(6,214,160,0.2)',
        'gold-glow': '0 0 20px rgba(255,214,10,0.5), 0 0 60px rgba(255,214,10,0.25)',
        'card':      '0 4px 24px rgba(0,0,0,0.4)',
        'inner-top': 'inset 0 1px 0 rgba(255,255,255,0.06)',
      },
    },
  },
  plugins: [],
}
