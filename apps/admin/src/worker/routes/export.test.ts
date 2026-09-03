import { describe, expect, it, beforeAll } from 'vitest';
import { env, applyD1Migrations, SELF } from 'cloudflare:test';

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  env.EXPORT_SECRET = 'test-export-secret';
  await env.DB.prepare(
    "INSERT INTO subjects (slug, name, \"order\") VALUES ('exemplo', 'Exemplo', 1)",
  ).run();

  // A short_text question with an accepted answer, and a matching question
  // with matching pairs — regression coverage for the bug where `/api/export`
  // dropped the `question_accepted_answers`/`question_matching_pairs` tables
  // entirely, silently shipping ungradeable/unanswerable questions to the site.
  await env.DB.prepare(
    "INSERT INTO questions (id, type, difficulty, prompt_mdx, resolution_mdx, answer_format) VALUES (1, 'short_text', 'easy', 'Qual gás?', 'Oxigênio.', 'math')",
  ).run();
  await env.DB.prepare(
    "INSERT INTO question_accepted_answers (question_id, text) VALUES (1, 'Oxigênio')",
  ).run();
  await env.DB.prepare(
    "INSERT INTO questions (id, type, difficulty, prompt_mdx, resolution_mdx) VALUES (2, 'matching', 'hard', 'Associe.', 'Ver resolução.')",
  ).run();
  await env.DB.prepare(
    "INSERT INTO question_matching_pairs (question_id, left_mdx, right_mdx, \"order\") VALUES (2, 'Cão', 'Late', 0)",
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
      questionMatchingPairs: { questionId: number; leftMdx: string; rightMdx: string }[];
    }>();

    expect(data.questionAcceptedAnswers.find((a) => a.questionId === 1 && a.text === 'Oxigênio')).toBeDefined();
    expect(
      data.questionMatchingPairs.find((p) => p.questionId === 2 && p.leftMdx === 'Cão' && p.rightMdx === 'Late'),
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
});
