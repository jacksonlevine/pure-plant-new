// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import videoOptimizer from './integrations/videoOptimizer.js';
// https://astro.build/config
export default defineConfig({
  vite: {
      plugins: [tailwindcss()],
  },

  integrations: [react(), mdx(), videoOptimizer()], 
    site: 'https://jacksonlevine.github.io',
    base: '/pure-plant-new',
});