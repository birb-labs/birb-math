import { Hono } from 'hono';
import {
  getD1Db,
  lessons,
  lessonTranslations,
  questionAcceptedAnswers,
  questionMatchingPairs,
  questionMatchingPairTranslations,
  questionOptions,
  questionOptionTranslations,
  questions,
  questionTags,
  questionTranslations,
  sections,
  sectionTranslations,
  subjects,
  subjectTranslations,
  tags,
  tagTranslations,
  topics,
  topicTranslations,
} from '@birb-math/content-schema';
import type { Env } from '../env';

export const exportRoutes = new Hono<{ Bindings: Env }>();

exportRoutes.get('/', async (c) => {
  const authHeader = c.req.header('Authorization') ?? '';
  if (authHeader !== `Bearer ${c.env.EXPORT_SECRET}`) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const db = getD1Db(c.env.DB);
  return c.json({
    subjects: await db.select().from(subjects).all(),
    subjectTranslations: await db.select().from(subjectTranslations).all(),
    topics: await db.select().from(topics).all(),
    topicTranslations: await db.select().from(topicTranslations).all(),
    sections: await db.select().from(sections).all(),
    sectionTranslations: await db.select().from(sectionTranslations).all(),
    lessons: await db.select().from(lessons).all(),
    lessonTranslations: await db.select().from(lessonTranslations).all(),
    tags: await db.select().from(tags).all(),
    tagTranslations: await db.select().from(tagTranslations).all(),
    questions: await db.select().from(questions).all(),
    questionTranslations: await db.select().from(questionTranslations).all(),
    questionOptions: await db.select().from(questionOptions).all(),
    questionOptionTranslations: await db.select().from(questionOptionTranslations).all(),
    questionTags: await db.select().from(questionTags).all(),
    questionAcceptedAnswers: await db.select().from(questionAcceptedAnswers).all(),
    questionMatchingPairs: await db.select().from(questionMatchingPairs).all(),
    questionMatchingPairTranslations: await db.select().from(questionMatchingPairTranslations).all(),
  });
});
