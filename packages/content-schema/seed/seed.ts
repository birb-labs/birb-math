import { eq } from 'drizzle-orm';
import { getDb } from '../src/client';
import {
  lessonTranslations,
  lessons,
  questionOptionTranslations,
  questionOptions,
  questionTranslations,
  questions,
  questionTags,
  sectionTranslations,
  sections,
  subjectTranslations,
  subjects,
  tagTranslations,
  tags,
  topicTranslations,
  topics,
} from '../src/schema';

const db = getDb();

// Placeholder content only — proves the pipeline end to end.
// Real Cálculo/Limites content is added in sub-project 5, not here.
db.delete(questionTags).run();
db.delete(questionOptionTranslations).run();
db.delete(questionOptions).run();
db.delete(questionTranslations).run();
db.delete(questions).run();
db.delete(tagTranslations).run();
db.delete(tags).run();
db.delete(lessonTranslations).run();
db.delete(lessons).run();
db.delete(sectionTranslations).run();
db.delete(sections).run();
db.delete(topicTranslations).run();
db.delete(topics).run();
db.delete(subjectTranslations).run();
db.delete(subjects).run();

db.insert(subjects).values({ slug: 'exemplo', order: 1 }).run();
const subject = db.select().from(subjects).all()[0];
db.insert(subjectTranslations)
  .values({ subjectId: subject.id, locale: 'pt-BR', name: 'Disciplina de Exemplo' })
  .run();

db.insert(topics)
  .values({ subjectId: subject.id, slug: 'topico-exemplo', order: 1 })
  .run();
const topic = db.select().from(topics).all()[0];
db.insert(topicTranslations)
  .values({ topicId: topic.id, locale: 'pt-BR', name: 'Tópico de Exemplo' })
  .run();

db.insert(sections)
  .values({ topicId: topic.id, slug: 'secao-exemplo', order: 1 })
  .run();
const section = db.select().from(sections).all()[0];
db.insert(sectionTranslations)
  .values({ sectionId: section.id, locale: 'pt-BR', name: 'Seção de Exemplo' })
  .run();

db.insert(lessons)
  .values({
    sectionId: section.id,
    slug: 'licao-de-exemplo',
    order: 1,
  })
  .run();
const lesson = db.select().from(lessons).all()[0];
db.insert(lessonTranslations)
  .values({
    lessonId: lesson.id,
    locale: 'pt-BR',
    title: 'Lição de Exemplo',
    bodyMdx: `# Lição de Exemplo

Este é um conteúdo de placeholder para provar que o pipeline de
conteúdo funciona de ponta a ponta. O conteúdo real de Cálculo e
Limites será adicionado no sub-projeto 5.

Um exemplo de fórmula matemática: $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$.
`,
  })
  .run();

db.insert(tags).values({ slug: 'limites' }).run();
const topicTag = db.select().from(tags).all()[0];
db.insert(tagTranslations)
  .values({ tagId: topicTag.id, locale: 'pt-BR', name: 'Limites' })
  .run();

db.insert(tags)
  .values({ slug: 'limites-laterais', parentTagId: topicTag.id })
  .run();
const subtopicTag = db.select().from(tags).where(eq(tags.slug, 'limites-laterais')).get()!;
db.insert(tagTranslations)
  .values({ tagId: subtopicTag.id, locale: 'pt-BR', name: 'Limites Laterais' })
  .run();

db.insert(questions)
  .values({
    type: 'multiple_choice',
    difficulty: 'easy',
    correctAnswer: null,
  })
  .run();
const mcQuestion = db.select().from(questions).all()[0];
db.insert(questionTranslations)
  .values({
    questionId: mcQuestion.id,
    locale: 'pt-BR',
    promptMdx: 'Qual é o valor de $1 + 1$?',
    resolutionMdx: 'A soma de $1 + 1$ é $2$, uma propriedade básica da aritmética.',
  })
  .run();

db.insert(questionOptions)
  .values([
    { questionId: mcQuestion.id, isCorrect: false, order: 1 },
    { questionId: mcQuestion.id, isCorrect: true, order: 2 },
    { questionId: mcQuestion.id, isCorrect: false, order: 3 },
  ])
  .run();
const mcOptions = db
  .select()
  .from(questionOptions)
  .where(eq(questionOptions.questionId, mcQuestion.id))
  .all();
db.insert(questionOptionTranslations)
  .values([
    { optionId: mcOptions[0].id, locale: 'pt-BR', textMdx: '1' },
    { optionId: mcOptions[1].id, locale: 'pt-BR', textMdx: '2' },
    { optionId: mcOptions[2].id, locale: 'pt-BR', textMdx: '3' },
  ])
  .run();

db.insert(questionTags).values({ questionId: mcQuestion.id, tagId: topicTag.id }).run();

db.insert(questions)
  .values({
    type: 'numeric',
    difficulty: 'medium',
    correctAnswer: '1.5',
  })
  .run();
const numericQuestion = db.select().from(questions).all()[1];
db.insert(questionTranslations)
  .values({
    questionId: numericQuestion.id,
    locale: 'pt-BR',
    promptMdx: 'Quanto é $3 \\div 2$?',
    resolutionMdx: 'A divisão de $3$ por $2$ é igual a $1.5$.',
  })
  .run();

db.insert(questionTags)
  .values([
    { questionId: numericQuestion.id, tagId: topicTag.id },
    { questionId: numericQuestion.id, tagId: subtopicTag.id },
  ])
  .run();

db.insert(questions)
  .values({
    type: 'multiple_response',
    difficulty: 'hard',
    correctAnswer: null,
  })
  .run();
const multiResponseQuestion = db.select().from(questions).all()[2];
db.insert(questionTranslations)
  .values({
    questionId: multiResponseQuestion.id,
    locale: 'pt-BR',
    promptMdx: 'Quais das afirmações abaixo são verdadeiras?',
    resolutionMdx:
      'A afirmação 1 e a afirmação 3 são verdadeiras; a afirmação 2 é falsa.',
  })
  .run();

db.insert(questionOptions)
  .values([
    { questionId: multiResponseQuestion.id, isCorrect: true, order: 1 },
    { questionId: multiResponseQuestion.id, isCorrect: false, order: 2 },
    { questionId: multiResponseQuestion.id, isCorrect: true, order: 3 },
    { questionId: multiResponseQuestion.id, isCorrect: false, order: 4 },
  ])
  .run();
const multiResponseOptions = db
  .select()
  .from(questionOptions)
  .where(eq(questionOptions.questionId, multiResponseQuestion.id))
  .all();
db.insert(questionOptionTranslations)
  .values([
    { optionId: multiResponseOptions[0].id, locale: 'pt-BR', textMdx: 'Afirmação 1' },
    { optionId: multiResponseOptions[1].id, locale: 'pt-BR', textMdx: 'Afirmação 2' },
    { optionId: multiResponseOptions[2].id, locale: 'pt-BR', textMdx: 'Afirmação 3' },
    { optionId: multiResponseOptions[3].id, locale: 'pt-BR', textMdx: 'Afirmação 4' },
  ])
  .run();

db.insert(questionTags)
  .values([
    { questionId: multiResponseQuestion.id, tagId: topicTag.id },
    { questionId: multiResponseQuestion.id, tagId: subtopicTag.id },
  ])
  .run();

console.log(
  'Seed complete: 1 subject, 1 topic, 1 section, 1 lesson, 2 tags, 3 questions.',
);
db.$client.close();
