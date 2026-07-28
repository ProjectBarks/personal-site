import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://brandonbarker.me',
  outDir: './build',
  build: {
    format: 'file',
  },
  integrations: [mdx()],
});
