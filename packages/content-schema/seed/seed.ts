import { getDb } from '../src/client';
import { lessons, sections, subjects, topics } from '../src/schema';

const db = getDb();

// Placeholder content only — proves the pipeline end to end.
// Real Cálculo/Limites content is added in sub-project 5, not here.
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

console.log('Seed complete: 1 subject, 1 topic, 1 section, 1 lesson.');
