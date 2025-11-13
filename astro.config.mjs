// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import videoOptimizer from './integrations/videoOptimizer.js';
import {fileURLToPath} from "url";
import sitemap from '@astrojs/sitemap';
// https://astro.build/config
export default defineConfig({

    prefetch: {
        prefetchAll: true
    },
    
  vite: {
      plugins: [tailwindcss()],
      resolve: {
          alias: {
              three: fileURLToPath(new URL('./node_modules/three', import.meta.url)),
          },
      }
  },

  integrations: [react(), videoOptimizer(), sitemap()], 
    site: 'https://jacksonlevine.github.io',
    base: '/pure-plant-new',
});