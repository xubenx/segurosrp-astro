import type { APIRoute } from 'astro';
import {
  INDEXNOW_KEY,
  INDEXNOW_KEY_LOCATION,
  getRecentUrls,
  getSitemapUrls,
  sanitizeUrls,
  submitToIndexNow,
} from '../../lib/indexnow';

/**
 * POST /api/indexnow
 *
 * Notifica a IndexNow (Bing, Yandex, Seznam, Naver) que una o varias URLs
 * nuevas o modificadas deben reindexarse.
 *
 * Autenticación: header `x-indexnow-secret` o `Authorization: Bearer <secreto>`
 * comparado con la variable de entorno INDEXNOW_SECRET.
 *
 * Body (JSON, opcional):
 *   { "urls": ["/blog/nuevo-articulo"] }  → envía sólo esas URLs
 *   { "all": true }                       → envía todo el sitemap
 *   { "dryRun": true }                    → sólo devuelve qué enviaría
 *
 * Ejemplos:
 *   curl -X POST https://segurosrp.com/api/indexnow \
 *     -H "x-indexnow-secret: $INDEXNOW_SECRET" \
 *     -H "content-type: application/json" \
 *     -d '{"all":true}'
 *
 * GET /api/indexnow — ejecución periódica (Vercel Cron).
 * Envía sólo los artículos del blog modificados en los últimos días.
 * Requiere `Authorization: Bearer <CRON_SECRET>`, que Vercel añade solo
 * cuando la variable CRON_SECRET está configurada en el proyecto.
 */

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function readToken(request: Request): string | null {
  const headerSecret = request.headers.get('x-indexnow-secret');
  if (headerSecret) return headerSecret.trim();

  const authorization = request.headers.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

/** Comparación de tiempo constante para no filtrar el secreto por timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function authorized(request: Request, expected: string | undefined): boolean {
  if (!expected) return false;
  const token = readToken(request);
  return token !== null && safeEqual(token, expected);
}

export const POST: APIRoute = async ({ request }) => {
  const secret = import.meta.env.INDEXNOW_SECRET || process.env.INDEXNOW_SECRET;
  if (!secret) {
    return json(
      {
        success: false,
        message:
          'Falta la variable de entorno INDEXNOW_SECRET. Configúrala en Vercel para habilitar este endpoint.',
      },
      503,
    );
  }

  if (!authorized(request, secret)) {
    return json({ success: false, message: 'No autorizado.' }, 401);
  }

  let body: { urls?: unknown; all?: unknown; dryRun?: unknown } = {};
  if (request.headers.get('content-type')?.includes('application/json')) {
    body = await request.json().catch(() => ({}));
  }

  const dryRun = body.dryRun === true;
  const wantsAll = body.all === true;
  const explicitUrls = Array.isArray(body.urls) ? body.urls.filter((u): u is string => typeof u === 'string') : [];

  let urls: string[];
  if (wantsAll) {
    urls = await getSitemapUrls();
  } else if (explicitUrls.length > 0) {
    urls = sanitizeUrls(explicitUrls);
  } else {
    return json(
      {
        success: false,
        message: 'Indica "urls": ["/ruta"] o "all": true.',
      },
      400,
    );
  }

  if (urls.length === 0) {
    return json({ success: false, message: 'No hay URLs válidas para enviar.' }, 400);
  }

  if (dryRun) {
    return json({ success: true, dryRun: true, count: urls.length, urls });
  }

  const { submitted, results } = await submitToIndexNow(urls);
  const accepted = results.some((result) => result.ok);

  return json(
    {
      success: accepted,
      count: submitted.length,
      keyLocation: INDEXNOW_KEY_LOCATION,
      key: INDEXNOW_KEY,
      results,
    },
    accepted ? 200 : 502,
  );
};

export const GET: APIRoute = async ({ request }) => {
  const cronSecret = import.meta.env.CRON_SECRET || process.env.CRON_SECRET;
  if (!cronSecret) {
    return json(
      {
        success: false,
        message:
          'Falta la variable de entorno CRON_SECRET. Configúrala en Vercel para habilitar la ejecución periódica.',
      },
      503,
    );
  }

  if (!authorized(request, cronSecret)) {
    return json({ success: false, message: 'No autorizado.' }, 401);
  }

  // Sólo lo que cambió recientemente: evita reenviar todo el sitio a diario.
  const urls = await getRecentUrls(3);

  if (urls.length === 0) {
    return json({ success: true, message: 'Sin cambios recientes.', count: 0 });
  }

  const { submitted, results } = await submitToIndexNow(urls);
  const accepted = results.some((result) => result.ok);

  return json({ success: accepted, count: submitted.length, urls: submitted, results }, accepted ? 200 : 502);
};
