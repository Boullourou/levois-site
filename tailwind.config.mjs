/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Palette LEVOIS — papier chaud, encre, argile
        papier: '#F7F2EA',        // fond dominant, sensation papier chaud
        'papier-vif': '#FDFBF6',  // surfaces relevées, cartes
        encre: '#211C16',         // texte principal, scènes sombres
        'encre-2': '#2E2820',     // surfaces sombres secondaires
        brun: '#6B5D4F',          // texte secondaire, légendes
        argile: '#A85638',        // écart, sélection, décision, action
        'argile-lum': '#C97B52',  // hover, états actifs, accents sur encre
        'argile-pale': '#F0E2D8', // fonds très légers teintés argile
        beige: '#E8DFD0',         // filets, bordures douces
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Instrument Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'hero': ['clamp(2.5rem, 8.5vw, 6.5rem)', { lineHeight: '1.02', letterSpacing: '-0.03em', fontWeight: '500' }],
        'display': ['clamp(2.1rem, 5.5vw, 4rem)', { lineHeight: '1.08', letterSpacing: '-0.02em', fontWeight: '500' }],
        'h2': ['clamp(1.7rem, 4vw, 2.5rem)', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '500' }],
        'h3': ['clamp(1.3rem, 2.5vw, 1.7rem)', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '500' }],
        'body-lg': ['1.125rem', { lineHeight: '1.7' }],
        'eyebrow': ['0.6875rem', { lineHeight: '1', letterSpacing: '0.18em', fontWeight: '500' }],
      },
      maxWidth: {
        prose: '68ch',
        editorial: '760px',
        page: '1280px',
        wide: '1440px',
      },
      spacing: {
        'edge': '20px',
        'edge-md': '48px',
        'section': '88px',
        'section-md': '128px',
        'section-lg': '168px',
      },
      transitionTimingFunction: {
        'out-soft': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      borderRadius: {
        'card': '14px',
        'panel': '22px',
      },
    },
  },
  plugins: [],
};
