import type { APIRoute } from 'astro';
import { blogPostSchema, isValidSlug } from '../../../lib/blog';
import { publishHint, savePost, type UploadedImage } from '../../../lib/github-content';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const slug = String(body.slug || '');
    if (!isValidSlug(slug)) {
      return json({ success: false, message: 'Slug inválido. Usa minúsculas, números y guiones.' }, 400);
    }

    const parsed = blogPostSchema.safeParse(body.post);
    if (!parsed.success) {
      return json({ success: false, message: parsed.error.issues[0]?.message || 'Datos inválidos' }, 400);
    }

    const images = Array.isArray(body.images) ? (body.images as UploadedImage[]) : [];
    await savePost(slug, parsed.data, images);
    return json({ success: true, message: publishHint(), slug });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo guardar';
    return json({ success: false, message }, 500);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
