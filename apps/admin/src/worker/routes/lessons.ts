import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { getD1Db, getContentTree, subjects, topics, sections, lessons } from '@birb-math/content-schema';
import type { Env } from '../env';

export const lessonsRoutes = new Hono<{ Bindings: Env }>();

lessonsRoutes.get('/tree', async (c) => {
  const db = getD1Db(c.env.DB);
  return c.json(await getContentTree(db));
});

lessonsRoutes.post('/subjects', async (c) => {
  const db = getD1Db(c.env.DB);
  const body = await c.req.json<{ slug: string; name: string; order: number }>();
  const [row] = await db.insert(subjects).values(body).returning();
  return c.json(row, 201);
});

lessonsRoutes.post('/topics', async (c) => {
  const db = getD1Db(c.env.DB);
  const body = await c.req.json<{ subjectId: number; slug: string; name: string; order: number }>();
  const [row] = await db.insert(topics).values(body).returning();
  return c.json(row, 201);
});

lessonsRoutes.post('/sections', async (c) => {
  const db = getD1Db(c.env.DB);
  const body = await c.req.json<{ topicId: number; slug: string; name: string; order: number }>();
  const [row] = await db.insert(sections).values(body).returning();
  return c.json(row, 201);
});

lessonsRoutes.post('/lessons', async (c) => {
  const db = getD1Db(c.env.DB);
  const body = await c.req.json<{ sectionId: number; slug: string; title: string; bodyMdx: string; order: number }>();
  const [row] = await db.insert(lessons).values(body).returning();
  return c.json(row, 201);
});

lessonsRoutes.patch('/lessons/:id', async (c) => {
  const db = getD1Db(c.env.DB);
  const id = Number(c.req.param('id'));
  const body = await c.req.json<Partial<{ slug: string; title: string; bodyMdx: string; order: number }>>();
  await db.update(lessons).set(body).where(eq(lessons.id, id)).run();
  return c.json({ ok: true });
});

lessonsRoutes.delete('/subjects/:id', async (c) => {
  await getD1Db(c.env.DB).delete(subjects).where(eq(subjects.id, Number(c.req.param('id')))).run();
  return c.json({ ok: true });
});

lessonsRoutes.delete('/topics/:id', async (c) => {
  await getD1Db(c.env.DB).delete(topics).where(eq(topics.id, Number(c.req.param('id')))).run();
  return c.json({ ok: true });
});

lessonsRoutes.delete('/sections/:id', async (c) => {
  await getD1Db(c.env.DB).delete(sections).where(eq(sections.id, Number(c.req.param('id')))).run();
  return c.json({ ok: true });
});

lessonsRoutes.delete('/lessons/:id', async (c) => {
  await getD1Db(c.env.DB).delete(lessons).where(eq(lessons.id, Number(c.req.param('id')))).run();
  return c.json({ ok: true });
});
