import { getPublishedPosts } from './blog-collection';
import { SITE_URL } from './blog';

const STATIC_PAGES: { path: string; changefreq: string; priority: string }[] = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/nosotros', changefreq: 'monthly', priority: '0.8' },
  { path: '/contacto', changefreq: 'monthly', priority: '0.8' },
  { path: '/diagnostico', changefreq: 'monthly', priority: '0.8' },
  { path: '/blog', changefreq: 'weekly', priority: '0.9' },
  { path: '/asesores-seguros-monterrey', changefreq: 'monthly', priority: '0.7' },
  { path: '/asesores-seguros-monterrey-nyl', changefreq: 'monthly', priority: '0.7' },
  { path: '/seguros-vida', changefreq: 'weekly', priority: '0.9' },
  { path: '/seguros-vida/imagina-ser', changefreq: 'monthly', priority: '0.7' },
  { path: '/seguros-vida/nuevo-plenitud', changefreq: 'monthly', priority: '0.7' },
  { path: '/seguros-vida/orvi', changefreq: 'monthly', priority: '0.7' },
  { path: '/seguros-vida/segubeca', changefreq: 'monthly', priority: '0.7' },
  { path: '/seguros-vida/star-dotal', changefreq: 'monthly', priority: '0.7' },
  { path: '/seguros-vida/vida-mujer', changefreq: 'monthly', priority: '0.7' },
  { path: '/seguros-salud', changefreq: 'weekly', priority: '0.9' },
  { path: '/seguros-salud/alfa-medical', changefreq: 'monthly', priority: '0.7' },
  { path: '/seguros-salud/alfa-medical-flex', changefreq: 'monthly', priority: '0.7' },
  { path: '/seguros-salud/alfa-medical-internacional', changefreq: 'monthly', priority: '0.7' },
  { path: '/beneficios-seguro-de-vida', changefreq: 'monthly', priority: '0.8' },
  { path: '/plan-de-retiro-seguros-monterrey', changefreq: 'monthly', priority: '0.8' },
  { path: '/seguro-de-vida-mujer', changefreq: 'monthly', priority: '0.8' },
  { path: '/seguros-monterrey-en-celaya-gto', changefreq: 'monthly', priority: '0.6' },
  { path: '/seguros-monterrey-en-queretaro', changefreq: 'monthly', priority: '0.6' },
  { path: '/segubecalanding', changefreq: 'weekly', priority: '0.7' },
  { path: '/vidamujerlanding', changefreq: 'weekly', priority: '0.7' },
];

function loc(path: string) {
  if (path === '/') return `${SITE_URL}/`;
  return `${SITE_URL}${path}`;
}

export async function buildSitemapXml(): Promise<string> {
  const posts = await getPublishedPosts();
  const today = new Date().toISOString();

  const staticUrls = STATIC_PAGES.map(
    (page) => `  <url>
    <loc>${loc(page.path)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
  );

  const postUrls = posts.map(
    (post) => `  <url>
    <loc>${loc(`/blog/${post.slug}`)}</loc>
    <lastmod>${post.updatedAt || post.publishedAt}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`,
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...postUrls].join('\n')}
</urlset>
`;
}
