/** @type {import('tailwindcss').Config} */

// Every brand colour is a CSS custom property (see src/styles/index.css) exposed
// to Tailwind as an "R G B" triplet so `/<alpha-value>` opacity modifiers work.
// One set of utility classes then covers light + dark; only the variables swap.
const c = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // --- Henna & haldi surfaces / ink ---
        paper: c('paper'),
        raised: c('raised'),
        ink: { DEFAULT: c('ink'), 2: c('ink-2'), 3: c('ink-3') },
        rule: { DEFAULT: c('rule'), 2: c('rule-2') },

        // --- accent + supports ---
        accent: { DEFAULT: c('accent'), strong: c('accent-strong'), soft: c('accent-soft') },
        haldi: c('haldi'),
        leaf: c('leaf'),
        pop: c('pop'),

        // --- semantic ---
        ok: c('ok'),
        warn: c('warn'),
        alert: c('alert'),

        // --- one colour per family member (event dots, "just X" filter) ---
        fam: {
          krish: c('fam-krish'),
          karishma: c('fam-karishma'),
          priya: c('fam-priya'),
          anand: c('fam-anand'),
          dada: c('fam-dada'),
          maa: c('fam-maa'),
          all: c('fam-all'),
        },

        // --- back-compat: existing components still say primary-*/secondary-*.
        // Point them at the henna-brown / leaf-green ramps so they land on-theme
        // until each call site is migrated in the PR-3 restyle sweep. ---
        primary: {
          50: '#f7ede7',
          100: '#f0dccd',
          200: '#e2bda4',
          300: '#d29a77',
          400: '#bd7551',
          500: '#a65a3c',
          600: '#8f4a30',
          700: '#763c28',
          800: '#5f3120',
          900: '#4d281b',
        },
        secondary: {
          50: '#eaf1ee',
          100: '#cfe0d9',
          200: '#a6c6b8',
          300: '#74a48f',
          400: '#4a8270',
          500: '#2e5e4e',
          600: '#274f42',
          700: '#1f4136',
          800: '#18332b',
          900: '#122620',
        },
        success: '#2f7d57',
        warning: '#b07216',
        error: '#b24b3c',
      },
      fontFamily: {
        // big moments — clock, day numbers, headings
        display: ['"Bricolage Grotesque"', '"Trebuchet MS"', 'Segoe UI', 'sans-serif'],
        // everything else
        sans: ['"Hanken Grotesk"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
        '3xl': '4rem',
      },
      borderRadius: {
        card: '0.75rem',
      },
    },
  },
  plugins: [],
};
