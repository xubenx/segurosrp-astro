import type { BlogPost, BlogTemplate } from './blog';
import { TEMPLATE_META } from './blog';

const LOREM = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`;

const LOREM_BODY = `## ¿Por qué importa este tema?

${LOREM} Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

## Puntos clave

- Lorem ipsum dolor sit amet consectetur
- Adipiscing elit sed do eiusmod tempor
- Incididunt ut labore et dolore magna

## Cómo se aplica en la práctica

${LOREM}

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

## Conclusión

${LOREM}`;

const FAQ = [
  {
    question: '¿Esto es un artículo real?',
    answer:
      'No. Esta página es una plantilla de ejemplo con texto de relleno (lorem ipsum) para que el equipo vea la estructura antes de publicar.',
  },
  {
    question: '¿Puedo cambiar imágenes y video?',
    answer:
      'Sí. En /sistema eliges esta plantilla, subes tus archivos y reemplazas el lorem ipsum por el contenido real.',
  },
];

function base(template: BlogTemplate, extras: Partial<BlogPost> = {}): BlogPost {
  const meta = TEMPLATE_META[template];
  return {
    slug: `plantilla-${template}`,
    title: `Ejemplo: ${meta.name}`,
    description: `${meta.summary} Vista previa con lorem ipsum.`,
    author: 'Equipo SegurosRP',
    publishedAt: '2026-08-13',
    category: 'Guías',
    tags: ['plantilla', 'ejemplo'],
    template,
    coverImage: '/familia.webp',
    coverAlt: 'Imagen de ejemplo para plantilla de blog',
    intro: LOREM,
    body: LOREM_BODY,
    faq: FAQ,
    draft: true,
    ...extras,
  };
}

export const TEMPLATE_PREVIEWS: Record<BlogTemplate, BlogPost> = {
  hero: base('hero', {
    coverImage: '/familia.webp',
    coverAlt: 'Familia — imagen de portada de ejemplo',
  }),
  'mid-image': base('mid-image', {
    coverImage: '/seguro-salud.jpg',
    midImage: '/principal.webp',
    midImageAlt: 'Imagen central de ejemplo',
  }),
  video: base('video', {
    coverImage: '/principal.webp',
    videoUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4',
  }),
  gallery: base('gallery', {
    coverImage: '/cdmx.webp',
    gallery: [
      { src: '/familia.webp', alt: 'Galería ejemplo 1' },
      { src: '/seguro-salud.jpg', alt: 'Galería ejemplo 2' },
      { src: '/principal.webp', alt: 'Galería ejemplo 3' },
    ],
  }),
  quote: base('quote', {
    coverImage: '/familia.webp',
    quote:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit: proteger a la familia empieza por una decisión clara, no por un folleto.',
    quoteAuthor: 'Asesor de ejemplo — Ramírez & Plascencia',
  }),
  split: base('split', {
    coverImage: '/seguro-vida.png',
    coverAlt: 'Imagen lateral de ejemplo',
  }),
};

export const TEMPLATE_LIST = (Object.keys(TEMPLATE_PREVIEWS) as BlogTemplate[]).map(
  (id) => ({
    id,
    ...TEMPLATE_META[id],
    cover: TEMPLATE_PREVIEWS[id].coverImage,
  }),
);
