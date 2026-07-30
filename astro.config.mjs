import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://brandonbarker.me',
  // old post slugs redirect via RedirectStub pages in writing/[...slug].astro,
  // not config redirects: the stubs carry og tags so shared old links unfurl
  outDir: './build',
  build: {
    format: 'file',
  },
  integrations: [mdx()],
});
