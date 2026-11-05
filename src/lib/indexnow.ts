import { SITE_URL } from './blog';

/**
 * IndexNow — protocolo de notificación instantánea de URLs a buscadores.
 *
 * Lo usan: Bing (y por tanto Microsoft Copilot), Yandex, Seznam, Naver, Yep.
 * Google NO participa en IndexNow: para Google sigue siendo sitemap + Search
 * Console (Inspección de URLs / Sitemaps).
 *
 * La clave es pública por diseño: los buscadores la leen desde
 * `https://segurosrp.com/<clave>.txt` para validar que quien envía URLs
 * controla el dominio. El archivo vive en `public/<clave>.txt`.
 */
export const INDEXNOW_KEY = '7b2792d350ea15d1fb03a7d957c48e05';
export const INDEXNOW_KEY_LOCATION = `${SITE_URL}/${INDEXNOW_KEY}.txt`;

/** Sólo se aceptan URLs de nuestro propio host. */
export const SITE_HOST = new URL(SITE_URL).host;

const ENDPOINTS = [
  // Fan-out a todos los motores participantes (Bing, Yandex, Seznam, Naver...)
  'https://api.indexnow.org/indexnow',
  // Envío directo a Bing: respaldo si el fan-out falla o va lento
  'https://www.bing.com/indexnow',
];

/**
 * Rutas bloqueadas en robots.txt (landing pages de campaña con noindex).
 * No deben aparecer en el sitemap ni enviarse a IndexNow: sería contradictorio
 * y los buscadores rechazan URLs que ellas mismas tienen prohibidas.
 */
const NON_INDEXABLE_PREFIXES = [
  '/segubecalanding',
  '/vidamujerlanding',
  '/asesores-seguros-monterrey-nyl',
  '/sistema',
  '/login',
  '/ssr',
  '/blog/plantillas',
];

function isIndexable(url: string): boolean {
  const path = new URL(url).pathname;
  return !NON_INDEXABLE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

/** Máximo por petición según la especificación de IndexNow. */
const MAX_URLS_PER_REQUEST = 10_000;

export interface IndexNowResult {
  endpoint: string;
  ok: boolean;
  status: number;
  message?: string;
}

/** Deduplica, recorta y descarta URLs que no pertenezcan al sitio. */
export function sanitizeUrls(input: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const raw of input) {
    if (typeof raw !== 'string') continue;
    const value = raw.trim();
    if (!value) continue;

    let url: URL;
    try {
      url = new URL(value.startsWith('/') ? `${SITE_URL}${value}` : value);
    } catch {
      continue;
    }

    if (url.host !== SITE_HOST) continue;
    if (!/^https?:$/.test(url.protocol)) continue;

    url.hash = '';
    const normalized = url.toString();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }

  return out;
}

/** Extrae todas las URLs del sitemap generado por la aplicación. */
export async function getSitemapUrls(): Promise<string[]> {
  // Import dinámico: evita cargar astro:content si sólo se usa sanitizeUrls.
  const { buildSitemapXml } = await import('./sitemap');
  const xml = await buildSitemapXml();
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) =>
    match[1].replace(/&amp;/g, '&').trim(),
  );
  return sanitizeUrls(urls).filter(isIndexable);
}

/**
 * URLs del blog modificadas en los últimos `days` días.
 * Es lo que se envía en la ejecución periódica para no reenviar todo el sitio.
 */
export async function getRecentUrls(days = 3): Promise<string[]> {
  const { getPublishedPosts } = await import('./blog-collection');
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  const posts = await getPublishedPosts();
  const fresh = posts.filter((post) => {
    const stamp = Date.parse(post.updatedAt || post.publishedAt);
    return Number.isFinite(stamp) && stamp >= cutoff;
  });

  return sanitizeUrls(fresh.map((post) => `${SITE_URL}/blog/${post.slug}`)).filter(isIndexable);
}

function chunk<T>(items: T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    groups.push(items.slice(i, i + size));
  }
  return groups;
}

async function postTo(endpoint: string, urlList: string[]): Promise<IndexNowResult> {
  const payload = {
    host: SITE_HOST,
    key: INDEXNOW_KEY,
    keyLocation: INDEXNOW_KEY_LOCATION,
    urlList,
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });

    // 200 = aceptado, 202 = aceptado pero con validación de clave pendiente.
    const ok = response.status === 200 || response.status === 202;
    let message: string | undefined;
    if (!ok) {
      message = (await response.text().catch(() => '')).slice(0, 300) || undefined;
    }
    return { endpoint, ok, status: response.status, message };
  } catch (error) {
    return {
      endpoint,
      ok: false,
      status: 0,
      message: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Envía las URLs a IndexNow. Se detiene cuando algún endpoint responde bien.
 */
export async function submitToIndexNow(urls: string[]): Promise<{
  submitted: string[];
  results: IndexNowResult[];
}> {
  const submitted = sanitizeUrls(urls);
  if (submitted.length === 0) return { submitted, results: [] };

  const results: IndexNowResult[] = [];

  for (const batch of chunk(submitted, MAX_URLS_PER_REQUEST)) {
    let accepted = false;

    for (const endpoint of ENDPOINTS) {
      const result = await postTo(endpoint, batch);
      results.push(result);
      if (result.ok) {
        accepted = true;
        break;
      }
    }

    if (!accepted) break;
  }

  return { submitted, results };
}
