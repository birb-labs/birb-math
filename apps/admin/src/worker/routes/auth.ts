import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import type { Env } from '../env';
import { verifyPassword } from '../auth/password';
import { signSession } from '../auth/session';

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export const authRoutes = new Hono<{ Bindings: Env }>();

authRoutes.post('/login', async (c) => {
  const { username, password } = await c.req.json<{ username?: string; password?: string }>();

  if (!username || !password || username !== c.env.ADMIN_USERNAME) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const valid = await verifyPassword(password, c.env.ADMIN_PASSWORD_HASH);
  if (!valid) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const token = await signSession({ exp: Date.now() + SESSION_TTL_MS }, c.env.SESSION_SECRET);
  setCookie(c, 'session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  });

  return c.json({ ok: true });
});

authRoutes.post('/logout', (c) => {
  deleteCookie(c, 'session', { path: '/' });
  return c.json({ ok: true });
});
