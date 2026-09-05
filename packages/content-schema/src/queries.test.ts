import { beforeEach, describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { eq } from 'drizzle-orm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as schema from './schema';
import { getAllLessonSlugs, getContentTree, getLessonBySlug, getQuestionsForExport, getTagTree } from './queries';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createTestDb() {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: path.resolve(__dirname, '../drizzle') });
  return db;
}

type TestDb = ReturnType<typeof createTestDb>;

function seedFixture(db: TestDb) {
  db.insert(schema.subjects).values({ slug: 'calculo', order: 1 }).run();
  const subject = db.select().from(schema.subjects).all()[0];
  db.insert(schema.subjectTranslations)
    .values({ subjectId: subject.id, locale: 'pt-BR', name: 'Cálculo' })
    .run();

  db.insert(schema.topics).values({ subjectId: subject.id, slug: 'limites', order: 1 }).run();
  const topic = db.select().from(schema.topics).all()[0];
  db.insert(schema.topicTranslations)
    .values({ topicId: topic.id, locale: 'pt-BR', name: 'Limites' })
    .run();

  db.insert(schema.sections)
    .values({ topicId: topic.id, slug: 'limites-laterais', order: 1 })
    .run();
  const section = db.select().from(schema.sections).all()[0];
  db.insert(schema.sectionTranslations)
    .values({ sectionId: section.id, locale: 'pt-BR', name: 'Limites Laterais' })
    .run();

  db.insert(schema.lessons)
    .values([
      { sectionId: section.id, slug: 'definicao-de-limite', order: 1 },
      { sectionId: section.id, slug: 'limites-laterais-exemplo', order: 2 },
    ])
    .run();
  const lessons = db.select().from(schema.lessons).all();
  const definicaoLesson = lessons.find((l) => l.slug === 'definicao-de-limite')!;
  const exemploLesson = lessons.find((l) => l.slug === 'limites-laterais-exemplo')!;
  db.insert(schema.lessonTranslations)
    .values([
      {
        lessonId: definicaoLesson.id,
        locale: 'pt-BR',
        title: 'Definição de Limite',
        bodyMdx: '# Definição\n\nConteúdo de exemplo.',
      },
      {
        lessonId: exemploLesson.id,
        locale: 'pt-BR',
        title: 'Exemplo de Limite Lateral',
        bodyMdx: '# Exemplo\n\nOutro conteúdo.',
      },
    ])
    .run();

  db.insert(schema.tags).values({ slug: 'limites' }).run();
  const topicTag = db.select().from(schema.tags).all()[0];
  db.insert(schema.tagTranslations)
    .values({ tagId: topicTag.id, locale: 'pt-BR', name: 'Limites' })
    .run();

  db.insert(schema.tags)
    .values({ slug: 'limites-laterais', parentTagId: topicTag.id })
    .run();
  const subtopicTag = db.select().from(schema.tags).where(eq(schema.tags.slug, 'limites-laterais')).get()!;
  db.insert(schema.tagTranslations)
    .values({ tagId: subtopicTag.id, locale: 'pt-BR', name: 'Limites Laterais' })
    .run();

  db.insert(schema.questions)
    .values({
      type: 'multiple_choice',
      difficulty: 'easy',
      correctAnswer: null,
    })
    .run();
  const mcQuestion = db.select().from(schema.questions).all()[0];
  db.insert(schema.questionTranslations)
    .values({
      questionId: mcQuestion.id,
      locale: 'pt-BR',
      promptMdx: 'Qual é o valor de $1 + 1$?',
      resolutionMdx: 'A soma de $1 + 1$ é $2$.',
    })
    .run();

  db.insert(schema.questionOptions)
    .values([
      { questionId: mcQuestion.id, isCorrect: false, order: 1 },
      { questionId: mcQuestion.id, isCorrect: true, order: 2 },
    ])
    .run();
  const mcOptions = db.select().from(schema.questionOptions).where(eq(schema.questionOptions.questionId, mcQuestion.id)).all();
  db.insert(schema.questionOptionTranslations)
    .values([
      { optionId: mcOptions[0].id, locale: 'pt-BR', textMdx: '1' },
      { optionId: mcOptions[1].id, locale: 'pt-BR', textMdx: '2' },
    ])
    .run();

  db.insert(schema.questionTags).values({ questionId: mcQuestion.id, tagId: topicTag.id }).run();

  db.insert(schema.questions)
    .values({
      type: 'numeric',
      difficulty: 'medium',
      correctAnswer: '1.5',
    })
    .run();
  const numericQuestion = db.select().from(schema.questions).all()[1];
  db.insert(schema.questionTranslations)
    .values({
      questionId: numericQuestion.id,
      locale: 'pt-BR',
      promptMdx: 'Quanto é $3 \\div 2$?',
      resolutionMdx: 'A divisão de $3$ por $2$ é igual a $1.5$.',
    })
    .run();

  db.insert(schema.questionTags)
    .values([
      { questionId: numericQuestion.id, tagId: topicTag.id },
      { questionId: numericQuestion.id, tagId: subtopicTag.id },
    ])
    .run();

  db.insert(schema.questions)
    .values({
      type: 'multiple_response',
      difficulty: 'hard',
      correctAnswer: null,
    })
    .run();
  const multiResponseQuestion = db.select().from(schema.questions).all()[2];
  db.insert(schema.questionTranslations)
    .values({
      questionId: multiResponseQuestion.id,
      locale: 'pt-BR',
      promptMdx: 'Quais das afirmações abaixo são verdadeiras?',
      resolutionMdx: 'A primeira e a terceira afirmações são verdadeiras.',
    })
    .run();

  db.insert(schema.questionOptions)
    .values([
      { questionId: multiResponseQuestion.id, isCorrect: true, order: 1 },
      { questionId: multiResponseQuestion.id, isCorrect: false, order: 2 },
      { questionId: multiResponseQuestion.id, isCorrect: true, order: 3 },
    ])
    .run();
  const multiResponseOptions = db
    .select()
    .from(schema.questionOptions)
    .where(eq(schema.questionOptions.questionId, multiResponseQuestion.id))
    .all();
  db.insert(schema.questionOptionTranslations)
    .values([
      { optionId: multiResponseOptions[0].id, locale: 'pt-BR', textMdx: 'Afirmação 1' },
      { optionId: multiResponseOptions[1].id, locale: 'pt-BR', textMdx: 'Afirmação 2' },
      { optionId: multiResponseOptions[2].id, locale: 'pt-BR', textMdx: 'Afirmação 3' },
    ])
    .run();

  db.insert(schema.questionTags).values({ questionId: multiResponseQuestion.id, tagId: topicTag.id }).run();

  db.insert(schema.questions)
    .values({
      type: 'true_false',
      difficulty: 'easy',
      correctAnswer: 'true',
    })
    .run();
  const trueFalseQuestion = db.select().from(schema.questions).all()[3];
  db.insert(schema.questionTranslations)
    .values({
      questionId: trueFalseQuestion.id,
      locale: 'pt-BR',
      promptMdx: 'O limite de uma função constante é sempre ela mesma?',
      resolutionMdx: 'Sim, $\\lim_{x \\to a} c = c$.',
    })
    .run();

  db.insert(schema.questionTags).values({ questionId: trueFalseQuestion.id, tagId: topicTag.id }).run();

  db.insert(schema.questions)
    .values({
      type: 'short_text',
      difficulty: 'medium',
      correctAnswer: null,
    })
    .run();
  const shortTextQuestion = db.select().from(schema.questions).all()[4];
  db.insert(schema.questionTranslations)
    .values({
      questionId: shortTextQuestion.id,
      locale: 'pt-BR',
      promptMdx: 'Como se chama o teorema que garante uma raiz entre dois pontos de sinais opostos?',
      resolutionMdx: 'Teorema do Valor Intermediário.',
    })
    .run();

  db.insert(schema.questionAcceptedAnswers)
    .values([
      { questionId: shortTextQuestion.id, text: 'Teorema do Valor Intermediário' },
      { questionId: shortTextQuestion.id, text: 'TVI' },
    ])
    .run();

  db.insert(schema.questions)
    .values({
      type: 'ordering',
      difficulty: 'medium',
      correctAnswer: null,
    })
    .run();
  const orderingQuestion = db.select().from(schema.questions).all()[5];
  db.insert(schema.questionTranslations)
    .values({
      questionId: orderingQuestion.id,
      locale: 'pt-BR',
      promptMdx: 'Ordene os passos para calcular $\\lim_{x\\to 3}\\frac{x^2-9}{x-3}$.',
      resolutionMdx: 'Fatorar, cancelar, substituir.',
    })
    .run();

  db.insert(schema.questionOptions)
    .values([
      { questionId: orderingQuestion.id, isCorrect: false, order: 1 },
      { questionId: orderingQuestion.id, isCorrect: false, order: 2 },
      { questionId: orderingQuestion.id, isCorrect: false, order: 3 },
    ])
    .run();
  const orderingOptions = db
    .select()
    .from(schema.questionOptions)
    .where(eq(schema.questionOptions.questionId, orderingQuestion.id))
    .all();
  db.insert(schema.questionOptionTranslations)
    .values([
      { optionId: orderingOptions[0].id, locale: 'pt-BR', textMdx: 'Fatorar o numerador' },
      { optionId: orderingOptions[1].id, locale: 'pt-BR', textMdx: 'Cancelar o fator comum' },
      { optionId: orderingOptions[2].id, locale: 'pt-BR', textMdx: 'Substituir $x=3$' },
    ])
    .run();

  db.insert(schema.questions)
    .values({
      type: 'matching',
      difficulty: 'hard',
      correctAnswer: null,
    })
    .run();
  const matchingQuestion = db.select().from(schema.questions).all()[6];
  db.insert(schema.questionTranslations)
    .values({
      questionId: matchingQuestion.id,
      locale: 'pt-BR',
      promptMdx: 'Associe cada tipo de descontinuidade à sua descrição.',
      resolutionMdx: 'Ver Lição 5.1.',
    })
    .run();

  db.insert(schema.questionMatchingPairs)
    .values([
      { questionId: matchingQuestion.id, order: 1 },
      { questionId: matchingQuestion.id, order: 2 },
    ])
    .run();
  const matchingPairs = db
    .select()
    .from(schema.questionMatchingPairs)
    .where(eq(schema.questionMatchingPairs.questionId, matchingQuestion.id))
    .all();
  db.insert(schema.questionMatchingPairTranslations)
    .values([
      {
        pairId: matchingPairs[0].id,
        locale: 'pt-BR',
        leftMdx: 'Removível',
        rightMdx: 'O limite existe mas difere de $f(a)$',
      },
      {
        pairId: matchingPairs[1].id,
        locale: 'pt-BR',
        leftMdx: 'Salto',
        rightMdx: 'Os limites laterais existem mas discordam',
      },
    ])
    .run();

  db.insert(schema.questions)
    .values({
      type: 'short_text',
      difficulty: 'hard',
      correctAnswer: null,
      answerFormat: 'math',
    })
    .run();
  const mathShortTextQuestion = db.select().from(schema.questions).all()[7];
  db.insert(schema.questionTranslations)
    .values({
      questionId: mathShortTextQuestion.id,
      locale: 'pt-BR',
      promptMdx: 'Calcule $\\lim_{x \\to 2} (3x + 1)$.',
      resolutionMdx: 'Substituição direta: $3(2)+1=7$.',
    })
    .run();

  db.insert(schema.questionAcceptedAnswers)
    .values([{ questionId: mathShortTextQuestion.id, text: '7' }])
    .run();
}

describe('content-schema queries', () => {
  let db: TestDb;

  beforeEach(() => {
    db = createTestDb();
    seedFixture(db);
  });

  it('getContentTree returns the full nested hierarchy in the requested locale', async () => {
    const tree = await getContentTree(db, 'pt-BR');

    expect(tree).toHaveLength(1);
    expect(tree[0].slug).toBe('calculo');
    expect(tree[0].name).toBe('Cálculo');
    expect(typeof tree[0].id).toBe('number');
    expect(tree[0].topics).toHaveLength(1);
    expect(tree[0].topics[0].slug).toBe('limites');
    expect(tree[0].topics[0].name).toBe('Limites');
    expect(tree[0].topics[0].sections).toHaveLength(1);
    expect(tree[0].topics[0].sections[0].slug).toBe('limites-laterais');
    expect(tree[0].topics[0].sections[0].name).toBe('Limites Laterais');
    expect(tree[0].topics[0].sections[0].lessons).toHaveLength(2);
    expect(tree[0].topics[0].sections[0].lessons.map((l) => l.slug)).toEqual([
      'definicao-de-limite',
      'limites-laterais-exemplo',
    ]);
    expect(tree[0].topics[0].sections[0].lessons[0].title).toBe('Definição de Limite');
    // The tree payload must not carry full lesson bodies.
    expect(tree[0].topics[0].sections[0].lessons[0]).not.toHaveProperty('bodyMdx');
  });

  it('getContentTree falls back to pt-BR names when a locale has no translation', async () => {
    const tree = await getContentTree(db, 'en-US');

    expect(tree[0].name).toBe('Cálculo');
    expect(tree[0].topics[0].name).toBe('Limites');
  });

  it('getAllLessonSlugs returns every lesson slug regardless of locale', async () => {
    const slugs = await getAllLessonSlugs(db);
    expect(slugs.sort()).toEqual(['definicao-de-limite', 'limites-laterais-exemplo']);
  });

  it('getLessonBySlug returns the lesson with its ancestor chain in the requested locale', async () => {
    const lesson = await getLessonBySlug(db, 'definicao-de-limite', 'pt-BR');

    expect(lesson).toBeDefined();
    expect(lesson!.title).toBe('Definição de Limite');
    expect(lesson!.bodyMdx).toContain('Conteúdo de exemplo');
    expect(lesson!.section).toEqual({ slug: 'limites-laterais', name: 'Limites Laterais' });
    expect(lesson!.topic).toEqual({ slug: 'limites', name: 'Limites' });
    expect(lesson!.subject).toEqual({ slug: 'calculo', name: 'Cálculo' });
    expect(lesson!.isFallback).toBe(false);
  });

  it('getLessonBySlug falls back to pt-BR and sets isFallback when untranslated', async () => {
    const lesson = await getLessonBySlug(db, 'definicao-de-limite', 'es');

    expect(lesson).toBeDefined();
    expect(lesson!.title).toBe('Definição de Limite');
    expect(lesson!.isFallback).toBe(true);
  });

  it('getLessonBySlug prefers the real translation over the fallback when one exists', async () => {
    const lessonRow = db.select().from(schema.lessons).where(eq(schema.lessons.slug, 'definicao-de-limite')).get()!;
    db.insert(schema.lessonTranslations)
      .values({ lessonId: lessonRow.id, locale: 'en-US', title: 'Definition of Limit', bodyMdx: '# Definition\n\nSample content.' })
      .run();

    const lesson = await getLessonBySlug(db, 'definicao-de-limite', 'en-US');

    expect(lesson!.title).toBe('Definition of Limit');
    expect(lesson!.isFallback).toBe(false);
  });

  it('getLessonBySlug returns undefined for an unknown slug', async () => {
    expect(await getLessonBySlug(db, 'does-not-exist', 'pt-BR')).toBeUndefined();
  });

  it('getTagTree returns topics with their subtopics nested in the requested locale', async () => {
    const tree = await getTagTree(db, 'pt-BR');

    expect(tree).toHaveLength(1);
    expect(tree[0].slug).toBe('limites');
    expect(tree[0].name).toBe('Limites');
    expect(tree[0].subtopics).toHaveLength(1);
    expect(tree[0].subtopics[0].slug).toBe('limites-laterais');
    expect(tree[0].subtopics[0].name).toBe('Limites Laterais');
  });

  it('getQuestionsForExport returns every question with its options and tags in the requested locale', async () => {
    const exported = await getQuestionsForExport(db, 'pt-BR');

    expect(exported).toHaveLength(8);

    const mc = exported.find((q) => q.type === 'multiple_choice')!;
    expect(mc).toBeDefined();
    expect(mc.options).toHaveLength(2);
    expect(mc.options.find((o) => o.isCorrect)?.textMdx).toBe('2');
    expect(mc.correctAnswer).toBeNull();
    expect(mc.tagIds).toHaveLength(1);
    expect(mc.isFallback).toBe(false);

    const numeric = exported.find((q) => q.type === 'numeric')!;
    expect(numeric).toBeDefined();
    expect(numeric.options).toHaveLength(0);
    expect(numeric.correctAnswer).toBe('1.5');
    expect(numeric.tagIds).toHaveLength(2);

    const multiResponse = exported.find((q) => q.type === 'multiple_response')!;
    expect(multiResponse).toBeDefined();
    expect(multiResponse.options).toHaveLength(3);
    expect(multiResponse.options.filter((o) => o.isCorrect)).toHaveLength(2);
    expect(multiResponse.correctAnswer).toBeNull();
    expect(multiResponse.tagIds).toHaveLength(1);
  });

  it('getQuestionsForExport falls back to pt-BR and sets isFallback for an untranslated question', async () => {
    const exported = await getQuestionsForExport(db, 'en-US');
    const mc = exported.find((q) => q.type === 'multiple_choice')!;

    expect(mc.promptMdx).toBe('Qual é o valor de $1 + 1$?');
    expect(mc.isFallback).toBe(true);
  });

  it('getQuestionsForExport returns a true_false question with its correctAnswer', async () => {
    const exported = await getQuestionsForExport(db, 'pt-BR');
    const trueFalse = exported.find((q) => q.type === 'true_false')!;

    expect(trueFalse).toBeDefined();
    expect(trueFalse.correctAnswer).toBe('true');
    expect(trueFalse.options).toHaveLength(0);
    expect(trueFalse.acceptedAnswers).toHaveLength(0);
    expect(trueFalse.matchingPairs).toHaveLength(0);
  });

  it('getQuestionsForExport returns a short_text question with its pt-BR-locale accepted answers', async () => {
    const exported = await getQuestionsForExport(db, 'pt-BR');
    const shortText = exported.find((q) => q.type === 'short_text' && q.answerFormat === 'text')!;

    expect(shortText).toBeDefined();
    expect(shortText.acceptedAnswers.map((a) => a.text).sort()).toEqual(
      ['TVI', 'Teorema do Valor Intermediário'].sort(),
    );
  });

  it('getQuestionsForExport excludes text-mode accepted answers authored for a different locale', async () => {
    const shortTextQuestion = db
      .select()
      .from(schema.questions)
      .all()
      .find((q) => q.type === 'short_text' && q.answerFormat === 'text')!;
    db.insert(schema.questionAcceptedAnswers)
      .values({ questionId: shortTextQuestion.id, text: 'Intermediate Value Theorem', locale: 'en-US' })
      .run();

    const exportedPtBr = await getQuestionsForExport(db, 'pt-BR');
    const shortTextPtBr = exportedPtBr.find((q) => q.id === shortTextQuestion.id)!;
    expect(shortTextPtBr.acceptedAnswers.map((a) => a.text)).not.toContain('Intermediate Value Theorem');

    const exportedEnUs = await getQuestionsForExport(db, 'en-US');
    const shortTextEnUs = exportedEnUs.find((q) => q.id === shortTextQuestion.id)!;
    expect(shortTextEnUs.acceptedAnswers.map((a) => a.text)).toContain('Intermediate Value Theorem');
  });

  it('getQuestionsForExport includes a math-mode accepted answer (locale NULL) in every locale', async () => {
    const exportedPtBr = await getQuestionsForExport(db, 'pt-BR');
    const exportedEnUs = await getQuestionsForExport(db, 'en-US');
    const mathPtBr = exportedPtBr.find((q) => q.answerFormat === 'math')!;
    const mathEnUs = exportedEnUs.find((q) => q.answerFormat === 'math')!;

    expect(mathPtBr.acceptedAnswers.map((a) => a.text)).toEqual(['7']);
    expect(mathEnUs.acceptedAnswers.map((a) => a.text)).toEqual(['7']);
  });

  it('getQuestionsForExport returns "text" as the default answerFormat for a plain short_text question', async () => {
    const exported = await getQuestionsForExport(db, 'pt-BR');
    const plainShortText = exported.find(
      (q) => q.type === 'short_text' && q.promptMdx.includes('garante uma raiz'),
    );

    expect(plainShortText).toBeDefined();
    expect(plainShortText!.answerFormat).toBe('text');
  });

  it('getQuestionsForExport returns an ordering question with its options in correct order', async () => {
    const exported = await getQuestionsForExport(db, 'pt-BR');
    const ordering = exported.find((q) => q.type === 'ordering')!;

    expect(ordering).toBeDefined();
    expect(ordering.options.map((o) => o.textMdx)).toEqual([
      'Fatorar o numerador',
      'Cancelar o fator comum',
      'Substituir $x=3$',
    ]);
  });

  it('getQuestionsForExport returns a matching question with its pairs', async () => {
    const exported = await getQuestionsForExport(db, 'pt-BR');
    const matching = exported.find((q) => q.type === 'matching')!;

    expect(matching).toBeDefined();
    expect(matching.matchingPairs).toHaveLength(2);
    expect(matching.matchingPairs[0].leftMdx).toBe('Removível');
    expect(matching.matchingPairs[0].rightMdx).toBe('O limite existe mas difere de $f(a)$');
  });
});
