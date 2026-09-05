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

function authed(body: unknown, method = 'POST') {
  return {
    method,
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify(body),
  };
}

function pt(translation: {
  promptMdx: string;
  resolutionMdx: string;
  options?: { textMdx: string; isCorrect: boolean }[];
  matchingPairs?: { leftMdx: string; rightMdx: string }[];
}) {
  return {
    'pt-BR': {
      promptMdx: translation.promptMdx,
      resolutionMdx: translation.resolutionMdx,
      options: translation.options ?? [],
      matchingPairs: translation.matchingPairs ?? [],
    },
  };
}

describe('question-bank CRUD', () => {
  it('rejects a multiple_choice question without exactly one correct option', async () => {
    const response = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'multiple_choice',
        difficulty: 'easy',
        correctAnswer: null,
        answerFormat: 'text',
        translations: pt({
          promptMdx: 'P?',
          resolutionMdx: 'R.',
          options: [
            { textMdx: 'A', isCorrect: true },
            { textMdx: 'B', isCorrect: true },
          ],
        }),
        acceptedAnswersShared: [],
        acceptedAnswersByLocale: {},
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
        correctAnswer: null,
        answerFormat: 'text',
        translations: pt({
          promptMdx: 'Quais são verdadeiras?',
          resolutionMdx: 'A e C.',
          options: [
            { textMdx: 'A', isCorrect: true },
            { textMdx: 'B', isCorrect: false },
            { textMdx: 'C', isCorrect: true },
          ],
        }),
        acceptedAnswersShared: [],
        acceptedAnswersByLocale: {},
        tagIds: [],
      }),
    );
    expect(createResponse.status).toBe(201);
    const created = await createResponse.json<{ id: number }>();

    const getResponse = await SELF.fetch(`https://admin.test/api/questions/${created.id}`, {
      headers: { Cookie: cookie },
    });
    const question = await getResponse.json<{ translations: Record<string, { options: { isCorrect: boolean }[] }> }>();
    expect(question.translations['pt-BR'].options.filter((o) => o.isCorrect)).toHaveLength(2);
  });

  it('rejects a numeric question with a comma-formatted correctAnswer', async () => {
    const response = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'numeric',
        difficulty: 'medium',
        correctAnswer: '1,5',
        answerFormat: 'text',
        translations: pt({ promptMdx: 'Quanto é 3/2?', resolutionMdx: '1.5.' }),
        acceptedAnswersShared: [],
        acceptedAnswersByLocale: {},
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
        correctAnswer: 'sim',
        answerFormat: 'text',
        translations: pt({ promptMdx: 'P?', resolutionMdx: 'R.' }),
        acceptedAnswersShared: [],
        acceptedAnswersByLocale: {},
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
        correctAnswer: 'true',
        answerFormat: 'text',
        translations: pt({ promptMdx: 'O céu é azul?', resolutionMdx: 'Sim.' }),
        acceptedAnswersShared: [],
        acceptedAnswersByLocale: {},
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
        correctAnswer: null,
        answerFormat: 'text',
        translations: pt({ promptMdx: 'P?', resolutionMdx: 'R.' }),
        acceptedAnswersShared: [],
        acceptedAnswersByLocale: {},
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
        correctAnswer: null,
        answerFormat: 'text',
        translations: pt({
          promptMdx: 'Qual gás as plantas liberam na fotossíntese?',
          resolutionMdx: 'Oxigênio.',
        }),
        acceptedAnswersShared: [],
        acceptedAnswersByLocale: { 'pt-BR': ['Oxigênio', 'O2', 'O₂'] },
        tagIds: [],
      }),
    );
    expect(createResponse.status).toBe(201);
    const created = await createResponse.json<{ id: number }>();

    const getResponse = await SELF.fetch(`https://admin.test/api/questions/${created.id}`, {
      headers: { Cookie: cookie },
    });
    const question = await getResponse.json<{ acceptedAnswersByLocale: Record<string, string[]> }>();
    expect(question.acceptedAnswersByLocale['pt-BR']).toEqual(['Oxigênio', 'O2', 'O₂']);
  });

  it('rejects a short_text question with an invalid answerFormat', async () => {
    const response = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'short_text',
        difficulty: 'medium',
        correctAnswer: null,
        answerFormat: 'latex',
        translations: pt({ promptMdx: 'P?', resolutionMdx: 'R.' }),
        acceptedAnswersShared: [],
        acceptedAnswersByLocale: { 'pt-BR': ['R'] },
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
        correctAnswer: null,
        answerFormat: 'math',
        translations: pt({ promptMdx: 'Calcule a derivada de $x^2$.', resolutionMdx: '$2x$.' }),
        acceptedAnswersShared: ['2x'],
        acceptedAnswersByLocale: {},
        tagIds: [],
      }),
    );
    expect(createResponse.status).toBe(201);
    const created = await createResponse.json<{ id: number }>();

    const getResponse = await SELF.fetch(`https://admin.test/api/questions/${created.id}`, {
      headers: { Cookie: cookie },
    });
    const question = await getResponse.json<{ answerFormat: string; acceptedAnswersShared: string[] }>();
    expect(question.answerFormat).toBe('math');
    expect(question.acceptedAnswersShared).toEqual(['2x']);
  });

  it('creates an ordering question, preserving entry order as the correct order', async () => {
    const createResponse = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'ordering',
        difficulty: 'medium',
        correctAnswer: null,
        answerFormat: 'text',
        translations: pt({
          promptMdx: 'Ordene os passos.',
          resolutionMdx: 'Ver resolução.',
          options: [
            { textMdx: 'Primeiro', isCorrect: false },
            { textMdx: 'Segundo', isCorrect: false },
            { textMdx: 'Terceiro', isCorrect: false },
          ],
        }),
        acceptedAnswersShared: [],
        acceptedAnswersByLocale: {},
        tagIds: [],
      }),
    );
    expect(createResponse.status).toBe(201);
    const created = await createResponse.json<{ id: number }>();

    const getResponse = await SELF.fetch(`https://admin.test/api/questions/${created.id}`, {
      headers: { Cookie: cookie },
    });
    const question = await getResponse.json<{ translations: Record<string, { options: { textMdx: string }[] }> }>();
    expect(question.translations['pt-BR'].options.map((o) => o.textMdx)).toEqual([
      'Primeiro',
      'Segundo',
      'Terceiro',
    ]);
  });

  it('rejects a matching question with fewer than 2 pairs', async () => {
    const response = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'matching',
        difficulty: 'hard',
        correctAnswer: null,
        answerFormat: 'text',
        translations: pt({
          promptMdx: 'P?',
          resolutionMdx: 'R.',
          matchingPairs: [{ leftMdx: 'A', rightMdx: 'B' }],
        }),
        acceptedAnswersShared: [],
        acceptedAnswersByLocale: {},
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
        correctAnswer: null,
        answerFormat: 'text',
        translations: pt({
          promptMdx: 'Associe.',
          resolutionMdx: 'Ver resolução.',
          matchingPairs: [
            { leftMdx: 'Cão', rightMdx: 'Late' },
            { leftMdx: 'Gato', rightMdx: 'Mia' },
          ],
        }),
        acceptedAnswersShared: [],
        acceptedAnswersByLocale: {},
        tagIds: [],
      }),
    );
    expect(createResponse.status).toBe(201);
    const created = await createResponse.json<{ id: number }>();

    const getResponse = await SELF.fetch(`https://admin.test/api/questions/${created.id}`, {
      headers: { Cookie: cookie },
    });
    const question = await getResponse.json<{
      translations: Record<string, { matchingPairs: { leftMdx: string; rightMdx: string }[] }>;
    }>();
    expect(
      question.translations['pt-BR'].matchingPairs.map((p) => ({ leftMdx: p.leftMdx, rightMdx: p.rightMdx })),
    ).toEqual([
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
        correctAnswer: null,
        answerFormat: 'text',
        translations: pt({
          promptMdx: 'Associe.',
          resolutionMdx: 'Ver resolução.',
          matchingPairs: [
            { leftMdx: 'A', rightMdx: 'B' },
            { leftMdx: 'C', rightMdx: 'D' },
          ],
        }),
        acceptedAnswersShared: [],
        acceptedAnswersByLocale: {},
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

describe('question translations', () => {
  async function createQuestion(): Promise<number> {
    const response = await SELF.fetch(
      'https://admin.test/api/questions',
      authed({
        type: 'multiple_choice',
        difficulty: 'easy',
        correctAnswer: null,
        answerFormat: 'text',
        translations: pt({
          promptMdx: 'Qual gás as plantas absorvem?',
          resolutionMdx: 'CO2.',
          options: [
            { textMdx: 'Oxigênio', isCorrect: false },
            { textMdx: 'Dióxido de carbono', isCorrect: true },
          ],
        }),
        acceptedAnswersShared: [],
        acceptedAnswersByLocale: {},
        tagIds: [],
      }),
    );
    const created = await response.json<{ id: number }>();
    return created.id;
  }

  it('GET /api/questions/:id returns translations keyed by locale plus shared/per-locale accepted answers', async () => {
    const questionId = await createQuestion();

    const response = await SELF.fetch(`https://admin.test/api/questions/${questionId}`, {
      headers: { Cookie: cookie },
    });
    expect(response.status).toBe(200);
    const data = await response.json<{ translations: Record<string, { promptMdx: string }> }>();
    expect(data.translations['pt-BR']).toBeDefined();
  });

  it('PATCH /api/questions/:id upserts only the given locale and leaves structural fields alone when omitted', async () => {
    const questionId = await createQuestion();

    const response = await SELF.fetch(`https://admin.test/api/questions/${questionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        translations: {
          'en-US': {
            promptMdx: 'Which gas?',
            resolutionMdx: 'Oxygen.',
            options: [
              { textMdx: 'Oxygen', isCorrect: false },
              { textMdx: 'Carbon dioxide', isCorrect: true },
            ],
            matchingPairs: [],
          },
        },
      }),
    });
    expect(response.status).toBe(200);

    const getResponse = await SELF.fetch(`https://admin.test/api/questions/${questionId}`, {
      headers: { Cookie: cookie },
    });
    const data = await getResponse.json<{
      type: string;
      translations: Record<string, { promptMdx: string; options: { textMdx: string }[] }>;
    }>();
    expect(data.translations['en-US'].promptMdx).toBe('Which gas?');
    expect(data.translations['en-US'].options.map((o) => o.textMdx)).toEqual(['Oxygen', 'Carbon dioxide']);
    expect(data.translations['pt-BR']).toBeDefined();
    // Structural fields omitted from the PATCH body must be left untouched.
    expect(data.type).toBe('multiple_choice');
  });
});
