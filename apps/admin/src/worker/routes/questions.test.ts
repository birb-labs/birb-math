import { describe, expect, it, beforeAll, beforeEach } from 'vitest';
import { env, applyD1Migrations, SELF } from 'cloudflare:test';
import { hashPassword } from '../auth/password';

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  env.ADMIN_USERNAME = 'admin';
  env.ADMIN_PASSWORD_HASH = await hashPassword('test-password');
  env.SESSION_SECRET = 'test-session-secret';
});

let cookie = '';

beforeEach(async () => {
  const response = await SELF.fetch('https://admin.test/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'test-password' }),
  });
  cookie = response.headers.get('set-cookie')!.split(';')[0];
});

function authed(body: unknown) {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify(body),
  };
}

describe('question-bank CRUD', () => {
  it('rejects a multiple_choice question without exactly one correct option', async () => {
    const response = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'multiple_choice',
        difficulty: 'easy',
        promptMdx: 'P?',
        resolutionMdx: 'R.',
        correctAnswer: null,
        options: [
          { textMdx: 'A', isCorrect: true },
          { textMdx: 'B', isCorrect: true },
        ],
        tagIds: [],
      }),
    );
    expect(response.status).toBe(400);
  });

  it('creates a multiple_response question with 2 correct options and reads it back', async () => {
    const createResponse = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'multiple_response',
        difficulty: 'hard',
        promptMdx: 'Quais são verdadeiras?',
        resolutionMdx: 'A e C.',
        correctAnswer: null,
        options: [
          { textMdx: 'A', isCorrect: true },
          { textMdx: 'B', isCorrect: false },
          { textMdx: 'C', isCorrect: true },
        ],
        tagIds: [],
      }),
    );
    expect(createResponse.status).toBe(201);
    const created = await createResponse.json<{ id: number }>();

    const getResponse = await SELF.fetch(`https://admin.test/api/questions/${created.id}`, {
      headers: { Cookie: cookie },
    });
    const question = await getResponse.json<{ options: { isCorrect: boolean }[] }>();
    expect(question.options.filter((o) => o.isCorrect)).toHaveLength(2);
  });

  it('rejects a numeric question with a comma-formatted correctAnswer', async () => {
    const response = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'numeric',
        difficulty: 'medium',
        promptMdx: 'Quanto é 3/2?',
        resolutionMdx: '1.5.',
        correctAnswer: '1,5',
        options: [],
        tagIds: [],
      }),
    );
    expect(response.status).toBe(400);
  });

  it('creates a tag and a subtopic under it', async () => {
    const topicResponse = await SELF.fetch('https://admin.test/api/tags', authed({ slug: 'limites', name: 'Limites' }));
    const topic = await topicResponse.json<{ id: number }>();

    const subtopicResponse = await SELF.fetch(
      'https://admin.test/api/tags',
      authed({ slug: 'limites-laterais', name: 'Limites Laterais', parentTagId: topic.id }),
    );
    expect(subtopicResponse.status).toBe(201);

    const treeResponse = await SELF.fetch('https://admin.test/api/tags', { headers: { Cookie: cookie } });
    const tree = await treeResponse.json<Array<{ slug: string; subtopics: { slug: string }[] }>>();
    expect(tree.find((t) => t.slug === 'limites')?.subtopics.map((s) => s.slug)).toContain('limites-laterais');
  });
});
