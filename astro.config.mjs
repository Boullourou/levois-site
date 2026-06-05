import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  // URL de production - levois.fr (gentilé officiel des habitants de Lèves)
  site: 'https://levois.fr',
  integrations: [
    tailwind(),
    // sitemap() retiré temporairement (incompatibilité versions @astrojs/sitemap 3.2.1 + Astro 4.16+)
    // Sera réintégré plus tard avec versions alignées
  ],
  build: {
    inlineStylesheets: 'auto',
  },
});