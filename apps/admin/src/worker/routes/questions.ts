import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import {
  getD1Db,
  getQuestionsForExport,
  getTagTree,
  isValidNumericCorrectAnswer,
  questions,
  questionOptions,
  questionTags,
  tags,
} from '@birb-math/content-schema';
import type { Env } from '../env';

interface QuestionInput {
  type: 'multiple_choice' | 'multiple_response' | 'numeric';
  difficulty: 'easy' | 'medium' | 'hard';
  promptMdx: string;
  resolutionMdx: string;
  correctAnswer: string | null;
  options: { textMdx: string; isCorrect: boolean }[];
  tagIds: number[];
}

function validateQuestionInput(body: QuestionInput): string | null {
  if (body.type === 'numeric') {
    if (body.correctAnswer === null || !isValidNumericCorrectAnswer(body.correctAnswer)) {
      return 'Questões numéricas precisam de uma resposta correta válida (ex.: "1.5", não "1,5").';
    }
    return null;
  }

  if (body.options.length < 2) {
    return 'Questões de múltipla escolha ou múltipla resposta precisam de pelo menos 2 alternativas.';
  }

  const correctCount = body.options.filter((option) => option.isCorrect).length;
  if (body.type === 'multiple_choice' && correctCount !== 1) {
    return 'Questões de múltipla escolha (uma correta) precisam de exatamente 1 alternativa correta.';
  }
  if (body.type === 'multiple_response' && correctCount < 1) {
    return 'Questões de múltipla resposta precisam de pelo menos 1 alternativa correta.';
  }

  return null;
}

export const questionsRoutes = new Hono<{ Bindings: Env }>();

questionsRoutes.get('/', async (c) => {
  const db = getD1Db(c.env.DB);
  return c.json(await getQuestionsForExport(db));
});

questionsRoutes.get('/:id', async (c) => {
  const db = getD1Db(c.env.DB);
  const id = Number(c.req.param('id'));
  const all = await getQuestionsForExport(db);
  const question = all.find((q) => q.id === id);
  if (!question) return c.json({ error: 'Not found' }, 404);
  return c.json(question);
});

questionsRoutes.post('/', async (c) => {
  const body = await c.req.json<QuestionInput>();
  const validationError = validateQuestionInput(body);
  if (validationError) return c.json({ error: validationError }, 400);

  const db = getD1Db(c.env.DB);
  const [question] = await db
    .insert(questions)
    .values({
      type: body.type,
      difficulty: body.difficulty,
      promptMdx: body.promptMdx,
      resolutionMdx: body.resolutionMdx,
      correctAnswer: body.correctAnswer,
    })
    .returning();

  if (body.options.length > 0) {
    await db.insert(questionOptions).values(
      body.options.map((option, index) => ({
        questionId: question.id,
        textMdx: option.textMdx,
        isCorrect: option.isCorrect,
        order: index + 1,
      })),
    ).run();
  }

  if (body.tagIds.length > 0) {
    await db.insert(questionTags).values(body.tagIds.map((tagId) => ({ questionId: question.id, tagId }))).run();
  }

  return c.json(question, 201);
});

questionsRoutes.patch('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json<QuestionInput>();
  const validationError = validateQuestionInput(body);
  if (validationError) return c.json({ error: validationError }, 400);

  const db = getD1Db(c.env.DB);
  await db
    .update(questions)
    .set({
      type: body.type,
      difficulty: body.difficulty,
      promptMdx: body.promptMdx,
      resolutionMdx: body.resolutionMdx,
      correctAnswer: body.correctAnswer,
    })
    .where(eq(questions.id, id))
    .run();

  // Options and tags are replaced wholesale rather than diffed — simplest
  // correct approach at this data scale (a handful of options/tags per
  // question), and it sidesteps having to match incoming options back to
  // existing option ids.
  await db.delete(questionOptions).where(eq(questionOptions.questionId, id)).run();
  if (body.options.length > 0) {
    await db.insert(questionOptions).values(
      body.options.map((option, index) => ({
        questionId: id,
        textMdx: option.textMdx,
        isCorrect: option.isCorrect,
        order: index + 1,
      })),
    ).run();
  }

  await db.delete(questionTags).where(eq(questionTags.questionId, id)).run();
  if (body.tagIds.length > 0) {
    await db.insert(questionTags).values(body.tagIds.map((tagId) => ({ questionId: id, tagId }))).run();
  }

  return c.json({ ok: true });
});

questionsRoutes.delete('/:id', async (c) => {
  const db = getD1Db(c.env.DB);
  const id = Number(c.req.param('id'));
  await db.delete(questionTags).where(eq(questionTags.questionId, id)).run();
  await db.delete(questionOptions).where(eq(questionOptions.questionId, id)).run();
  await db.delete(questions).where(eq(questions.id, id)).run();
  return c.json({ ok: true });
});

export const tagsRoutes = new Hono<{ Bindings: Env }>();

tagsRoutes.get('/', async (c) => {
  const db = getD1Db(c.env.DB);
  return c.json(await getTagTree(db));
});

tagsRoutes.post('/', async (c) => {
  const db = getD1Db(c.env.DB);
  const body = await c.req.json<{ slug: string; name: string; parentTagId?: number }>();
  const [row] = await db.insert(tags).values(body).returning();
  return c.json(row, 201);
});
