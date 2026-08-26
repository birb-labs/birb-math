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
      promptMdx: 'Calcule $\\lim_{x \\to 0} \\frac{\\sin x}{x}$.',
      resolutionMdx: 'O limite fundamental trigonométrico vale $1$.',
      correctAnswer: '1',
    })
    .run();
  const numericQuestion = db.select().from(schema.questions).all()[1];

  db.insert(schema.questionTags)
    .values([
      { questionId: numericQuestion.id, tagId: topicTag.id },
      { questionId: numericQuestion.id, tagId: subtopicTag.id },
    ])
    .run();
}

describe('content-schema queries', () => {
  let db: TestDb;

  beforeEach(() => {
    db = createTestDb();
    seedFixture(db);
  });

  it('getContentTree returns the full nested hierarchy', () => {
    const tree = getContentTree(db);

    expect(tree).toHaveLength(1);
    expect(tree[0].slug).toBe('calculo');
    expect(tree[0].topics).toHaveLength(1);
    expect(tree[0].topics[0].slug).toBe('limites');
    expect(tree[0].topics[0].sections).toHaveLength(1);
    expect(tree[0].topics[0].sections[0].slug).toBe('limites-laterais');
    expect(tree[0].topics[0].sections[0].lessons).toHaveLength(2);
    expect(tree[0].topics[0].sections[0].lessons.map((l) => l.slug)).toEqual([
      'definicao-de-limite',
      'limites-laterais-exemplo',
    ]);
    // The tree payload must not carry full lesson bodies.
    expect(tree[0].topics[0].sections[0].lessons[0]).not.toHaveProperty('bodyMdx');
  });

  it('getAllLessonSlugs returns every lesson slug', () => {
    const slugs = getAllLessonSlugs(db);
    expect(slugs.sort()).toEqual(['definicao-de-limite', 'limites-laterais-exemplo']);
  });

  it('getLessonBySlug returns the lesson with its ancestor chain', () => {
    const lesson = getLessonBySlug(db, 'definicao-de-limite');

    expect(lesson).toBeDefined();
    expect(lesson!.title).toBe('Definição de Limite');
    expect(lesson!.bodyMdx).toContain('Conteúdo de exemplo');
    expect(lesson!.section).toEqual({ slug: 'limites-laterais', name: 'Limites Laterais' });
    expect(lesson!.topic).toEqual({ slug: 'limites', name: 'Limites' });
    expect(lesson!.subject).toEqual({ slug: 'calculo', name: 'Cálculo' });
  });

  it('getLessonBySlug returns undefined for an unknown slug', () => {
    expect(getLessonBySlug(db, 'does-not-exist')).toBeUndefined();
  });

  it('getTagTree returns topics with their subtopics nested', () => {
    const tree = getTagTree(db);

    expect(tree).toHaveLength(1);
    expect(tree[0].slug).toBe('limites');
    expect(tree[0].subtopics).toHaveLength(1);
    expect(tree[0].subtopics[0].slug).toBe('limites-laterais');
  });

  it('getQuestionsForExport returns every question with its options and tags', () => {
    const exported = getQuestionsForExport(db);

    expect(exported).toHaveLength(2);

    const mc = exported.find((q) => q.type === 'multiple_choice')!;
    expect(mc).toBeDefined();
    expect(mc.options).toHaveLength(2);
    expect(mc.options.find((o) => o.isCorrect)?.textMdx).toBe('2');
    expect(mc.correctAnswer).toBeNull();
    expect(mc.tagIds).toHaveLength(1);

    const numeric = exported.find((q) => q.type === 'numeric')!;
    expect(numeric).toBeDefined();
    expect(numeric.options).toHaveLength(0);
    expect(numeric.correctAnswer).toBe('1');
    expect(numeric.tagIds).toHaveLength(2);
  });
});
