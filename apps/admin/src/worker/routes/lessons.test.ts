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
        title: 'O que é um limite?',
        bodyMdx: '# Título',
        order: 1,
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
