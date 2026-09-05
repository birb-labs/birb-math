import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import {
  getD1Db,
  getContentTree,
  subjects,
  topics,
  sections,
  lessons,
  lessonTranslations,
  type Locale,
} from '@birb-math/content-schema';
import type { Env } from '../env';

export const lessonsRoutes = new Hono<{ Bindings: Env }>();

lessonsRoutes.get('/tree', async (c) => {
  const db = getD1Db(c.env.DB);
  const tree = await getContentTree(db, 'pt-BR');
  const allLessons = await db.select({ id: lessons.id, slug: lessons.slug }).from(lessons).all();
  const idBySlug = new Map(allLessons.map((lesson) => [lesson.slug, lesson.id]));

  return c.json(
    tree.map((subject) => ({
      ...subject,
      topics: subject.topics.map((topic) => ({
        ...topic,
        sections: topic.sections.map((section) => ({
          ...section,
          lessons: section.lessons.map((lesson) => ({ ...lesson, id: idBySlug.get(lesson.slug) })),
        })),
      })),
    })),
  );
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
  const body = await c.req.json<{
    sectionId: number;
    slug: string;
    order: number;
    translations: Partial<Record<Locale, { title: string; bodyMdx: string }>>;
  }>();
  const locales = Object.keys(body.translations) as Locale[];
  if (locales.length === 0) {
    return c.json({ error: 'At least one locale translation is required.' }, 400);
  }

  const [row] = await db
    .insert(lessons)
    .values({ sectionId: body.sectionId, slug: body.slug, order: body.order })
    .returning();

  await db
    .insert(lessonTranslations)
    .values(
      locales.map((locale) => ({
        lessonId: row.id,
        locale,
        title: body.translations[locale]!.title,
        bodyMdx: body.translations[locale]!.bodyMdx,
      })),
    )
    .run();

  return c.json(row, 201);
});

lessonsRoutes.get('/lessons/:id', async (c) => {
  const db = getD1Db(c.env.DB);
  const id = Number(c.req.param('id'));
  const row = await db.select().from(lessons).where(eq(lessons.id, id)).get();
  if (!row) return c.json({ error: 'Not found' }, 404);

  const translationRows = await db.select().from(lessonTranslations).where(eq(lessonTranslations.lessonId, id)).all();
  const translations: Partial<Record<Locale, { title: string; bodyMdx: string }>> = {};
  for (const t of translationRows) {
    translations[t.locale as Locale] = { title: t.title, bodyMdx: t.bodyMdx };
  }

  return c.json({ sectionId: row.sectionId, slug: row.slug, order: row.order, translations });
});

lessonsRoutes.patch('/lessons/:id', async (c) => {
  const db = getD1Db(c.env.DB);
  const id = Number(c.req.param('id'));
  const body = await c.req.json<
    Partial<{
      sectionId: number;
      slug: string;
      order: number;
      translations: Partial<Record<Locale, { title: string; bodyMdx: string }>>;
    }>
  >();

  const { translations, ...structuralFields } = body;
  if (Object.keys(structuralFields).length > 0) {
    await db.update(lessons).set(structuralFields).where(eq(lessons.id, id)).run();
  }

  if (translations) {
    for (const locale of Object.keys(translations) as Locale[]) {
      const t = translations[locale]!;
      await db
        .insert(lessonTranslations)
        .values({ lessonId: id, locale, title: t.title, bodyMdx: t.bodyMdx })
        .onConflictDoUpdate({
          target: [lessonTranslations.lessonId, lessonTranslations.locale],
          set: { title: t.title, bodyMdx: t.bodyMdx },
        })
        .run();
    }
  }

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
