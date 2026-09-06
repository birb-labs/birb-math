import { Hono } from 'hono';
import { eq, inArray } from 'drizzle-orm';
import {
  getD1Db,
  getQuestionForAdminEdit,
  getQuestionsForExport,
  getTagTree,
  isValidNumericCorrectAnswer,
  questionAcceptedAnswers,
  questionMatchingPairs,
  questionMatchingPairTranslations,
  questionOptions,
  questionOptionTranslations,
  questions,
  questionTags,
  questionTranslations,
  tags,
  tagTranslations,
  type Locale,
} from '@birb-math/content-schema';
import type { Env } from '../env';
import { validateTranslationLocales } from './translationInput';

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

interface QuestionTranslationInput {
  promptMdx: string;
  resolutionMdx: string;
  options: { id?: number; textMdx: string; isCorrect: boolean }[];
  matchingPairs: { id?: number; leftMdx: string; rightMdx: string }[];
}

interface QuestionStructuralInput {
  type: QuestionInput['type'];
  difficulty: QuestionInput['difficulty'];
  correctAnswer: string | null;
  answerFormat: 'text' | 'math';
  tagIds: number[];
  translations: Partial<Record<Locale, QuestionTranslationInput>>;
  acceptedAnswersShared: string[];
  acceptedAnswersByLocale: Partial<Record<Locale, string[]>>;
}

/**
 * The `pt-BR` translation is the structural authority: option/pair counts and
 * `isCorrect` flags live on the shared `questionOptions`/`questionMatchingPairs`
 * rows, and `pt-BR` is the one locale guaranteed to exist for every question, so
 * reading structure from it keeps validation and the subsequent writes agreeing
 * regardless of which locale tab the editor happened to be on.
 */
function structuralTranslation(
  translations: Partial<Record<Locale, QuestionTranslationInput>>,
): QuestionTranslationInput | undefined {
  return translations['pt-BR'] ?? Object.values(translations)[0];
}

function validateStructuralInput(body: QuestionStructuralInput): string | null {
  const localeError = validateTranslationLocales(body.translations, { requirePtBr: true });
  if (localeError) return localeError;

  const acceptedAnswersLocaleError = validateTranslationLocales(body.acceptedAnswersByLocale, { requirePtBr: false });
  if (acceptedAnswersLocaleError) return acceptedAnswersLocaleError;

  const anyTranslation = structuralTranslation(body.translations)!;
  return validateQuestionInput({
    type: body.type,
    difficulty: body.difficulty,
    promptMdx: anyTranslation.promptMdx,
    resolutionMdx: anyTranslation.resolutionMdx,
    correctAnswer: body.correctAnswer,
    answerFormat: body.answerFormat,
    options: anyTranslation.options,
    acceptedAnswers:
      body.answerFormat === 'math' ? body.acceptedAnswersShared : Object.values(body.acceptedAnswersByLocale).flat(),
    matchingPairs: anyTranslation.matchingPairs,
    tagIds: body.tagIds,
  });
}

export const questionsRoutes = new Hono<{ Bindings: Env }>();

questionsRoutes.get('/', async (c) => {
  const db = getD1Db(c.env.DB);
  return c.json(await getQuestionsForExport(db, 'pt-BR'));
});

questionsRoutes.get('/:id', async (c) => {
  const db = getD1Db(c.env.DB);
  const id = Number(c.req.param('id'));
  const question = await getQuestionForAdminEdit(db, id);
  if (!question) return c.json({ error: 'Not found' }, 404);
  return c.json(question);
});

questionsRoutes.post('/', async (c) => {
  const body = await c.req.json<QuestionStructuralInput>();
  const validationError = validateStructuralInput(body);
  if (validationError) return c.json({ error: validationError }, 400);

  const db = getD1Db(c.env.DB);
  const [question] = await db
    .insert(questions)
    .values({ type: body.type, difficulty: body.difficulty, correctAnswer: body.correctAnswer, answerFormat: body.answerFormat })
    .returning();

  const structural = structuralTranslation(body.translations)!;
  if (structural.options.length > 0) {
    await db.insert(questionOptions).values(
      structural.options.map((option, index) => ({ questionId: question.id, isCorrect: option.isCorrect, order: index + 1 })),
    ).run();
  }
  if (structural.matchingPairs.length > 0) {
    await db.insert(questionMatchingPairs).values(
      structural.matchingPairs.map((_, index) => ({ questionId: question.id, order: index + 1 })),
    ).run();
  }

  await writeQuestionTranslations(db, question.id, body.translations);
  await writeAcceptedAnswers(db, question.id, body.answerFormat, body.acceptedAnswersShared, body.acceptedAnswersByLocale);

  if (body.tagIds.length > 0) {
    await db.insert(questionTags).values(body.tagIds.map((tagId) => ({ questionId: question.id, tagId }))).run();
  }

  return c.json(question, 201);
});

questionsRoutes.patch('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json<Partial<QuestionStructuralInput>>();

  const db = getD1Db(c.env.DB);

  const current = await getQuestionForAdminEdit(db, id);
  if (!current) return c.json({ error: 'Not found' }, 404);

  const { translations, acceptedAnswersShared, acceptedAnswersByLocale, tagIds, ...structuralFields } = body;

  // A PATCH body carries only the locales it wants to change, but the writes
  // below rebuild the shared option/pair rows from scratch with new ids, which
  // orphans every locale whose text is not re-written in the same request —
  // including `pt-BR`, whose absence makes `resolveTranslation` throw on every
  // subsequent read (the admin question list and the site build both read
  // `pt-BR`). Merging the incoming locales over the stored ones keeps the
  // per-locale wholesale-replace semantics while never dropping a locale that
  // simply was not mentioned.
  const mergedTranslations: Partial<Record<Locale, QuestionTranslationInput>> = {
    ...current.translations,
    ...translations,
  };

  // PATCH bodies are partial, so validate the *effective* post-patch state
  // rather than the body alone: without this a PATCH could set a
  // multiple_choice question to zero correct options or a short_text question
  // to zero accepted answers, and the failure would only surface much later as
  // a thrown error during the site's production question export.
  const validationError = validateStructuralInput({
    type: body.type ?? current.type,
    difficulty: body.difficulty ?? current.difficulty,
    correctAnswer: body.correctAnswer !== undefined ? body.correctAnswer : current.correctAnswer,
    answerFormat: body.answerFormat ?? current.answerFormat,
    tagIds: tagIds ?? current.tagIds,
    translations: mergedTranslations,
    acceptedAnswersShared: acceptedAnswersShared ?? current.acceptedAnswersShared,
    acceptedAnswersByLocale: acceptedAnswersByLocale ?? current.acceptedAnswersByLocale,
  });
  if (validationError) return c.json({ error: validationError }, 400);

  if (Object.keys(structuralFields).length > 0) {
    await db.update(questions).set(structuralFields).where(eq(questions.id, id)).run();
  }

  if (translations) {
    const structural = structuralTranslation(mergedTranslations)!;

    await deleteOptionsAndPairs(db, id);

    if (structural.options.length > 0) {
      await db.insert(questionOptions).values(
        structural.options.map((option, index) => ({ questionId: id, isCorrect: option.isCorrect, order: index + 1 })),
      ).run();
    }

    if (structural.matchingPairs.length > 0) {
      await db.insert(questionMatchingPairs).values(
        structural.matchingPairs.map((_, index) => ({ questionId: id, order: index + 1 })),
      ).run();
    }

    await writeQuestionTranslations(db, id, mergedTranslations);
  }

  if (acceptedAnswersShared !== undefined || acceptedAnswersByLocale !== undefined) {
    await writeAcceptedAnswers(
      db,
      id,
      body.answerFormat ?? current.answerFormat,
      acceptedAnswersShared ?? current.acceptedAnswersShared,
      acceptedAnswersByLocale ?? current.acceptedAnswersByLocale,
    );
  }

  if (tagIds) {
    await db.delete(questionTags).where(eq(questionTags.questionId, id)).run();
    if (tagIds.length > 0) {
      await db.insert(questionTags).values(tagIds.map((tagId) => ({ questionId: id, tagId }))).run();
    }
  }

  return c.json({ ok: true });
});

// `question_option_translations`/`question_matching_pair_translations` rows
// reference `questionOptions`/`questionMatchingPairs` ids via a foreign key
// with no ON DELETE CASCADE, so the translation rows must be deleted first
// or D1 rejects the structural delete with a foreign-key-constraint error.
async function deleteOptionsAndPairs(db: ReturnType<typeof getD1Db>, questionId: number) {
  const existingOptions = await db.select({ id: questionOptions.id }).from(questionOptions).where(eq(questionOptions.questionId, questionId)).all();
  if (existingOptions.length > 0) {
    await db
      .delete(questionOptionTranslations)
      .where(inArray(questionOptionTranslations.optionId, existingOptions.map((o) => o.id)))
      .run();
  }
  await db.delete(questionOptions).where(eq(questionOptions.questionId, questionId)).run();

  const existingPairs = await db.select({ id: questionMatchingPairs.id }).from(questionMatchingPairs).where(eq(questionMatchingPairs.questionId, questionId)).all();
  if (existingPairs.length > 0) {
    await db
      .delete(questionMatchingPairTranslations)
      .where(inArray(questionMatchingPairTranslations.pairId, existingPairs.map((p) => p.id)))
      .run();
  }
  await db.delete(questionMatchingPairs).where(eq(questionMatchingPairs.questionId, questionId)).run();
}

async function writeQuestionTranslations(
  db: ReturnType<typeof getD1Db>,
  questionId: number,
  translations: Partial<Record<Locale, QuestionTranslationInput>>,
) {
  for (const locale of Object.keys(translations) as Locale[]) {
    const t = translations[locale]!;
    await db
      .insert(questionTranslations)
      .values({ questionId, locale, promptMdx: t.promptMdx, resolutionMdx: t.resolutionMdx })
      .onConflictDoUpdate({
        target: [questionTranslations.questionId, questionTranslations.locale],
        set: { promptMdx: t.promptMdx, resolutionMdx: t.resolutionMdx },
      })
      .run();

    // Options and matching pairs are replaced wholesale per locale, same
    // rationale as the pre-existing wholesale-replace approach: simplest
    // correct approach at this data scale, sidesteps matching incoming rows
    // back to existing ids.
    const existingOptions = await db.select().from(questionOptions).where(eq(questionOptions.questionId, questionId)).orderBy(questionOptions.order).all();
    for (let i = 0; i < t.options.length && i < existingOptions.length; i++) {
      await db
        .insert(questionOptionTranslations)
        .values({ optionId: existingOptions[i].id, locale, textMdx: t.options[i].textMdx })
        .onConflictDoUpdate({
          target: [questionOptionTranslations.optionId, questionOptionTranslations.locale],
          set: { textMdx: t.options[i].textMdx },
        })
        .run();
    }

    const existingPairs = await db.select().from(questionMatchingPairs).where(eq(questionMatchingPairs.questionId, questionId)).orderBy(questionMatchingPairs.order).all();
    for (let i = 0; i < t.matchingPairs.length && i < existingPairs.length; i++) {
      await db
        .insert(questionMatchingPairTranslations)
        .values({ pairId: existingPairs[i].id, locale, leftMdx: t.matchingPairs[i].leftMdx, rightMdx: t.matchingPairs[i].rightMdx })
        .onConflictDoUpdate({
          target: [questionMatchingPairTranslations.pairId, questionMatchingPairTranslations.locale],
          set: { leftMdx: t.matchingPairs[i].leftMdx, rightMdx: t.matchingPairs[i].rightMdx },
        })
        .run();
    }
  }
}

async function writeAcceptedAnswers(
  db: ReturnType<typeof getD1Db>,
  questionId: number,
  answerFormat: 'text' | 'math',
  acceptedAnswersShared: string[],
  acceptedAnswersByLocale: Partial<Record<Locale, string[]>>,
) {
  await db.delete(questionAcceptedAnswers).where(eq(questionAcceptedAnswers.questionId, questionId)).run();

  if (answerFormat === 'math') {
    if (acceptedAnswersShared.length > 0) {
      await db.insert(questionAcceptedAnswers).values(acceptedAnswersShared.map((text) => ({ questionId, text, locale: null }))).run();
    }
    return;
  }

  const rows = (Object.keys(acceptedAnswersByLocale) as Locale[]).flatMap((locale) =>
    (acceptedAnswersByLocale[locale] ?? []).map((text) => ({ questionId, text, locale })),
  );
  if (rows.length > 0) {
    await db.insert(questionAcceptedAnswers).values(rows).run();
  }
}

questionsRoutes.delete('/:id', async (c) => {
  const db = getD1Db(c.env.DB);
  const id = Number(c.req.param('id'));
  await db.delete(questionTags).where(eq(questionTags.questionId, id)).run();
  await db.delete(questionAcceptedAnswers).where(eq(questionAcceptedAnswers.questionId, id)).run();
  await db.delete(questionTranslations).where(eq(questionTranslations.questionId, id)).run();
  await deleteOptionsAndPairs(db, id);
  await db.delete(questions).where(eq(questions.id, id)).run();
  return c.json({ ok: true });
});

export const tagsRoutes = new Hono<{ Bindings: Env }>();

tagsRoutes.get('/', async (c) => {
  const db = getD1Db(c.env.DB);
  return c.json(await getTagTree(db, 'pt-BR'));
});

tagsRoutes.post('/', async (c) => {
  const db = getD1Db(c.env.DB);
  const body = await c.req.json<{
    slug: string;
    parentTagId?: number;
    translations: Partial<Record<Locale, { name: string }>>;
  }>();
  const localeError = validateTranslationLocales(body.translations, { requirePtBr: true });
  if (localeError) return c.json({ error: localeError }, 400);
  const locales = Object.keys(body.translations) as Locale[];

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
  if (translations) {
    const localeError = validateTranslationLocales(translations, { requirePtBr: false });
    if (localeError) return c.json({ error: localeError }, 400);
  }
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
