import type { MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import type { Env } from '../env';
import { verifySession } from './session';

export const requireSession: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const token = getCookie(c, 'session');
  if (!token) return c.json({ error: 'Unauthorized' }, 401);

  const payload = await verifySession(token, c.env.SESSION_SECRET);
  if (!payload) return c.json({ error: 'Unauthorized' }, 401);

  await next();
};
