import { defineMiddleware } from 'astro:middleware';
import { isAuthenticated } from './lib/sistema-auth';

// Same destinations as vercel.json. The edge redirect runs first in production;
// this copy keeps query strings (gclid, utm) and applies when the request reaches the app.
const SEO_REDIRECTS: Record<string, string> = {
  '/asesores-seguros-monterrey': '/asesores-seguros-monterrey-nyl',
  '/asesores-seguros-monterrey/': '/asesores-seguros-monterrey-nyl',
  '/asesores-seguros-monterrey-nyl/': '/asesores-seguros-monterrey-nyl',
  '/seguros-monterrey-en-celaya': '/seguros-monterrey-en-celaya-gto',
  '/seguros-monterrey-en-celaya/': '/seguros-monterrey-en-celaya-gto',
  '/seguro-de-vida-mujer': '/seguros-vida/vida-mujer',
  '/seguro-de-vida-mujer/': '/seguros-vida/vida-mujer',
};

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname, search } = context.url;
  const destination = SEO_REDIRECTS[pathname];
  if (destination && (context.request.method === 'GET' || context.request.method === 'HEAD')) {
    return context.redirect(`${destination}${search}`, 301);
  }

  const { pathname: authPath } = context.url;
  const isSistema =
    authPath === '/sistema' ||
    authPath.startsWith('/sistema/') ||
    authPath.startsWith('/api/sistema/');
  const isPublicAuth =
    authPath === '/sistema/login' ||
    authPath === '/api/sistema/login';

  if (!isSistema || isPublicAuth) {
    return next();
  }

  if (!isAuthenticated(context.cookies)) {
    if (authPath.startsWith('/api/')) {
      return new Response(JSON.stringify({ success: false, message: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return context.redirect('/sistema/login');
  }

  return next();
});
