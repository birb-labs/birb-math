import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import {
  getD1Db,
  getQuestionsForExport,
  getTagTree,
  isValidNumericCorrectAnswer,
  questionAcceptedAnswers,
  questionMatchingPairs,
  questionOptions,
  questions,
  questionTags,
  tags,
  tagTranslations,
  type Locale,
} from '@birb-math/content-schema';
import type { Env } from '../env';

interface QuestionInput {
  type:
    | 'multiple_choice'
    | 'multiple_response'
    | 'numeric'
    | 'true_false'
    | 'short_text'
    | 'ordering'
    | 'matching';
  difficulty: 'easy' | 'medium' | 'hard';
  promptMdx: string;
  resolutionMdx: string;
  correctAnswer: string | null;
  answerFormat: 'text' | 'math';
  options: { textMdx: string; isCorrect: boolean }[];
  acceptedAnswers: string[];
  matchingPairs: { leftMdx: string; rightMdx: string }[];
  tagIds: number[];
}

function validateQuestionInput(body: QuestionInput): string | null {
  if (body.type === 'numeric') {
    if (body.correctAnswer === null || !isValidNumericCorrectAnswer(body.correctAnswer)) {
      return 'Questões numéricas precisam de uma resposta correta válida (ex.: "1.5", não "1,5").';
    }
    return null;
  }

  if (body.type === 'true_false') {
    if (body.correctAnswer !== 'true' && body.correctAnswer !== 'false') {
      return 'Questões de verdadeiro ou falso precisam de uma resposta correta "true" ou "false".';
    }
    return null;
  }

  if (body.type === 'short_text') {
    if (body.answerFormat !== 'text' && body.answerFormat !== 'math') {
      return 'Questões de texto curto precisam de um modo de resposta "text" ou "math".';
    }
    if (body.acceptedAnswers.length < 1 || body.acceptedAnswers.some((answer) => answer.trim() === '')) {
      return 'Questões de texto curto precisam de pelo menos 1 resposta aceita, sem entradas em branco.';
    }
    return null;
  }

  if (body.type === 'matching') {
    if (body.matchingPairs.length < 2) {
      return 'Questões de associação precisam de pelo menos 2 pares.';
    }
    return null;
  }

  // multiple_choice, multiple_response, and ordering all store their content in `options`.
  if (body.options.length < 2) {
    return 'Questões de múltipla escolha, múltipla resposta ou ordenação precisam de pelo menos 2 alternativas.';
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
      answerFormat: body.answerFormat,
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

  if (body.acceptedAnswers.length > 0) {
    await db.insert(questionAcceptedAnswers).values(
      body.acceptedAnswers.map((text) => ({ questionId: question.id, text })),
    ).run();
  }

  if (body.matchingPairs.length > 0) {
    await db.insert(questionMatchingPairs).values(
      body.matchingPairs.map((pair, index) => ({
        questionId: question.id,
        leftMdx: pair.leftMdx,
        rightMdx: pair.rightMdx,
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
      answerFormat: body.answerFormat,
    })
    .where(eq(questions.id, id))
    .run();

  // Options, accepted answers, matching pairs, and tags are all replaced
  // wholesale rather than diffed — simplest correct approach at this data
  // scale, and it sidesteps having to match incoming rows back to existing ids.
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

  await db.delete(questionAcceptedAnswers).where(eq(questionAcceptedAnswers.questionId, id)).run();
  if (body.acceptedAnswers.length > 0) {
    await db.insert(questionAcceptedAnswers).values(
      body.acceptedAnswers.map((text) => ({ questionId: id, text })),
    ).run();
  }

  await db.delete(questionMatchingPairs).where(eq(questionMatchingPairs.questionId, id)).run();
  if (body.matchingPairs.length > 0) {
    await db.insert(questionMatchingPairs).values(
      body.matchingPairs.map((pair, index) => ({
        questionId: id,
        leftMdx: pair.leftMdx,
        rightMdx: pair.rightMdx,
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
  await db.delete(questionAcceptedAnswers).where(eq(questionAcceptedAnswers.questionId, id)).run();
  await db.delete(questionMatchingPairs).where(eq(questionMatchingPairs.questionId, id)).run();
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
  const body = await c.req.json<{
    slug: string;
    parentTagId?: number;
    translations: Partial<Record<Locale, { name: string }>>;
  }>();
  const locales = Object.keys(body.translations) as Locale[];
  if (locales.length === 0) return c.json({ error: 'At least one locale translation is required.' }, 400);

  const [row] = await db.insert(tags).values({ slug: body.slug, parentTagId: body.parentTagId }).returning();
  await db
    .insert(tagTranslations)
    .values(locales.map((locale) => ({ tagId: row.id, locale, name: body.translations[locale]!.name })))
    .run();
  return c.json(row, 201);
});

tagsRoutes.patch('/:id', async (c) => {
  const db = getD1Db(c.env.DB);
  const id = Number(c.req.param('id'));
  const body = await c.req.json<
    Partial<{ slug: string; parentTagId: number; translations: Partial<Record<Locale, { name: string }>> }>
  >();
  const { translations, ...structuralFields } = body;
  if (Object.keys(structuralFields).length > 0) {
    await db.update(tags).set(structuralFields).where(eq(tags.id, id)).run();
  }
  if (translations) {
    for (const locale of Object.keys(translations) as Locale[]) {
      await db
        .insert(tagTranslations)
        .values({ tagId: id, locale, name: translations[locale]!.name })
        .onConflictDoUpdate({
          target: [tagTranslations.tagId, tagTranslations.locale],
          set: { name: translations[locale]!.name },
        })
        .run();
    }
  }
  return c.json({ ok: true });
});
