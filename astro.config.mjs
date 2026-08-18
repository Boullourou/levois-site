import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // URL de production - levois.fr (gentilé officiel des habitants de Lèves)
  site: 'https://levois.fr',
  // Le sitemap reste volontairement inactif pendant la migration de sécurité.
  integrations: [],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    inlineStylesheets: 'auto',
  },
});
