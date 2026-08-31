import { Hono } from 'hono';
import type { Env } from './env';
import { authRoutes } from './routes/auth';
import { lessonsRoutes } from './routes/lessons';
import { requireSession } from './auth/middleware';

const app = new Hono<{ Bindings: Env }>();

app.get('/api/health', (c) => c.json({ ok: true }));
app.route('/api/auth', authRoutes);

// Every other /api/* route added in later tasks is mounted below this
// line and is therefore behind requireSession.
app.use('/api/*', requireSession);

app.route('/api/lessons', lessonsRoutes);

app.get('*', (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
