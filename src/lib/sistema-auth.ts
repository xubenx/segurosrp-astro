import { createHmac, timingSafeEqual } from 'node:crypto';
import type { AstroCookies } from 'astro';
import { config } from 'dotenv';

config();

export const SESSION_COOKIE = 'srp_sistema';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function secret(): string {
  return process.env.SISTEMA_SECRET || process.env.SISTEMA_PASSWORD || '';
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}

export function getAdminCredentials(): { user: string; password: string } | null {
  const user = process.env.SISTEMA_USER;
  const password = process.env.SISTEMA_PASSWORD;
  if (!user || !password) return null;
  return { user, password };
}

export function verifyLogin(user: string, password: string): boolean {
  const creds = getAdminCredentials();
  if (!creds) return false;
  return safeEqual(user, creds.user) && safeEqual(password, creds.password);
}

export function signSession(user: string): string {
  const exp = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `${user}.${exp}`;
  const sig = createHmac('sha256', secret()).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export function readSession(token: string | undefined): string | null {
  if (!token || !secret()) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [user, expRaw, sig] = parts;
  const payload = `${user}.${expRaw}`;
  const expected = createHmac('sha256', secret()).update(payload).digest('hex');
  if (!safeEqual(sig, expected)) return null;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || Date.now() > exp) return null;
  return user;
}

export function isAuthenticated(cookies: AstroCookies): boolean {
  return Boolean(readSession(cookies.get(SESSION_COOKIE)?.value));
}

export function sessionCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure,
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  };
}
