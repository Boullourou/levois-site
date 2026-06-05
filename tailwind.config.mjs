/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Palette "carnet de terrain" — hospitality editorial
        cream: '#F7F2EA',      // fond, sensation papier
        'cream-soft': '#FAF7F0', // surface alt, pages secondaires
        ink: '#1F1B16',        // texte principal, charbon-café
        sapin: '#2C4A3E',      // accent principal, paysage
        'sapin-deep': '#153328', // hover, accents profonds
        ocre: '#C9924A',       // accent secondaire, terre/tuiles
        'ocre-soft': '#E0B57A', // ocre lumière, états hover
        beige: '#E8DFD0',      // filets, bordures douces
        muted: '#6B6258',      // texte secondaire
      },
      fontFamily: {
        sans: ['"Fraunces"', 'Georgia', 'serif'],
        display: ['"Fraunces"', 'Georgia', 'serif'],
      },
      fontSize: {
        // Display sizes éditoriaux avec responsive clamp
        'hero': ['clamp(2.75rem, 9vw, 6rem)', { lineHeight: '1.0', letterSpacing: '-0.03em', fontWeight: '500' }],
        'display': ['clamp(2.25rem, 6vw, 4rem)', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '500' }],
        'h2': ['clamp(1.75rem, 4vw, 2.5rem)', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '500' }],
        'h3': ['clamp(1.375rem, 2.5vw, 1.75rem)', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '500' }],
        'body-lg': ['1.125rem', { lineHeight: '1.65' }],
        'eyebrow': ['0.6875rem', { lineHeight: '1', letterSpacing: '0.2em', fontWeight: '500' }],
      },
      letterSpacing: {
        tightest: '-0.04em',
        widest: '0.2em',
      },
      maxWidth: {
        prose: '68ch',
        editorial: '720px',
        page: '1280px',
        wide: '1440px',
      },
      spacing: {
        'gutter': '24px',
        'edge': '24px',
        'edge-md': '48px',
        'edge-lg': '64px',
        'section': '80px',
        'section-md': '120px',
        'section-lg': '160px',
      },
      transitionDuration: {
        '600': '600ms',
        '700': '700ms',
      },
      transitionTimingFunction: {
        'out-soft': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
