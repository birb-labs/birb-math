import { Hono } from 'hono';
import type { Env } from './env';
import { authRoutes } from './routes/auth';
import { exportRoutes } from './routes/export';
import { lessonsRoutes } from './routes/lessons';
import { previewRoutes } from './routes/preview';
import { questionsRoutes, tagsRoutes } from './routes/questions';
import { requireSession } from './auth/middleware';

const app = new Hono<{ Bindings: Env }>();

app.get('/api/health', (c) => c.json({ ok: true }));
app.route('/api/auth', authRoutes);
// Authenticated by its own Bearer-token check against EXPORT_SECRET, not
// the human session cookie, since the caller is CI (Task 17's build
// pipeline), not a logged-in admin — so it must stay above requireSession.
app.route('/api/export', exportRoutes);

// Every other /api/* route added in later tasks is mounted below this
// line and is therefore behind requireSession.
app.use('/api/*', requireSession);

app.route('/api/lessons', lessonsRoutes);
app.route('/api/preview', previewRoutes);
app.route('/api/questions', questionsRoutes);
app.route('/api/tags', tagsRoutes);

app.get('*', (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
