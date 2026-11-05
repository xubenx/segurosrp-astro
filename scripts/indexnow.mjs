#!/usr/bin/env node
/**
 * IndexNow CLI — notifica URLs nuevas o modificadas a Bing, Yandex, Seznam y Naver.
 *
 * Uso:
 *   node scripts/indexnow.mjs --all                 # todo el sitemap del sitio
 *   node scripts/indexnow.mjs --url /blog/mi-post   # una URL (repetible)
 *   node scripts/indexnow.mjs --from-file urls.txt  # una URL por línea
 *   node scripts/indexnow.mjs --all --dry-run       # sólo muestra qué enviaría
 *
 * Variables de entorno opcionales:
 *   SITE_URL   (default: https://segurosrp.com)
 *   INDEXNOW_KEY  (default: se lee de public/<clave>.txt)
 *
 * Google NO forma parte de IndexNow: para Google usa sitemap + Search Console.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE_URL = (process.env.SITE_URL || 'https://segurosrp.com').replace(/\/$/, '');
const SITE_HOST = new URL(SITE_URL).host;
const MAX_URLS = 10_000;

const ENDPOINTS = ['https://api.indexnow.org/indexnow', 'https://www.bing.com/indexnow'];

function resolveKey() {
  if (process.env.INDEXNOW_KEY) return process.env.INDEXNOW_KEY.trim();

  const publicDir = join(ROOT, 'public');
  const candidates = readdirSync(publicDir).filter((name) => /^[a-f0-9]{8,128}\.txt$/i.test(name));

  for (const name of candidates) {
    const content = readFileSync(join(publicDir, name), 'utf8').trim();
    if (content === name.replace(/\.txt$/i, '')) return content;
  }

  throw new Error(
    'No se encontró la clave de IndexNow. Crea public/<clave>.txt con la clave dentro o define INDEXNOW_KEY.',
  );
}

function parseArgs(argv) {
  const options = { all: false, dryRun: false, urls: [], fromFile: null };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--all') options.all = true;
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--url') options.urls.push(argv[++i]);
    else if (arg.startsWith('--url=')) options.urls.push(arg.slice('--url='.length));
    else if (arg === '--from-file') options.fromFile = argv[++i];
    else if (arg.startsWith('--from-file=')) options.fromFile = arg.slice('--from-file='.length);
    else if (arg === '--help' || arg === '-h') {
      console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 18).join('\n'));
      process.exit(0);
    } else {
      console.warn(`Argumento ignorado: ${arg}`);
    }
  }

  return options;
}

function sanitize(input) {
  const seen = new Set();
  const warnedHosts = new Set();
  const out = [];

  for (const raw of input) {
    if (typeof raw !== 'string') continue;
    const value = raw.trim();
    if (!value || value.startsWith('#')) continue;

    let url;
    try {
      url = new URL(value.startsWith('/') ? `${SITE_URL}${value}` : value);
    } catch {
      console.warn(`URL inválida, se omite: ${value}`);
      continue;
    }

    if (url.host !== SITE_HOST) {
      if (!warnedHosts.has(url.host)) {
        warnedHosts.add(url.host);
        console.warn(`Dominio ajeno a ${SITE_HOST}, se omite: ${url.host} (¿SITE_URL mal configurado?)`);
      }
      continue;
    }

    url.hash = '';
    const normalized = url.toString();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }

  return out;
}

async function fetchSitemapUrls() {
  const sitemapUrl = `${SITE_URL}/sitemap.xml`;
  console.log(`Leyendo ${sitemapUrl} ...`);
  const response = await fetch(sitemapUrl, { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`No se pudo leer el sitemap (HTTP ${response.status})`);

  const xml = await response.text();
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1].replace(/&amp;/g, '&'));
  console.log(`Sitemap: ${urls.length} URLs`);
  return urls;
}

function chunk(items, size) {
  const groups = [];
  for (let i = 0; i < items.length; i += size) groups.push(items.slice(i, i + size));
  return groups;
}

async function submit(endpoint, payload) {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20_000),
    });
    const ok = response.status === 200 || response.status === 202;
    const detail = ok ? '' : (await response.text().catch(() => '')).slice(0, 300);
    return { endpoint, status: response.status, ok, detail };
  } catch (error) {
    return { endpoint, status: 0, ok: false, detail: error.message };
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const key = resolveKey();
  const keyLocation = `${SITE_URL}/${key}.txt`;

  let candidates = [...options.urls];

  if (options.fromFile) {
    const content = readFileSync(join(ROOT, options.fromFile), 'utf8');
    candidates.push(...content.split('\n'));
  }

  if (options.all || candidates.length === 0) {
    try {
      candidates = [...candidates, ...(await fetchSitemapUrls())];
    } catch (error) {
      if (candidates.length === 0) throw error;
      console.warn(`Sitemap no disponible: ${error.message}`);
    }
  }

  const urls = sanitize(candidates);
  if (urls.length === 0) {
    console.error('No hay URLs válidas para enviar.');
    process.exit(1);
  }

  console.log(`Clave: ${key}`);
  console.log(`Archivo de clave: ${keyLocation}`);
  console.log(`URLs a enviar: ${urls.length}`);

  if (options.dryRun) {
    urls.forEach((url) => console.log(`  ${url}`));
    console.log('Modo --dry-run: no se envió nada.');
    return;
  }

  let failures = 0;

  for (const batch of chunk(urls, MAX_URLS)) {
    const payload = { host: SITE_HOST, key, keyLocation, urlList: batch };

    let accepted = false;
    for (const endpoint of ENDPOINTS) {
      const result = await submit(endpoint, payload);
      if (result.ok) {
        console.log(`✓ ${endpoint} → HTTP ${result.status} (${batch.length} URLs)`);
        accepted = true;
        break;
      }
      console.log(`✗ ${endpoint} → HTTP ${result.status}${result.detail ? ` — ${result.detail}` : ''}`);
    }

    if (!accepted) failures += 1;
  }

  if (failures > 0) {
    console.error(`Fallaron ${failures} lote(s). Revisa que /${key}.txt esté publicado en el sitio.`);
    process.exit(1);
  }

  console.log('Listo. IndexNow procesará las URLs en minutos (Bing, Yandex, Seznam, Naver).');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
