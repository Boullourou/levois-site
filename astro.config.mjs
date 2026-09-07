import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // URL de production - levois.fr (gentilé officiel des habitants de Lèves)
  site: 'https://levois.fr',
  integrations: [sitemap({filter:page=>!['/cockpit','/composants','/404','/situer-ma-vente/resultat'].some(route=>new URL(page).pathname.startsWith(route))})],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    inlineStylesheets: 'auto',
  },
});
