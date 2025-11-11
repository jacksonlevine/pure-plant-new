// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import videoOptimizer from './integrations/videoOptimizer.js';
import {fileURLToPath} from "url";
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

  integrations: [react(), mdx(), videoOptimizer()], 
    site: 'https://jacksonlevine.github.io',
    base: '/pure-plant-new',
});