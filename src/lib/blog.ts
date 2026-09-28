import { z } from 'astro/zod';

export const SITE_URL = 'https://segurosrp.com';
export const DEFAULT_AUTHOR = 'Ramírez & Plascencia';
export const DEFAULT_OG = `${SITE_URL}/logo_ryp.png`;

export const BLOG_CATEGORIES = [
  'Vida',
  'Salud',
  'Retiro',
  'Educación',
  'Familia',
  'Guías',
] as const;

export const BLOG_TEMPLATES = [
  'hero',
  'mid-image',
  'video',
  'gallery',
  'quote',
  'split',
] as const;

export type BlogTemplate = (typeof BLOG_TEMPLATES)[number];
export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export const TEMPLATE_META: Record<
  BlogTemplate,
  { name: string; summary: string }
> = {
  hero: {
    name: 'Imagen arriba',
    summary: 'Portada a lo ancho, título y artículo debajo. Ideal para notas de portada.',
  },
  'mid-image': {
    name: 'Imagen al centro',
    summary: 'Introducción, imagen destacada a la mitad y continuación del texto.',
  },
  video: {
    name: 'Video destacado',
    summary: 'Video de YouTube al inicio, luego la explicación. Útil para entrevistas o cápsulas.',
  },
  gallery: {
    name: 'Galería',
    summary: 'Varias imágenes en cuadrícula intercaladas con el texto.',
  },
  quote: {
    name: 'Cita destacada',
    summary: 'Frase grande + retrato o imagen. Sirve para testimonios y opiniones de asesores.',
  },
  split: {
    name: 'Imagen lateral',
    summary: 'Imagen a un lado y texto al otro (estilo revista). Bueno en escritorio.',
  },
};

export const galleryImageSchema = z.object({
  src: z.string(),
  alt: z.string(),
});

export const faqSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

export const blogPostSchema = z.object({
  title: z.string(),
  description: z.string(),
  author: z.string().default(DEFAULT_AUTHOR),
  publishedAt: z.string(),
  updatedAt: z.string().optional(),
  category: z.string(),
  tags: z.array(z.string()).default([]),
  template: z.enum(BLOG_TEMPLATES),
  coverImage: z.string(),
  coverAlt: z.string().default(''),
  midImage: z.string().optional(),
  midImageAlt: z.string().optional(),
  gallery: z.array(galleryImageSchema).optional(),
  videoUrl: z.string().optional(),
  quote: z.string().optional(),
  quoteAuthor: z.string().optional(),
  intro: z.string(),
  body: z.string(),
  faq: z.array(faqSchema).optional(),
  draft: z.boolean().default(false),
});

export type BlogPostData = z.infer<typeof blogPostSchema>;

export type BlogPost = BlogPostData & { slug: string };

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 80;
}

export function youtubeId(url?: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/,
  );
  return match?.[1] ?? null;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Mexico_City',
  }).format(date);
}

export function readingMinutes(post: Pick<BlogPostData, 'intro' | 'body'>): number {
  const words = `${post.intro} ${post.body}`.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function postUrl(slug: string): string {
  return `${SITE_URL}/blog/${slug}`;
}

export function ogImage(post: Pick<BlogPostData, 'coverImage'>): string {
  if (!post.coverImage) return DEFAULT_OG;
  if (post.coverImage.startsWith('http')) return post.coverImage;
  return `${SITE_URL}${post.coverImage.startsWith('/') ? '' : '/'}${post.coverImage}`;
}

export function articleSchema(post: BlogPost) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${postUrl(post.slug)}#article`,
        headline: post.title,
        description: post.description,
        image: ogImage(post),
        datePublished: post.publishedAt,
        dateModified: post.updatedAt || post.publishedAt,
        inLanguage: 'es-MX',
        author: {
          '@type': 'Person',
          name: post.author,
        },
        publisher: {
          '@type': 'InsuranceAgency',
          '@id': `${SITE_URL}/#organization`,
          name: 'SegurosRP — Ramírez & Plascencia',
          logo: {
            '@type': 'ImageObject',
            url: `${SITE_URL}/logo_ryp.png`,
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': postUrl(post.slug),
        },
        articleSection: post.category,
        keywords: post.tags.join(', '),
        speakable: {
          '@type': 'SpeakableSpecification',
          cssSelector: ['.blog-intro', 'h1'],
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
          { '@type': 'ListItem', position: 3, name: post.title, item: postUrl(post.slug) },
        ],
      },
      ...(post.faq?.length
        ? [
            {
              '@type': 'FAQPage',
              mainEntity: post.faq.map((item) => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: { '@type': 'Answer', text: item.answer },
              })),
            },
          ]
        : []),
    ],
  };
}
