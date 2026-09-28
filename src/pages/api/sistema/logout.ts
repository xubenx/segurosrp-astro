import type { APIRoute } from 'astro';
import { SESSION_COOKIE } from '../../../lib/sistema-auth';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete(SESSION_COOKIE, { path: '/' });
  return redirect('/sistema/login');
};
