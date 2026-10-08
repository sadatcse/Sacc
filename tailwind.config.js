// Theme-aware colour tokens: each maps to a CSS variable set in src/styles/globals.css for
// light (:root) and dark (.dark). Use them instead of fixed greys so pages work in both modes:
//   bg-canvas (page) · bg-canvas-2 · bg-surface (cards) · bg-surface-2 · text-ink (headings) · text-ink-2
//   text-body · text-muted · text-subtle · text-faint · border-line/10 (hairlines; also bg-line/5 tints)
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
const config = {
  content: ['./src/**/*.{js,jsx}', './app/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: '1rem', sm: '1.5rem', lg: '2rem' },
    },
    extend: {
      screens: { '3xl': '1920px' },
      colors: {
        canvas: { DEFAULT: token('canvas'), 2: token('canvas-2') },
        surface: { DEFAULT: token('surface'), 2: token('surface-2') },
        ink: { DEFAULT: token('ink'), 2: token('ink-2') },
        body: token('body'),
        muted: token('muted'),
        subtle: token('subtle'),
        faint: token('faint'),
        line: token('line'),
        // Change this scale to re-brand the dashboard.
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
    },
  },
  plugins: [],
};

export default config;
