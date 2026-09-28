import { defineMiddleware } from 'astro:middleware';
import { isAuthenticated } from './lib/sistema-auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const isSistema =
    pathname === '/sistema' ||
    pathname.startsWith('/sistema/') ||
    pathname.startsWith('/api/sistema/');
  const isPublicAuth =
    pathname === '/sistema/login' ||
    pathname === '/api/sistema/login';

  if (!isSistema || isPublicAuth) {
    return next();
  }

  if (!isAuthenticated(context.cookies)) {
    if (pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ success: false, message: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return context.redirect('/sistema/login');
  }

  return next();
});
