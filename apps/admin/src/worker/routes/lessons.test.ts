import { describe, expect, it, beforeAll, beforeEach } from 'vitest';
import { env, applyD1Migrations, SELF } from 'cloudflare:test';
import { hashPassword } from '../auth/password';

declare module 'cloudflare:test' {
  interface ProvidedEnv {
    DB: D1Database;
    ADMIN_USERNAME: string;
    ADMIN_PASSWORD_HASH: string;
    SESSION_SECRET: string;
  }
}

let sessionCookie = '';

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  env.ADMIN_USERNAME = 'admin';
  env.ADMIN_PASSWORD_HASH = await hashPassword('test-password');
  env.SESSION_SECRET = 'test-session-secret';
});

beforeEach(async () => {
  const response = await SELF.fetch('https://admin.test/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'test-password' }),
  });
  sessionCookie = response.headers.get('set-cookie')!.split(';')[0];
});

describe('lesson hierarchy CRUD', () => {
  it('creates a subject, topic, section, and lesson, then reads them back via the tree', async () => {
    const headers = { 'Content-Type': 'application/json', Cookie: sessionCookie };

    const subjectResponse = await SELF.fetch('https://admin.test/api/lessons/subjects', {
      method: 'POST',
      headers,
      body: JSON.stringify({ slug: 'calculo', order: 1, translations: { 'pt-BR': { name: 'Cálculo' } } }),
    });
    expect(subjectResponse.status).toBe(201);
    const subject = await subjectResponse.json<{ id: number }>();

    const topicResponse = await SELF.fetch('https://admin.test/api/lessons/topics', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        subjectId: subject.id,
        slug: 'limites',
        order: 1,
        translations: { 'pt-BR': { name: 'Limites' } },
      }),
    });
    const topic = await topicResponse.json<{ id: number }>();

    const sectionResponse = await SELF.fetch('https://admin.test/api/lessons/sections', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        topicId: topic.id,
        slug: 'intro',
        order: 1,
        translations: { 'pt-BR': { name: 'Introdução' } },
      }),
    });
    const section = await sectionResponse.json<{ id: number }>();

    const lessonResponse = await SELF.fetch('https://admin.test/api/lessons/lessons', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sectionId: section.id,
        slug: 'o-que-e-um-limite',
        order: 1,
        translations: {
          'pt-BR': { title: 'O que é um limite?', bodyMdx: '# Título' },
        },
      }),
    });
    expect(lessonResponse.status).toBe(201);

    const treeResponse = await SELF.fetch('https://admin.test/api/lessons/tree', { headers: { Cookie: sessionCookie } });
    const tree = await treeResponse.json<Array<{ slug: string; topics: Array<{ slug: string }> }>>();
    expect(tree.find((s) => s.slug === 'calculo')?.topics.find((t) => t.slug === 'limites')).toBeDefined();
  });

  it('updates a lesson body and rejects unauthenticated requests', async () => {
    const unauthed = await SELF.fetch('https://admin.test/api/lessons/tree');
    expect(unauthed.status).toBe(401);
  });
});

describe('lesson translations', () => {
  async function createLesson(): Promise<number> {
    const headers = { 'Content-Type': 'application/json', Cookie: sessionCookie };

    const subjectResponse = await SELF.fetch('https://admin.test/api/lessons/subjects', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        slug: `calculo-${Date.now()}-${Math.random()}`,
        order: 1,
        translations: { 'pt-BR': { name: 'Cálculo' } },
      }),
    });
    const subject = await subjectResponse.json<{ id: number }>();

    const topicResponse = await SELF.fetch('https://admin.test/api/lessons/topics', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        subjectId: subject.id,
        slug: `limites-${Date.now()}-${Math.random()}`,
        order: 1,
        translations: { 'pt-BR': { name: 'Limites' } },
      }),
    });
    const topic = await topicResponse.json<{ id: number }>();

    const sectionResponse = await SELF.fetch('https://admin.test/api/lessons/sections', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        topicId: topic.id,
        slug: `intro-${Date.now()}-${Math.random()}`,
        order: 1,
        translations: { 'pt-BR': { name: 'Introdução' } },
      }),
    });
    const section = await sectionResponse.json<{ id: number }>();

    const lessonResponse = await SELF.fetch('https://admin.test/api/lessons/lessons', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sectionId: section.id,
        slug: `o-que-e-um-limite-${Date.now()}-${Math.random()}`,
        order: 1,
        translations: {
          'pt-BR': { title: 'O que é um limite?', bodyMdx: '# Título' },
        },
      }),
    });
    const lesson = await lessonResponse.json<{ id: number }>();
    return lesson.id;
  }

  it('GET /api/lessons/lessons/:id returns translations keyed by locale', async () => {
    const lessonId = await createLesson();

    const response = await SELF.fetch(`https://admin.test/api/lessons/lessons/${lessonId}`, {
      headers: { Cookie: sessionCookie },
    });

    expect(response.status).toBe(200);
    const data = await response.json<{ translations: Record<string, { title: string; bodyMdx: string }> }>();
    expect(data.translations['pt-BR']).toBeDefined();
  });

  it('PATCH /api/lessons/lessons/:id upserts only the locale included in the request', async () => {
    const lessonId = await createLesson();

    const response = await SELF.fetch(`https://admin.test/api/lessons/lessons/${lessonId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ translations: { 'en-US': { title: 'Limit Definition', bodyMdx: '# Definition' } } }),
    });
    expect(response.status).toBe(200);

    const getResponse = await SELF.fetch(`https://admin.test/api/lessons/lessons/${lessonId}`, {
      headers: { Cookie: sessionCookie },
    });
    const data = await getResponse.json<{ translations: Record<string, { title: string; bodyMdx: string }> }>();
    expect(data.translations['en-US'].title).toBe('Limit Definition');
    expect(data.translations['pt-BR']).toBeDefined();
  });
});

describe('subject translations', () => {
  it('POST /api/lessons/subjects requires at least one translation', async () => {
    const response = await SELF.fetch('https://admin.test/api/lessons/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ slug: 'no-name', order: 99, translations: {} }),
    });
    expect(response.status).toBe(400);
  });

  it('POST /api/lessons/subjects creates translation rows', async () => {
    const response = await SELF.fetch('https://admin.test/api/lessons/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ slug: 'fisica', order: 2, translations: { 'pt-BR': { name: 'Física' } } }),
    });
    expect(response.status).toBe(201);
  });

  it('PATCH /api/lessons/subjects/:id upserts a translation for a new locale', async () => {
    const created = await SELF.fetch('https://admin.test/api/lessons/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ slug: 'quimica', order: 3, translations: { 'pt-BR': { name: 'Química' } } }),
    });
    const { id } = await created.json<{ id: number }>();

    const patched = await SELF.fetch(`https://admin.test/api/lessons/subjects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ translations: { 'en-US': { name: 'Chemistry' } } }),
    });
    expect(patched.status).toBe(200);
  });
});

describe('required pt-BR translation and locale-key validation', () => {
  const creationRoutes = [
    { name: 'subjects', url: 'https://admin.test/api/lessons/subjects', body: { slug: 'x-no-pt', order: 90 } },
    {
      name: 'topics',
      url: 'https://admin.test/api/lessons/topics',
      body: { subjectId: 1, slug: 'x-no-pt', order: 90 },
    },
    {
      name: 'sections',
      url: 'https://admin.test/api/lessons/sections',
      body: { topicId: 1, slug: 'x-no-pt', order: 90 },
    },
  ] as const;

  for (const route of creationRoutes) {
    it(`POST /api/lessons/${route.name} rejects a body without a pt-BR translation`, async () => {
      const response = await SELF.fetch(route.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
        body: JSON.stringify({ ...route.body, translations: { 'en-US': { name: 'No Portuguese' } } }),
      });
      expect(response.status).toBe(400);
      const { error } = await response.json<{ error: string }>();
      expect(error).toBe('A pt-BR translation is required.');
    });

    it(`POST /api/lessons/${route.name} rejects an unrecognised locale key`, async () => {
      const response = await SELF.fetch(route.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
        body: JSON.stringify({
          ...route.body,
          translations: { 'pt-BR': { name: 'Válido' }, en: { name: 'Bogus locale' } },
        }),
      });
      expect(response.status).toBe(400);
      const { error } = await response.json<{ error: string }>();
      expect(error).toContain('Unsupported locale');
    });
  }

  it('POST /api/lessons/lessons rejects a body without a pt-BR translation', async () => {
    const response = await SELF.fetch('https://admin.test/api/lessons/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({
        sectionId: 1,
        slug: 'lesson-no-pt',
        order: 90,
        translations: { 'en-US': { title: 'No Portuguese', bodyMdx: '# Body' } },
      }),
    });
    expect(response.status).toBe(400);
    const { error } = await response.json<{ error: string }>();
    expect(error).toBe('A pt-BR translation is required.');
  });

  it('PATCH /api/lessons/subjects/:id rejects an unrecognised locale key without writing anything', async () => {
    const created = await SELF.fetch('https://admin.test/api/lessons/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ slug: 'bad-locale-patch', order: 91, translations: { 'pt-BR': { name: 'Original' } } }),
    });
    const { id } = await created.json<{ id: number }>();

    const patched = await SELF.fetch(`https://admin.test/api/lessons/subjects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: sessionCookie },
      body: JSON.stringify({ slug: 'changed-slug', translations: { en: { name: 'Bogus locale' } } }),
    });
    expect(patched.status).toBe(400);

    // Validation runs before any write, so the structural field must be untouched too.
    const row = await env.DB.prepare('SELECT slug FROM subjects WHERE id = ?').bind(id).first<{ slug: string }>();
    expect(row?.slug).toBe('bad-locale-patch');
  });
});

describe('deleting a translated entity', () => {
  const headers = () => ({ 'Content-Type': 'application/json', Cookie: sessionCookie });

  async function countRows(table: string, column: string, id: number): Promise<number> {
    const row = await env.DB.prepare(`SELECT COUNT(*) AS total FROM ${table} WHERE ${column} = ?`)
      .bind(id)
      .first<{ total: number }>();
    return row?.total ?? 0;
  }

  it('DELETE /api/lessons/subjects/:id removes the subject and its translation rows', async () => {
    const created = await SELF.fetch('https://admin.test/api/lessons/subjects', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ slug: 'to-delete-subject', order: 80, translations: { 'pt-BR': { name: 'Apagar' } } }),
    });
    const { id } = await created.json<{ id: number }>();
    expect(await countRows('subject_translations', 'subject_id', id)).toBe(1);

    const response = await SELF.fetch(`https://admin.test/api/lessons/subjects/${id}`, {
      method: 'DELETE',
      headers: { Cookie: sessionCookie },
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });

    expect(await countRows('subjects', 'id', id)).toBe(0);
    expect(await countRows('subject_translations', 'subject_id', id)).toBe(0);
  });

  it('DELETE /api/lessons/topics/:id removes the topic and its translation rows', async () => {
    const subjectResponse = await SELF.fetch('https://admin.test/api/lessons/subjects', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ slug: 'parent-of-topic', order: 81, translations: { 'pt-BR': { name: 'Pai' } } }),
    });
    const subject = await subjectResponse.json<{ id: number }>();

    const created = await SELF.fetch('https://admin.test/api/lessons/topics', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        subjectId: subject.id,
        slug: 'to-delete-topic',
        order: 80,
        translations: { 'pt-BR': { name: 'Apagar' } },
      }),
    });
    const { id } = await created.json<{ id: number }>();
    expect(await countRows('topic_translations', 'topic_id', id)).toBe(1);

    const response = await SELF.fetch(`https://admin.test/api/lessons/topics/${id}`, {
      method: 'DELETE',
      headers: { Cookie: sessionCookie },
    });
    expect(response.status).toBe(200);

    expect(await countRows('topics', 'id', id)).toBe(0);
    expect(await countRows('topic_translations', 'topic_id', id)).toBe(0);
  });

  it('DELETE /api/lessons/sections/:id removes the section and its translation rows', async () => {
    const subjectResponse = await SELF.fetch('https://admin.test/api/lessons/subjects', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ slug: 'parent-of-section', order: 82, translations: { 'pt-BR': { name: 'Pai' } } }),
    });
    const subject = await subjectResponse.json<{ id: number }>();

    const topicResponse = await SELF.fetch('https://admin.test/api/lessons/topics', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        subjectId: subject.id,
        slug: 'parent-topic-of-section',
        order: 82,
        translations: { 'pt-BR': { name: 'Pai' } },
      }),
    });
    const topic = await topicResponse.json<{ id: number }>();

    const created = await SELF.fetch('https://admin.test/api/lessons/sections', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        topicId: topic.id,
        slug: 'to-delete-section',
        order: 80,
        translations: { 'pt-BR': { name: 'Apagar' } },
      }),
    });
    const { id } = await created.json<{ id: number }>();
    expect(await countRows('section_translations', 'section_id', id)).toBe(1);

    const response = await SELF.fetch(`https://admin.test/api/lessons/sections/${id}`, {
      method: 'DELETE',
      headers: { Cookie: sessionCookie },
    });
    expect(response.status).toBe(200);

    expect(await countRows('sections', 'id', id)).toBe(0);
    expect(await countRows('section_translations', 'section_id', id)).toBe(0);
  });

  it('DELETE /api/lessons/lessons/:id removes the lesson and its translation rows', async () => {
    const subjectResponse = await SELF.fetch('https://admin.test/api/lessons/subjects', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ slug: 'parent-of-lesson', order: 83, translations: { 'pt-BR': { name: 'Pai' } } }),
    });
    const subject = await subjectResponse.json<{ id: number }>();

    const topicResponse = await SELF.fetch('https://admin.test/api/lessons/topics', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        subjectId: subject.id,
        slug: 'parent-topic-of-lesson',
        order: 83,
        translations: { 'pt-BR': { name: 'Pai' } },
      }),
    });
    const topic = await topicResponse.json<{ id: number }>();

    const sectionResponse = await SELF.fetch('https://admin.test/api/lessons/sections', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        topicId: topic.id,
        slug: 'parent-section-of-lesson',
        order: 83,
        translations: { 'pt-BR': { name: 'Pai' } },
      }),
    });
    const section = await sectionResponse.json<{ id: number }>();

    const created = await SELF.fetch('https://admin.test/api/lessons/lessons', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        sectionId: section.id,
        slug: 'to-delete-lesson',
        order: 80,
        translations: { 'pt-BR': { title: 'Apagar', bodyMdx: '# Apagar' } },
      }),
    });
    const { id } = await created.json<{ id: number }>();
    expect(await countRows('lesson_translations', 'lesson_id', id)).toBe(1);

    const response = await SELF.fetch(`https://admin.test/api/lessons/lessons/${id}`, {
      method: 'DELETE',
      headers: { Cookie: sessionCookie },
    });
    expect(response.status).toBe(200);

    expect(await countRows('lessons', 'id', id)).toBe(0);
    expect(await countRows('lesson_translations', 'lesson_id', id)).toBe(0);

    const getResponse = await SELF.fetch(`https://admin.test/api/lessons/lessons/${id}`, {
      headers: { Cookie: sessionCookie },
    });
    expect(getResponse.status).toBe(404);
  });
});
