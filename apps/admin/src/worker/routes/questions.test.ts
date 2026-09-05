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
        acceptedAnswers: [],
        matchingPairs: [],
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
        acceptedAnswers: [],
        matchingPairs: [],
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
        acceptedAnswers: [],
        matchingPairs: [],
        tagIds: [],
      }),
    );
    expect(response.status).toBe(400);
  });

  it('creates a tag and a subtopic under it', async () => {
    const topicResponse = await SELF.fetch(
      'https://admin.test/api/tags',
      authed({ slug: 'limites', translations: { 'pt-BR': { name: 'Limites' } } }),
    );
    const topic = await topicResponse.json<{ id: number }>();

    const subtopicResponse = await SELF.fetch(
      'https://admin.test/api/tags',
      authed({
        slug: 'limites-laterais',
        parentTagId: topic.id,
        translations: { 'pt-BR': { name: 'Limites Laterais' } },
      }),
    );
    expect(subtopicResponse.status).toBe(201);

    const treeResponse = await SELF.fetch('https://admin.test/api/tags', { headers: { Cookie: cookie } });
    const tree = await treeResponse.json<Array<{ slug: string; subtopics: { slug: string }[] }>>();
    expect(tree.find((t) => t.slug === 'limites')?.subtopics.map((s) => s.slug)).toContain('limites-laterais');
  });

  it('rejects a true_false question without a "true"/"false" correctAnswer', async () => {
    const response = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'true_false',
        difficulty: 'easy',
        promptMdx: 'P?',
        resolutionMdx: 'R.',
        correctAnswer: 'sim',
        options: [],
        acceptedAnswers: [],
        matchingPairs: [],
        tagIds: [],
      }),
    );
    expect(response.status).toBe(400);
  });

  it('creates a true_false question and reads it back', async () => {
    const createResponse = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'true_false',
        difficulty: 'easy',
        promptMdx: 'O céu é azul?',
        resolutionMdx: 'Sim.',
        correctAnswer: 'true',
        options: [],
        acceptedAnswers: [],
        matchingPairs: [],
        tagIds: [],
      }),
    );
    expect(createResponse.status).toBe(201);
    const created = await createResponse.json<{ id: number }>();

    const getResponse = await SELF.fetch(`https://admin.test/api/questions/${created.id}`, {
      headers: { Cookie: cookie },
    });
    const question = await getResponse.json<{ correctAnswer: string }>();
    expect(question.correctAnswer).toBe('true');
  });

  it('rejects a short_text question with no accepted answers', async () => {
    const response = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'short_text',
        difficulty: 'medium',
        promptMdx: 'P?',
        resolutionMdx: 'R.',
        correctAnswer: null,
        options: [],
        acceptedAnswers: [],
        matchingPairs: [],
        answerFormat: 'text',
        tagIds: [],
      }),
    );
    expect(response.status).toBe(400);
  });

  it('creates a short_text question with multiple accepted answers and reads it back', async () => {
    const createResponse = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'short_text',
        difficulty: 'medium',
        promptMdx: 'Qual gás as plantas liberam na fotossíntese?',
        resolutionMdx: 'Oxigênio.',
        correctAnswer: null,
        options: [],
        acceptedAnswers: ['Oxigênio', 'O2', 'O₂'],
        matchingPairs: [],
        answerFormat: 'text',
        tagIds: [],
      }),
    );
    expect(createResponse.status).toBe(201);
    const created = await createResponse.json<{ id: number }>();

    const getResponse = await SELF.fetch(`https://admin.test/api/questions/${created.id}`, {
      headers: { Cookie: cookie },
    });
    const question = await getResponse.json<{ acceptedAnswers: { text: string }[] }>();
    expect(question.acceptedAnswers.map((a) => a.text)).toEqual(['Oxigênio', 'O2', 'O₂']);
  });

  it('rejects a short_text question with an invalid answerFormat', async () => {
    const response = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'short_text',
        difficulty: 'medium',
        promptMdx: 'P?',
        resolutionMdx: 'R.',
        correctAnswer: null,
        options: [],
        acceptedAnswers: ['R'],
        matchingPairs: [],
        answerFormat: 'latex',
        tagIds: [],
      }),
    );
    expect(response.status).toBe(400);
  });

  it('creates a math-mode short_text question and reads its answerFormat back', async () => {
    const createResponse = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'short_text',
        difficulty: 'hard',
        promptMdx: 'Calcule a derivada de $x^2$.',
        resolutionMdx: '$2x$.',
        correctAnswer: null,
        options: [],
        acceptedAnswers: ['2x'],
        matchingPairs: [],
        answerFormat: 'math',
        tagIds: [],
      }),
    );
    expect(createResponse.status).toBe(201);
    const created = await createResponse.json<{ id: number }>();

    const getResponse = await SELF.fetch(`https://admin.test/api/questions/${created.id}`, {
      headers: { Cookie: cookie },
    });
    const question = await getResponse.json<{ answerFormat: string }>();
    expect(question.answerFormat).toBe('math');
  });

  it('creates an ordering question, preserving entry order as the correct order', async () => {
    const createResponse = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'ordering',
        difficulty: 'medium',
        promptMdx: 'Ordene os passos.',
        resolutionMdx: 'Ver resolução.',
        correctAnswer: null,
        options: [
          { textMdx: 'Primeiro', isCorrect: false },
          { textMdx: 'Segundo', isCorrect: false },
          { textMdx: 'Terceiro', isCorrect: false },
        ],
        acceptedAnswers: [],
        matchingPairs: [],
        tagIds: [],
      }),
    );
    expect(createResponse.status).toBe(201);
    const created = await createResponse.json<{ id: number }>();

    const getResponse = await SELF.fetch(`https://admin.test/api/questions/${created.id}`, {
      headers: { Cookie: cookie },
    });
    const question = await getResponse.json<{ options: { textMdx: string }[] }>();
    expect(question.options.map((o) => o.textMdx)).toEqual(['Primeiro', 'Segundo', 'Terceiro']);
  });

  it('rejects a matching question with fewer than 2 pairs', async () => {
    const response = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'matching',
        difficulty: 'hard',
        promptMdx: 'P?',
        resolutionMdx: 'R.',
        correctAnswer: null,
        options: [],
        acceptedAnswers: [],
        matchingPairs: [{ leftMdx: 'A', rightMdx: 'B' }],
        tagIds: [],
      }),
    );
    expect(response.status).toBe(400);
  });

  it('creates a matching question with its pairs and reads it back', async () => {
    const createResponse = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'matching',
        difficulty: 'hard',
        promptMdx: 'Associe.',
        resolutionMdx: 'Ver resolução.',
        correctAnswer: null,
        options: [],
        acceptedAnswers: [],
        matchingPairs: [
          { leftMdx: 'Cão', rightMdx: 'Late' },
          { leftMdx: 'Gato', rightMdx: 'Mia' },
        ],
        tagIds: [],
      }),
    );
    expect(createResponse.status).toBe(201);
    const created = await createResponse.json<{ id: number }>();

    const getResponse = await SELF.fetch(`https://admin.test/api/questions/${created.id}`, {
      headers: { Cookie: cookie },
    });
    const question = await getResponse.json<{ matchingPairs: { leftMdx: string; rightMdx: string }[] }>();
    expect(question.matchingPairs.map((p) => ({ leftMdx: p.leftMdx, rightMdx: p.rightMdx }))).toEqual([
      { leftMdx: 'Cão', rightMdx: 'Late' },
      { leftMdx: 'Gato', rightMdx: 'Mia' },
    ]);
  });

  it('deletes a matching question along with its pairs', async () => {
    const createResponse = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'matching',
        difficulty: 'hard',
        promptMdx: 'Associe.',
        resolutionMdx: 'Ver resolução.',
        correctAnswer: null,
        options: [],
        acceptedAnswers: [],
        matchingPairs: [
          { leftMdx: 'A', rightMdx: 'B' },
          { leftMdx: 'C', rightMdx: 'D' },
        ],
        tagIds: [],
      }),
    );
    const created = await createResponse.json<{ id: number }>();

    const deleteResponse = await SELF.fetch(`https://admin.test/api/questions/${created.id}`, {
      method: 'DELETE',
      headers: { Cookie: cookie },
    });
    expect(deleteResponse.status).toBe(200);

    const getResponse = await SELF.fetch(`https://admin.test/api/questions/${created.id}`, {
      headers: { Cookie: cookie },
    });
    expect(getResponse.status).toBe(404);
  });

  it('POST /api/tags requires at least one translation', async () => {
    const response = await SELF.fetch('https://admin.test/api/tags', authed({ slug: 'no-name', translations: {} }));
    expect(response.status).toBe(400);
  });

  it('POST /api/tags creates translation rows', async () => {
    const response = await SELF.fetch(
      'https://admin.test/api/tags',
      authed({ slug: 'derivadas', translations: { 'pt-BR': { name: 'Derivadas' } } }),
    );
    expect(response.status).toBe(201);
  });

  it('PATCH /api/tags/:id upserts a translation for a new locale', async () => {
    const created = await SELF.fetch(
      'https://admin.test/api/tags',
      authed({ slug: 'integrais', translations: { 'pt-BR': { name: 'Integrais' } } }),
    );
    const { id } = await created.json<{ id: number }>();

    const patched = await SELF.fetch(`https://admin.test/api/tags/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ translations: { 'en-US': { name: 'Integrals' } } }),
    });
    expect(patched.status).toBe(200);
  });
});
