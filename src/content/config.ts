import { defineCollection } from 'astro:content';
import { blogPostSchema } from '../lib/blog';

const blog = defineCollection({
  type: 'data',
  schema: blogPostSchema,
});

export const collections = { blog };
