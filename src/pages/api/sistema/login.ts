import type { APIRoute } from 'astro';
import { rateLimitMiddleware } from '../../../lib/rate-limiter';
import {
  getAdminCredentials,
  SESSION_COOKIE,
  sessionCookieOptions,
  signSession,
  verifyLogin,
} from '../../../lib/sistema-auth';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const limited = rateLimitMiddleware(request);
  if (limited) return limited;

  if (!getAdminCredentials()) {
    return redirect('/sistema/login?error=config');
  }

  const form = await request.formData();
  const user = String(form.get('user') || '');
  const password = String(form.get('password') || '');

  if (!verifyLogin(user, password)) {
    return redirect('/sistema/login?error=credenciales');
  }

  const secure = new URL(request.url).protocol === 'https:';
  cookies.set(SESSION_COOKIE, signSession(user), sessionCookieOptions(secure));
  return redirect('/sistema');
};
