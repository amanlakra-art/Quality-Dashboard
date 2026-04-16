/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui'],
        display: ['var(--font-display)', 'system-ui'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        surface: {
          DEFAULT: '#0E1117',
          1: '#141720',
          2: '#1A1F2E',
          3: '#222840',
        },
        accent: {
          green: '#00D97E',
          amber: '#F59E0B',
          red: '#EF4444',
          blue: '#3B82F6',
          purple: '#8B5CF6',
        },
        border: {
          DEFAULT: 'rgba(255,255,255,0.07)',
          hover: 'rgba(255,255,255,0.14)',
        }
      },
      boxShadow: {
        'glow-green': '0 0 24px rgba(0, 217, 126, 0.15)',
        'glow-amber': '0 0 24px rgba(245, 158, 11, 0.15)',
        'glow-red': '0 0 24px rgba(239, 68, 68, 0.15)',
        'card': '0 1px 3px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.3)',
        'card-hover': '0 2px 8px rgba(0,0,0,0.5), 0 16px 48px rgba(0,0,0,0.4)',
      }
    },
  },
  plugins: [],
}
