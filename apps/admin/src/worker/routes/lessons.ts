import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import {
  getD1Db,
  getContentTree,
  subjects,
  subjectTranslations,
  topics,
  topicTranslations,
  sections,
  sectionTranslations,
  lessons,
  lessonTranslations,
  type Locale,
} from '@birb-math/content-schema';
import type { Env } from '../env';
import { validateTranslationLocales } from './translationInput';

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
  const body = await c.req.json<{ slug: string; order: number; translations: Partial<Record<Locale, { name: string }>> }>();
  const localeError = validateTranslationLocales(body.translations, { requirePtBr: true });
  if (localeError) return c.json({ error: localeError }, 400);
  const locales = Object.keys(body.translations) as Locale[];

  const [row] = await db.insert(subjects).values({ slug: body.slug, order: body.order }).returning();
  await db
    .insert(subjectTranslations)
    .values(locales.map((locale) => ({ subjectId: row.id, locale, name: body.translations[locale]!.name })))
    .run();
  return c.json(row, 201);
});

lessonsRoutes.patch('/subjects/:id', async (c) => {
  const db = getD1Db(c.env.DB);
  const id = Number(c.req.param('id'));
  const body = await c.req.json<Partial<{ slug: string; order: number; translations: Partial<Record<Locale, { name: string }>> }>>();
  const { translations, ...structuralFields } = body;
  if (translations) {
    const localeError = validateTranslationLocales(translations, { requirePtBr: false });
    if (localeError) return c.json({ error: localeError }, 400);
  }
  if (Object.keys(structuralFields).length > 0) {
    await db.update(subjects).set(structuralFields).where(eq(subjects.id, id)).run();
  }
  if (translations) {
    for (const locale of Object.keys(translations) as Locale[]) {
      await db
        .insert(subjectTranslations)
        .values({ subjectId: id, locale, name: translations[locale]!.name })
        .onConflictDoUpdate({
          target: [subjectTranslations.subjectId, subjectTranslations.locale],
          set: { name: translations[locale]!.name },
        })
        .run();
    }
  }
  return c.json({ ok: true });
});

lessonsRoutes.post('/topics', async (c) => {
  const db = getD1Db(c.env.DB);
  const body = await c.req.json<{ subjectId: number; slug: string; order: number; translations: Partial<Record<Locale, { name: string }>> }>();
  const localeError = validateTranslationLocales(body.translations, { requirePtBr: true });
  if (localeError) return c.json({ error: localeError }, 400);
  const locales = Object.keys(body.translations) as Locale[];

  const [row] = await db.insert(topics).values({ subjectId: body.subjectId, slug: body.slug, order: body.order }).returning();
  await db
    .insert(topicTranslations)
    .values(locales.map((locale) => ({ topicId: row.id, locale, name: body.translations[locale]!.name })))
    .run();
  return c.json(row, 201);
});

lessonsRoutes.patch('/topics/:id', async (c) => {
  const db = getD1Db(c.env.DB);
  const id = Number(c.req.param('id'));
  const body = await c.req.json<Partial<{ subjectId: number; slug: string; order: number; translations: Partial<Record<Locale, { name: string }>> }>>();
  const { translations, ...structuralFields } = body;
  if (translations) {
    const localeError = validateTranslationLocales(translations, { requirePtBr: false });
    if (localeError) return c.json({ error: localeError }, 400);
  }
  if (Object.keys(structuralFields).length > 0) {
    await db.update(topics).set(structuralFields).where(eq(topics.id, id)).run();
  }
  if (translations) {
    for (const locale of Object.keys(translations) as Locale[]) {
      await db
        .insert(topicTranslations)
        .values({ topicId: id, locale, name: translations[locale]!.name })
        .onConflictDoUpdate({
          target: [topicTranslations.topicId, topicTranslations.locale],
          set: { name: translations[locale]!.name },
        })
        .run();
    }
  }
  return c.json({ ok: true });
});

lessonsRoutes.post('/sections', async (c) => {
  const db = getD1Db(c.env.DB);
  const body = await c.req.json<{ topicId: number; slug: string; order: number; translations: Partial<Record<Locale, { name: string }>> }>();
  const localeError = validateTranslationLocales(body.translations, { requirePtBr: true });
  if (localeError) return c.json({ error: localeError }, 400);
  const locales = Object.keys(body.translations) as Locale[];

  const [row] = await db.insert(sections).values({ topicId: body.topicId, slug: body.slug, order: body.order }).returning();
  await db
    .insert(sectionTranslations)
    .values(locales.map((locale) => ({ sectionId: row.id, locale, name: body.translations[locale]!.name })))
    .run();
  return c.json(row, 201);
});

lessonsRoutes.patch('/sections/:id', async (c) => {
  const db = getD1Db(c.env.DB);
  const id = Number(c.req.param('id'));
  const body = await c.req.json<Partial<{ topicId: number; slug: string; order: number; translations: Partial<Record<Locale, { name: string }>> }>>();
  const { translations, ...structuralFields } = body;
  if (translations) {
    const localeError = validateTranslationLocales(translations, { requirePtBr: false });
    if (localeError) return c.json({ error: localeError }, 400);
  }
  if (Object.keys(structuralFields).length > 0) {
    await db.update(sections).set(structuralFields).where(eq(sections.id, id)).run();
  }
  if (translations) {
    for (const locale of Object.keys(translations) as Locale[]) {
      await db
        .insert(sectionTranslations)
        .values({ sectionId: id, locale, name: translations[locale]!.name })
        .onConflictDoUpdate({
          target: [sectionTranslations.sectionId, sectionTranslations.locale],
          set: { name: translations[locale]!.name },
        })
        .run();
    }
  }
  return c.json({ ok: true });
});

lessonsRoutes.post('/lessons', async (c) => {
  const db = getD1Db(c.env.DB);
  const body = await c.req.json<{
    sectionId: number;
    slug: string;
    order: number;
    translations: Partial<Record<Locale, { title: string; bodyMdx: string }>>;
  }>();
  const localeError = validateTranslationLocales(body.translations, { requirePtBr: true });
  if (localeError) return c.json({ error: localeError }, 400);
  const locales = Object.keys(body.translations) as Locale[];

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
  if (translations) {
    const localeError = validateTranslationLocales(translations, { requirePtBr: false });
    if (localeError) return c.json({ error: localeError }, 400);
  }
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

// Every subject/topic/section/lesson has at least one `*_translations` child row
// pointing at it through a foreign key declared with `ON DELETE no action`, so the
// child rows must be deleted before the parent or D1 rejects the delete with a
// foreign-key-constraint error — same delete-children-then-parent shape as
// `deleteOptionsAndPairs` in `questions.ts`.
lessonsRoutes.delete('/subjects/:id', async (c) => {
  const db = getD1Db(c.env.DB);
  const id = Number(c.req.param('id'));
  await db.delete(subjectTranslations).where(eq(subjectTranslations.subjectId, id)).run();
  await db.delete(subjects).where(eq(subjects.id, id)).run();
  return c.json({ ok: true });
});

lessonsRoutes.delete('/topics/:id', async (c) => {
  const db = getD1Db(c.env.DB);
  const id = Number(c.req.param('id'));
  await db.delete(topicTranslations).where(eq(topicTranslations.topicId, id)).run();
  await db.delete(topics).where(eq(topics.id, id)).run();
  return c.json({ ok: true });
});

lessonsRoutes.delete('/sections/:id', async (c) => {
  const db = getD1Db(c.env.DB);
  const id = Number(c.req.param('id'));
  await db.delete(sectionTranslations).where(eq(sectionTranslations.sectionId, id)).run();
  await db.delete(sections).where(eq(sections.id, id)).run();
  return c.json({ ok: true });
});

lessonsRoutes.delete('/lessons/:id', async (c) => {
  const db = getD1Db(c.env.DB);
  const id = Number(c.req.param('id'));
  await db.delete(lessonTranslations).where(eq(lessonTranslations.lessonId, id)).run();
  await db.delete(lessons).where(eq(lessons.id, id)).run();
  return c.json({ ok: true });
});
