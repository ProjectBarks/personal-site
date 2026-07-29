// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  // Each post is a folder holding its own index.mdx plus every chart, helper and
  // data file only that post uses. `foo/index.mdx` has to resolve to the id
  // `foo`, not `foo/index`, or the published URL would move.
  loader: glob({
    pattern: '**/*.mdx',
    base: './src/content/posts',
    generateId: ({ entry }) => entry.replace(/(?:\/index)?\.mdx$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
