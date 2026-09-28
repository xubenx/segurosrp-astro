import { mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from 'dotenv';
import {
  blogPostSchema,
  isValidSlug,
  type BlogPost,
  type BlogPostData,
} from './blog';

config();

const CONTENT_DIR = 'src/content/blog';
const PUBLIC_BLOG_DIR = 'public/blog';

export type UploadedImage = {
  field: 'coverImage' | 'midImage' | 'gallery';
  filename: string;
  contentType: string;
  data: string;
  alt?: string;
};

type GitFile = { path: string; content: Buffer };

function githubConfig() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO || 'xubenx/segurosrp-astro';
  const branch = process.env.GITHUB_BRANCH || 'main';
  return { token, repo, branch };
}

function useGitHub(): boolean {
  return Boolean(process.env.GITHUB_TOKEN);
}

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'segurosrp-sistema',
  };
}

function sanitizeFilename(name: string): string {
  const base = name.split(/[/\\]/).pop() || 'imagen';
  const cleaned = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/-+/g, '-');
  return cleaned.slice(0, 80) || 'imagen.jpg';
}

function extFromType(type: string, fallback: string): string {
  if (type.includes('webp')) return '.webp';
  if (type.includes('png')) return '.png';
  if (type.includes('jpeg') || type.includes('jpg')) return '.jpg';
  if (type.includes('gif')) return '.gif';
  return path.extname(fallback) || '.jpg';
}

async function github<T>(url: string, init: RequestInit = {}): Promise<T> {
  const { token } = githubConfig();
  if (!token) throw new Error('Falta GITHUB_TOKEN');
  const res = await fetch(url, {
    ...init,
    headers: { ...headers(token), ...(init.headers || {}) },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub ${res.status}: ${text.slice(0, 300)}`);
  }
  if (res.status === 204) return {} as T;
  return (await res.json()) as T;
}

function parsePost(slug: string, raw: string): BlogPost {
  const parsed = blogPostSchema.parse(JSON.parse(raw));
  return { ...parsed, slug };
}

export async function listPosts(): Promise<BlogPost[]> {
  if (useGitHub()) return listPostsGitHub();
  return listPostsLocal();
}

async function listPostsLocal(): Promise<BlogPost[]> {
  const dir = path.join(process.cwd(), CONTENT_DIR);
  try {
    const files = (await readdir(dir)).filter((f) => f.endsWith('.json'));
    const posts = await Promise.all(
      files.map(async (file) => {
        const raw = await readFile(path.join(dir, file), 'utf8');
        return parsePost(file.replace(/\.json$/, ''), raw);
      }),
    );
    return posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  } catch {
    return [];
  }
}

async function readGitHubFile(rel: string): Promise<string | null> {
  const { repo, branch } = githubConfig();
  try {
    const file = await github<{ content?: string }>(
      `https://api.github.com/repos/${repo}/contents/${rel}?ref=${branch}`,
    );
    if (!file.content) return null;
    return Buffer.from(file.content, 'base64').toString('utf8');
  } catch (error) {
    if (String(error).includes('404')) return null;
    throw error;
  }
}

export async function getPost(slug: string): Promise<BlogPost | null> {
  if (!isValidSlug(slug)) return null;
  if (useGitHub()) {
    const raw = await readGitHubFile(`${CONTENT_DIR}/${slug}.json`);
    return raw ? parsePost(slug, raw) : null;
  }
  try {
    const raw = await readFile(path.join(process.cwd(), CONTENT_DIR, `${slug}.json`), 'utf8');
    return parsePost(slug, raw);
  } catch {
    return null;
  }
}

async function listPostsGitHub(): Promise<BlogPost[]> {
  const { repo, branch } = githubConfig();
  type Entry = { name: string; type: string };
  let entries: Entry[] = [];
  try {
    entries = await github<Entry[]>(
      `https://api.github.com/repos/${repo}/contents/${CONTENT_DIR}?ref=${branch}`,
    );
  } catch (error) {
    if (String(error).includes('404')) return [];
    throw error;
  }

  const files = entries.filter((e) => e.type === 'file' && e.name.endsWith('.json'));
  const posts = await Promise.all(
    files.map(async (file) => {
      const slug = file.name.replace(/\.json$/, '');
      const raw = await readGitHubFile(`${CONTENT_DIR}/${file.name}`);
      if (!raw) throw new Error(`No se pudo leer ${file.name}`);
      return parsePost(slug, raw);
    }),
  );
  return posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

function applyImages(post: BlogPostData, slug: string, images: UploadedImage[]) {
  const gallery = [...(post.gallery || [])];
  const files: GitFile[] = [];

  for (const image of images) {
    const buffer = Buffer.from(image.data, 'base64');
    if (buffer.byteLength > 1_800_000) {
      throw new Error(`La imagen ${image.filename} supera 1.8 MB. Comprime antes de subirla.`);
    }
    const ext = extFromType(image.contentType, image.filename);
    const filename = sanitizeFilename(image.filename.replace(/\.[^.]+$/, '') + ext);
    const rel = `${PUBLIC_BLOG_DIR}/${slug}/${filename}`;
    const publicPath = `/blog/${slug}/${filename}`;
    files.push({ path: rel, content: buffer });

    if (image.field === 'coverImage') {
      post.coverImage = publicPath;
      if (image.alt) post.coverAlt = image.alt;
    } else if (image.field === 'midImage') {
      post.midImage = publicPath;
      if (image.alt) post.midImageAlt = image.alt;
    } else {
      gallery.push({ src: publicPath, alt: image.alt || post.title });
    }
  }

  if (gallery.length) post.gallery = gallery;
  return files;
}

export async function savePost(slug: string, data: BlogPostData, images: UploadedImage[] = []) {
  if (!isValidSlug(slug)) throw new Error('Slug inválido');
  const post = blogPostSchema.parse(data);
  const imageFiles = applyImages(post, slug, images);
  const jsonPath = `${CONTENT_DIR}/${slug}.json`;
  const json = `${JSON.stringify(post, null, 2)}\n`;

  if (useGitHub()) {
    await commitFiles(
      [{ path: jsonPath, content: Buffer.from(json, 'utf8') }, ...imageFiles],
      post.draft ? `Borrador: ${post.title}` : `Blog: ${post.title}`,
    );
  } else {
    await saveLocal(jsonPath, Buffer.from(json, 'utf8'));
    for (const file of imageFiles) await saveLocal(file.path, file.content);
  }

  return { ...post, slug };
}

export async function deletePost(slug: string) {
  if (!isValidSlug(slug)) throw new Error('Slug inválido');
  const jsonPath = `${CONTENT_DIR}/${slug}.json`;
  if (useGitHub()) {
    const { repo, branch } = githubConfig();
    type Meta = { sha: string };
    const meta = await github<Meta>(
      `https://api.github.com/repos/${repo}/contents/${jsonPath}?ref=${branch}`,
    );
    await github(`https://api.github.com/repos/${repo}/contents/${jsonPath}`, {
      method: 'DELETE',
      body: JSON.stringify({
        message: `Eliminar blog: ${slug}`,
        sha: meta.sha,
        branch,
      }),
    });
    return;
  }
  await unlink(path.join(process.cwd(), jsonPath)).catch(() => undefined);
}

async function saveLocal(rel: string, content: Buffer) {
  const full = path.join(process.cwd(), rel);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, content);
}

async function commitFiles(files: GitFile[], message: string) {
  const { token, repo, branch } = githubConfig();
  if (!token) throw new Error('Falta GITHUB_TOKEN en las variables de entorno');

  const ref = await github<{ object: { sha: string } }>(
    `https://api.github.com/repos/${repo}/git/ref/heads/${branch}`,
  );
  const parentSha = ref.object.sha;
  const commit = await github<{ tree: { sha: string } }>(
    `https://api.github.com/repos/${repo}/git/commits/${parentSha}`,
  );

  const blobs = await Promise.all(
    files.map(async (file) => {
      const blob = await github<{ sha: string }>(
        `https://api.github.com/repos/${repo}/git/blobs`,
        {
          method: 'POST',
          body: JSON.stringify({
            content: file.content.toString('base64'),
            encoding: 'base64',
          }),
        },
      );
      return { path: file.path, mode: '100644', type: 'blob', sha: blob.sha };
    }),
  );

  const tree = await github<{ sha: string }>(
    `https://api.github.com/repos/${repo}/git/trees`,
    {
      method: 'POST',
      body: JSON.stringify({ base_tree: commit.tree.sha, tree: blobs }),
    },
  );

  const newCommit = await github<{ sha: string }>(
    `https://api.github.com/repos/${repo}/git/commits`,
    {
      method: 'POST',
      body: JSON.stringify({
        message,
        tree: tree.sha,
        parents: [parentSha],
      }),
    },
  );

  await github(`https://api.github.com/repos/${repo}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: newCommit.sha }),
  });
}

export function publishHint(): string {
  if (useGitHub()) {
    return 'Guardado en GitHub. Vercel redespliega solo; el artículo público aparece en 1–2 minutos.';
  }
  return 'Guardado en este equipo (modo local). En producción configura GITHUB_TOKEN para publicar sin intervención.';
}
