import { describe, expect, it, beforeAll } from 'vitest';
import { env, applyD1Migrations, SELF } from 'cloudflare:test';

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  env.EXPORT_SECRET = 'test-export-secret';
  await env.DB.prepare(
    'INSERT INTO subjects (id, slug, "order") VALUES (1, \'exemplo\', 1)',
  ).run();
  await env.DB.prepare(
    "INSERT INTO subject_translations (subject_id, locale, name) VALUES (1, 'pt-BR', 'Exemplo')",
  ).run();

  // A short_text question with an accepted answer, and a matching question
  // with matching pairs — regression coverage for the bug where `/api/export`
  // dropped the `question_accepted_answers`/`question_matching_pairs` tables
  // entirely, silently shipping ungradeable/unanswerable questions to the site.
  await env.DB.prepare(
    "INSERT INTO questions (id, type, difficulty, answer_format) VALUES (1, 'short_text', 'easy', 'math')",
  ).run();
  await env.DB.prepare(
    "INSERT INTO question_translations (question_id, locale, prompt_mdx, resolution_mdx) VALUES (1, 'pt-BR', 'Qual gás?', 'Oxigênio.')",
  ).run();
  await env.DB.prepare(
    "INSERT INTO question_accepted_answers (question_id, text) VALUES (1, 'Oxigênio')",
  ).run();
  await env.DB.prepare(
    "INSERT INTO questions (id, type, difficulty) VALUES (2, 'matching', 'hard')",
  ).run();
  await env.DB.prepare(
    "INSERT INTO question_translations (question_id, locale, prompt_mdx, resolution_mdx) VALUES (2, 'pt-BR', 'Associe.', 'Ver resolução.')",
  ).run();
  await env.DB.prepare(
    'INSERT INTO question_matching_pairs (id, question_id, "order") VALUES (1, 2, 0)',
  ).run();
  await env.DB.prepare(
    "INSERT INTO question_matching_pair_translations (pair_id, locale, left_mdx, right_mdx) VALUES (1, 'pt-BR', 'Cão', 'Late')",
  ).run();
});

describe('GET /api/export', () => {
  it('rejects a request without the correct bearer token', async () => {
    const response = await SELF.fetch('https://admin.test/api/export');
    expect(response.status).toBe(401);
  });

  it('returns every table as JSON when the correct token is provided', async () => {
    const response = await SELF.fetch('https://admin.test/api/export', {
      headers: { Authorization: 'Bearer test-export-secret' },
    });

    expect(response.status).toBe(200);
    const data = await response.json<{ subjects: { slug: string }[] }>();
    expect(data.subjects.find((s) => s.slug === 'exemplo')).toBeDefined();
  });

  it('includes questionAcceptedAnswers and questionMatchingPairs, not just questions/questionOptions', async () => {
    const response = await SELF.fetch('https://admin.test/api/export', {
      headers: { Authorization: 'Bearer test-export-secret' },
    });

    expect(response.status).toBe(200);
    const data = await response.json<{
      questionAcceptedAnswers: { questionId: number; text: string }[];
      questionMatchingPairs: { id: number; questionId: number }[];
      questionMatchingPairTranslations: { pairId: number; leftMdx: string; rightMdx: string }[];
    }>();

    expect(data.questionAcceptedAnswers.find((a) => a.questionId === 1 && a.text === 'Oxigênio')).toBeDefined();
    const pair = data.questionMatchingPairs.find((p) => p.questionId === 2);
    expect(pair).toBeDefined();
    expect(
      data.questionMatchingPairTranslations.find(
        (t) => t.pairId === pair?.id && t.leftMdx === 'Cão' && t.rightMdx === 'Late',
      ),
    ).toBeDefined();
  });

  it('includes answerFormat on questions, proving the wholesale questions-table select carries new columns through automatically', async () => {
    const response = await SELF.fetch('https://admin.test/api/export', {
      headers: { Authorization: 'Bearer test-export-secret' },
    });

    expect(response.status).toBe(200);
    const data = await response.json<{ questions: { id: number; answerFormat: string }[] }>();
    expect(data.questions.find((q) => q.id === 1)?.answerFormat).toBe('math');
  });

  it('includes every translation table in the export payload', async () => {
    const response = await SELF.fetch('https://admin.test/api/export', {
      headers: { Authorization: 'Bearer test-export-secret' },
    });

    expect(response.status).toBe(200);
    const data = await response.json<{
      subjectTranslations: { subjectId: number; locale: string; name: string }[];
    }>();

    expect(data.subjectTranslations.find((t) => t.name === 'Exemplo' && t.locale === 'pt-BR')).toBeDefined();
  });
});
