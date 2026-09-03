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
  db.insert(schema.subjects).values({ slug: 'calculo', name: 'Cálculo', order: 1 }).run();
  const subject = db.select().from(schema.subjects).all()[0];

  db.insert(schema.topics)
    .values({ subjectId: subject.id, slug: 'limites', name: 'Limites', order: 1 })
    .run();
  const topic = db.select().from(schema.topics).all()[0];

  db.insert(schema.sections)
    .values({ topicId: topic.id, slug: 'limites-laterais', name: 'Limites Laterais', order: 1 })
    .run();
  const section = db.select().from(schema.sections).all()[0];

  db.insert(schema.lessons)
    .values([
      {
        sectionId: section.id,
        slug: 'definicao-de-limite',
        title: 'Definição de Limite',
        bodyMdx: '# Definição\n\nConteúdo de exemplo.',
        order: 1,
      },
      {
        sectionId: section.id,
        slug: 'limites-laterais-exemplo',
        title: 'Exemplo de Limite Lateral',
        bodyMdx: '# Exemplo\n\nOutro conteúdo.',
        order: 2,
      },
    ])
    .run();

  db.insert(schema.tags).values({ slug: 'limites', name: 'Limites' }).run();
  const topicTag = db.select().from(schema.tags).all()[0];

  db.insert(schema.tags)
    .values({ slug: 'limites-laterais', name: 'Limites Laterais', parentTagId: topicTag.id })
    .run();
  const subtopicTag = db.select().from(schema.tags).where(eq(schema.tags.slug, 'limites-laterais')).get()!;

  db.insert(schema.questions)
    .values({
      type: 'multiple_choice',
      difficulty: 'easy',
      promptMdx: 'Qual é o valor de $1 + 1$?',
      resolutionMdx: 'A soma de $1 + 1$ é $2$.',
      correctAnswer: null,
    })
    .run();
  const mcQuestion = db.select().from(schema.questions).all()[0];

  db.insert(schema.questionOptions)
    .values([
      { questionId: mcQuestion.id, textMdx: '1', isCorrect: false, order: 1 },
      { questionId: mcQuestion.id, textMdx: '2', isCorrect: true, order: 2 },
    ])
    .run();

  db.insert(schema.questionTags).values({ questionId: mcQuestion.id, tagId: topicTag.id }).run();

  db.insert(schema.questions)
    .values({
      type: 'numeric',
      difficulty: 'medium',
      promptMdx: 'Quanto é $3 \\div 2$?',
      resolutionMdx: 'A divisão de $3$ por $2$ é igual a $1.5$.',
      correctAnswer: '1.5',
    })
    .run();
  const numericQuestion = db.select().from(schema.questions).all()[1];

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
      promptMdx: 'Quais das afirmações abaixo são verdadeiras?',
      resolutionMdx: 'A primeira e a terceira afirmações são verdadeiras.',
      correctAnswer: null,
    })
    .run();
  const multiResponseQuestion = db.select().from(schema.questions).all()[2];

  db.insert(schema.questionOptions)
    .values([
      { questionId: multiResponseQuestion.id, textMdx: 'Afirmação 1', isCorrect: true, order: 1 },
      { questionId: multiResponseQuestion.id, textMdx: 'Afirmação 2', isCorrect: false, order: 2 },
      { questionId: multiResponseQuestion.id, textMdx: 'Afirmação 3', isCorrect: true, order: 3 },
    ])
    .run();

  db.insert(schema.questionTags).values({ questionId: multiResponseQuestion.id, tagId: topicTag.id }).run();

  db.insert(schema.questions)
    .values({
      type: 'true_false',
      difficulty: 'easy',
      promptMdx: 'O limite de uma função constante é sempre ela mesma?',
      resolutionMdx: 'Sim, $\\lim_{x \\to a} c = c$.',
      correctAnswer: 'true',
    })
    .run();
  const trueFalseQuestion = db.select().from(schema.questions).all()[3];

  db.insert(schema.questionTags).values({ questionId: trueFalseQuestion.id, tagId: topicTag.id }).run();

  db.insert(schema.questions)
    .values({
      type: 'short_text',
      difficulty: 'medium',
      promptMdx: 'Como se chama o teorema que garante uma raiz entre dois pontos de sinais opostos?',
      resolutionMdx: 'Teorema do Valor Intermediário.',
      correctAnswer: null,
    })
    .run();
  const shortTextQuestion = db.select().from(schema.questions).all()[4];

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
      promptMdx: 'Ordene os passos para calcular $\\lim_{x\\to 3}\\frac{x^2-9}{x-3}$.',
      resolutionMdx: 'Fatorar, cancelar, substituir.',
      correctAnswer: null,
    })
    .run();
  const orderingQuestion = db.select().from(schema.questions).all()[5];

  db.insert(schema.questionOptions)
    .values([
      { questionId: orderingQuestion.id, textMdx: 'Fatorar o numerador', isCorrect: false, order: 1 },
      { questionId: orderingQuestion.id, textMdx: 'Cancelar o fator comum', isCorrect: false, order: 2 },
      { questionId: orderingQuestion.id, textMdx: 'Substituir $x=3$', isCorrect: false, order: 3 },
    ])
    .run();

  db.insert(schema.questions)
    .values({
      type: 'matching',
      difficulty: 'hard',
      promptMdx: 'Associe cada tipo de descontinuidade à sua descrição.',
      resolutionMdx: 'Ver Lição 5.1.',
      correctAnswer: null,
    })
    .run();
  const matchingQuestion = db.select().from(schema.questions).all()[6];

  db.insert(schema.questionMatchingPairs)
    .values([
      { questionId: matchingQuestion.id, leftMdx: 'Removível', rightMdx: 'O limite existe mas difere de $f(a)$', order: 1 },
      { questionId: matchingQuestion.id, leftMdx: 'Salto', rightMdx: 'Os limites laterais existem mas discordam', order: 2 },
    ])
    .run();

  db.insert(schema.questions)
    .values({
      type: 'short_text',
      difficulty: 'hard',
      promptMdx: 'Calcule $\\lim_{x \\to 2} (3x + 1)$.',
      resolutionMdx: 'Substituição direta: $3(2)+1=7$.',
      correctAnswer: null,
      answerFormat: 'math',
    })
    .run();
  const mathShortTextQuestion = db.select().from(schema.questions).all()[7];

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

  it('getContentTree returns the full nested hierarchy', async () => {
    const tree = await getContentTree(db);

    expect(tree).toHaveLength(1);
    expect(tree[0].slug).toBe('calculo');
    expect(typeof tree[0].id).toBe('number');
    expect(tree[0].topics).toHaveLength(1);
    expect(tree[0].topics[0].slug).toBe('limites');
    expect(typeof tree[0].topics[0].id).toBe('number');
    expect(tree[0].topics[0].sections).toHaveLength(1);
    expect(tree[0].topics[0].sections[0].slug).toBe('limites-laterais');
    expect(typeof tree[0].topics[0].sections[0].id).toBe('number');
    expect(tree[0].topics[0].sections[0].lessons).toHaveLength(2);
    expect(tree[0].topics[0].sections[0].lessons.map((l) => l.slug)).toEqual([
      'definicao-de-limite',
      'limites-laterais-exemplo',
    ]);
    // The tree payload must not carry full lesson bodies.
    expect(tree[0].topics[0].sections[0].lessons[0]).not.toHaveProperty('bodyMdx');
  });

  it('getAllLessonSlugs returns every lesson slug', async () => {
    const slugs = await getAllLessonSlugs(db);
    expect(slugs.sort()).toEqual(['definicao-de-limite', 'limites-laterais-exemplo']);
  });

  it('getLessonBySlug returns the lesson with its ancestor chain', async () => {
    const lesson = await getLessonBySlug(db, 'definicao-de-limite');

    expect(lesson).toBeDefined();
    expect(lesson!.title).toBe('Definição de Limite');
    expect(lesson!.bodyMdx).toContain('Conteúdo de exemplo');
    expect(lesson!.section).toEqual({ slug: 'limites-laterais', name: 'Limites Laterais' });
    expect(lesson!.topic).toEqual({ slug: 'limites', name: 'Limites' });
    expect(lesson!.subject).toEqual({ slug: 'calculo', name: 'Cálculo' });
  });

  it('getLessonBySlug returns undefined for an unknown slug', async () => {
    expect(await getLessonBySlug(db, 'does-not-exist')).toBeUndefined();
  });

  it('getTagTree returns topics with their subtopics nested', async () => {
    const tree = await getTagTree(db);

    expect(tree).toHaveLength(1);
    expect(tree[0].slug).toBe('limites');
    expect(tree[0].subtopics).toHaveLength(1);
    expect(tree[0].subtopics[0].slug).toBe('limites-laterais');
  });

  it('getQuestionsForExport returns every question with its options and tags', async () => {
    const exported = await getQuestionsForExport(db);

    expect(exported).toHaveLength(8);

    const mc = exported.find((q) => q.type === 'multiple_choice')!;
    expect(mc).toBeDefined();
    expect(mc.options).toHaveLength(2);
    expect(mc.options.find((o) => o.isCorrect)?.textMdx).toBe('2');
    expect(mc.correctAnswer).toBeNull();
    expect(mc.tagIds).toHaveLength(1);

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

  it('getQuestionsForExport returns a true_false question with its correctAnswer', async () => {
    const exported = await getQuestionsForExport(db);
    const trueFalse = exported.find((q) => q.type === 'true_false')!;

    expect(trueFalse).toBeDefined();
    expect(trueFalse.correctAnswer).toBe('true');
    expect(trueFalse.options).toHaveLength(0);
    expect(trueFalse.acceptedAnswers).toHaveLength(0);
    expect(trueFalse.matchingPairs).toHaveLength(0);
  });

  it('getQuestionsForExport returns a short_text question with its accepted answers', async () => {
    const exported = await getQuestionsForExport(db);
    const shortText = exported.find((q) => q.type === 'short_text')!;

    expect(shortText).toBeDefined();
    expect(shortText.acceptedAnswers.map((a) => a.text)).toEqual([
      'Teorema do Valor Intermediário',
      'TVI',
    ]);
  });

  it('getQuestionsForExport returns a math-mode short_text question with answerFormat "math"', async () => {
    const exported = await getQuestionsForExport(db);
    const mathShortText = exported.find(
      (q) => q.type === 'short_text' && q.answerFormat === 'math',
    );

    expect(mathShortText).toBeDefined();
    expect(mathShortText!.acceptedAnswers.map((a) => a.text)).toEqual(['7']);
  });

  it('getQuestionsForExport returns "text" as the default answerFormat for a plain short_text question', async () => {
    const exported = await getQuestionsForExport(db);
    const plainShortText = exported.find(
      (q) => q.type === 'short_text' && q.promptMdx.includes('garante uma raiz'),
    );

    expect(plainShortText).toBeDefined();
    expect(plainShortText!.answerFormat).toBe('text');
  });

  it('getQuestionsForExport returns an ordering question with its options in correct order', async () => {
    const exported = await getQuestionsForExport(db);
    const ordering = exported.find((q) => q.type === 'ordering')!;

    expect(ordering).toBeDefined();
    expect(ordering.options.map((o) => o.textMdx)).toEqual([
      'Fatorar o numerador',
      'Cancelar o fator comum',
      'Substituir $x=3$',
    ]);
  });

  it('getQuestionsForExport returns a matching question with its pairs', async () => {
    const exported = await getQuestionsForExport(db);
    const matching = exported.find((q) => q.type === 'matching')!;

    expect(matching).toBeDefined();
    expect(matching.matchingPairs).toHaveLength(2);
    expect(matching.matchingPairs[0].leftMdx).toBe('Removível');
    expect(matching.matchingPairs[0].rightMdx).toBe('O limite existe mas difere de $f(a)$');
  });
});
