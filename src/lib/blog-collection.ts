import { getCollection } from 'astro:content';
import { sectionOf, type BlogPost, type BlogSection } from './blog';

export async function getPublishedPosts(): Promise<BlogPost[]> {
  const entries = await getCollection('blog', ({ data }) => data.draft !== true);
  return entries
    .map((entry) => ({ ...entry.data, slug: entry.id }))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getPostsBySection(section: BlogSection): Promise<BlogPost[]> {
  const posts = await getPublishedPosts();
  return posts.filter((post) => sectionOf(post) === section);
}

export async function getPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const posts = await getPublishedPosts();
  return posts.find((post) => post.slug === slug);
}
