import { Hono } from 'hono';
import {
  getD1Db,
  lessons,
  questionAcceptedAnswers,
  questionMatchingPairs,
  questionOptions,
  questions,
  questionTags,
  sections,
  subjects,
  tags,
  topics,
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
    topics: await db.select().from(topics).all(),
    sections: await db.select().from(sections).all(),
    lessons: await db.select().from(lessons).all(),
    tags: await db.select().from(tags).all(),
    questions: await db.select().from(questions).all(),
    questionOptions: await db.select().from(questionOptions).all(),
    questionTags: await db.select().from(questionTags).all(),
    questionAcceptedAnswers: await db.select().from(questionAcceptedAnswers).all(),
    questionMatchingPairs: await db.select().from(questionMatchingPairs).all(),
  });
});
