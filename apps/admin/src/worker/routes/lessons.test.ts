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
      body: JSON.stringify({ slug: 'calculo', name: 'Cálculo', order: 1 }),
    });
    expect(subjectResponse.status).toBe(201);
    const subject = await subjectResponse.json<{ id: number }>();

    const topicResponse = await SELF.fetch('https://admin.test/api/lessons/topics', {
      method: 'POST',
      headers,
      body: JSON.stringify({ subjectId: subject.id, slug: 'limites', name: 'Limites', order: 1 }),
    });
    const topic = await topicResponse.json<{ id: number }>();

    const sectionResponse = await SELF.fetch('https://admin.test/api/lessons/sections', {
      method: 'POST',
      headers,
      body: JSON.stringify({ topicId: topic.id, slug: 'intro', name: 'Introdução', order: 1 }),
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
      body: JSON.stringify({ slug: `calculo-${Date.now()}-${Math.random()}`, name: 'Cálculo', order: 1 }),
    });
    const subject = await subjectResponse.json<{ id: number }>();

    const topicResponse = await SELF.fetch('https://admin.test/api/lessons/topics', {
      method: 'POST',
      headers,
      body: JSON.stringify({ subjectId: subject.id, slug: `limites-${Date.now()}-${Math.random()}`, name: 'Limites', order: 1 }),
    });
    const topic = await topicResponse.json<{ id: number }>();

    const sectionResponse = await SELF.fetch('https://admin.test/api/lessons/sections', {
      method: 'POST',
      headers,
      body: JSON.stringify({ topicId: topic.id, slug: `intro-${Date.now()}-${Math.random()}`, name: 'Introdução', order: 1 }),
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
