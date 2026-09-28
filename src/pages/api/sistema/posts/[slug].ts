import type { APIRoute } from 'astro';
import { isValidSlug } from '../../../../lib/blog';
import { deletePost } from '../../../../lib/github-content';

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const slug = params.slug || '';
    if (!isValidSlug(slug)) {
      return new Response(JSON.stringify({ success: false, message: 'Slug inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    await deletePost(slug);
    return new Response(
      JSON.stringify({ success: true, message: 'Eliminado. Vercel actualizará el sitio en unos minutos.' }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo eliminar';
    return new Response(JSON.stringify({ success: false, message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
