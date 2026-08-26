import { getDb } from '../src/client';
import {
  lessons,
  questionOptions,
  questions,
  questionTags,
  sections,
  subjects,
  tags,
  topics,
} from '../src/schema';

const db = getDb();

// Placeholder content only — proves the pipeline end to end.
// Real Cálculo/Limites content is added in sub-project 5, not here.
db.delete(questionTags).run();
db.delete(questionOptions).run();
db.delete(questions).run();
db.delete(tags).run();
db.delete(lessons).run();
db.delete(sections).run();
db.delete(topics).run();
db.delete(subjects).run();

db.insert(subjects).values({ slug: 'exemplo', name: 'Disciplina de Exemplo', order: 1 }).run();
const subject = db.select().from(subjects).all()[0];

db.insert(topics)
  .values({ subjectId: subject.id, slug: 'topico-exemplo', name: 'Tópico de Exemplo', order: 1 })
  .run();
const topic = db.select().from(topics).all()[0];

db.insert(sections)
  .values({ topicId: topic.id, slug: 'secao-exemplo', name: 'Seção de Exemplo', order: 1 })
  .run();
const section = db.select().from(sections).all()[0];

db.insert(lessons)
  .values({
    sectionId: section.id,
    slug: 'licao-de-exemplo',
    title: 'Lição de Exemplo',
    bodyMdx: `# Lição de Exemplo

Este é um conteúdo de placeholder para provar que o pipeline de
conteúdo funciona de ponta a ponta. O conteúdo real de Cálculo e
Limites será adicionado no sub-projeto 5.

Um exemplo de fórmula matemática: $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$.
`,
    order: 1,
  })
  .run();

db.insert(tags).values({ slug: 'limites', name: 'Limites' }).run();
const topicTag = db.select().from(tags).all()[0];

db.insert(tags)
  .values({ slug: 'limites-laterais', name: 'Limites Laterais', parentTagId: topicTag.id })
  .run();
const subtopicTag = db.select().from(tags).all()[1];

db.insert(questions)
  .values({
    type: 'multiple_choice',
    difficulty: 'easy',
    promptMdx: 'Qual é o valor de $1 + 1$?',
    resolutionMdx: 'A soma de $1 + 1$ é $2$, uma propriedade básica da aritmética.',
    correctAnswer: null,
  })
  .run();
const mcQuestion = db.select().from(questions).all()[0];

db.insert(questionOptions)
  .values([
    { questionId: mcQuestion.id, textMdx: '1', isCorrect: false, order: 1 },
    { questionId: mcQuestion.id, textMdx: '2', isCorrect: true, order: 2 },
    { questionId: mcQuestion.id, textMdx: '3', isCorrect: false, order: 3 },
  ])
  .run();

db.insert(questionTags).values({ questionId: mcQuestion.id, tagId: topicTag.id }).run();

db.insert(questions)
  .values({
    type: 'numeric',
    difficulty: 'medium',
    promptMdx: 'Calcule $\\lim_{x \\to 0} \\frac{\\sin x}{x}$.',
    resolutionMdx: 'Este é o limite fundamental trigonométrico, que vale $1$.',
    correctAnswer: '1',
  })
  .run();
const numericQuestion = db.select().from(questions).all()[1];

db.insert(questionTags)
  .values([
    { questionId: numericQuestion.id, tagId: topicTag.id },
    { questionId: numericQuestion.id, tagId: subtopicTag.id },
  ])
  .run();

console.log(
  'Seed complete: 1 subject, 1 topic, 1 section, 1 lesson, 2 tags, 2 questions.',
);
db.$client.close();
