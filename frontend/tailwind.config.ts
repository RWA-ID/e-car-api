import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ecar: {
          DEFAULT: '#00D4FF',
          dark: '#0099BB',
          dim: '#003344',
          green: '#00FF88',
          yellow: '#FFD700',
        },
      },
      fontFamily: {
        mono: ['Space Mono', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        ecar: '0 0 20px rgba(0, 212, 255, 0.25)',
        'ecar-lg': '0 0 40px rgba(0, 212, 255, 0.35)',
      },
    },
  },
  plugins: [],
}

export default config
