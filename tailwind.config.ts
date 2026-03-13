import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './contexts/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-dm-serif)', 'Georgia', 'serif'],
      },
      colors: {
        background: '#F7F5F1',
        foreground: '#1C2B1E',
        primary: {
          DEFAULT: '#2C5530',
          light: '#4A9B5C',
          muted: '#6DB87B',
          subtle: '#C8E8CD',
          faint: '#EAF5EC',
        },
        sidebar: {
          bg: '#1C2B1E',
          border: 'rgba(255,255,255,0.08)',
          text: '#C8E8CD',
          muted: 'rgba(200,232,205,0.5)',
          hover: 'rgba(255,255,255,0.05)',
          active: 'rgba(74,155,92,0.2)',
        },
        border: 'rgba(44,85,48,0.1)',
      },
    },
  },
  plugins: [],
}

export default config
