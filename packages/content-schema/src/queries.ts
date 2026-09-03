import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import {
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
} from './schema';

type Db = BetterSQLite3Database<Record<string, unknown>> | DrizzleD1Database<Record<string, unknown>>;

export interface ContentTree {
  id: number;
  slug: string;
  name: string;
  topics: {
    id: number;
    slug: string;
    name: string;
    sections: {
      id: number;
      slug: string;
      name: string;
      lessons: { slug: string; title: string }[];
    }[];
  }[];
}

export async function getContentTree(db: Db): Promise<ContentTree[]> {
  const typedDb = db as BetterSQLite3Database<Record<string, unknown>>;
  const allSubjects = await typedDb.select().from(subjects).orderBy(subjects.order).all();
  const allTopics = await typedDb.select().from(topics).orderBy(topics.order).all();
  const allSections = await typedDb.select().from(sections).orderBy(sections.order).all();
  const allLessons = await typedDb
    .select({ id: lessons.id, sectionId: lessons.sectionId, slug: lessons.slug, title: lessons.title, order: lessons.order })
    .from(lessons)
    .orderBy(lessons.order)
    .all();

  return allSubjects.map((subject) => ({
    id: subject.id,
    slug: subject.slug,
    name: subject.name,
    topics: allTopics
      .filter((topic) => topic.subjectId === subject.id)
      .map((topic) => ({
        id: topic.id,
        slug: topic.slug,
        name: topic.name,
        sections: allSections
          .filter((section) => section.topicId === topic.id)
          .map((section) => ({
            id: section.id,
            slug: section.slug,
            name: section.name,
            lessons: allLessons
              .filter((lesson) => lesson.sectionId === section.id)
              .map((lesson) => ({ slug: lesson.slug, title: lesson.title })),
          })),
      })),
  }));
}

export async function getAllLessonSlugs(db: Db): Promise<string[]> {
  const typedDb = db as BetterSQLite3Database<Record<string, unknown>>;
  const rows = await typedDb.select({ slug: lessons.slug }).from(lessons).all();
  return rows.map((row) => row.slug);
}

export interface LessonWithAncestors {
  slug: string;
  title: string;
  bodyMdx: string;
  section: { slug: string; name: string };
  topic: { slug: string; name: string };
  subject: { slug: string; name: string };
}

export async function getLessonBySlug(db: Db, slug: string): Promise<LessonWithAncestors | undefined> {
  const typedDb = db as BetterSQLite3Database<Record<string, unknown>>;
  const row = await typedDb
    .select({
      slug: lessons.slug,
      title: lessons.title,
      bodyMdx: lessons.bodyMdx,
      sectionSlug: sections.slug,
      sectionName: sections.name,
      topicSlug: topics.slug,
      topicName: topics.name,
      subjectSlug: subjects.slug,
      subjectName: subjects.name,
    })
    .from(lessons)
    .innerJoin(sections, eq(lessons.sectionId, sections.id))
    .innerJoin(topics, eq(sections.topicId, topics.id))
    .innerJoin(subjects, eq(topics.subjectId, subjects.id))
    .where(eq(lessons.slug, slug))
    .get();

  if (!row) return undefined;

  return {
    slug: row.slug,
    title: row.title,
    bodyMdx: row.bodyMdx,
    section: { slug: row.sectionSlug, name: row.sectionName },
    topic: { slug: row.topicSlug, name: row.topicName },
    subject: { slug: row.subjectSlug, name: row.subjectName },
  };
}

export interface TagNode {
  id: number;
  slug: string;
  name: string;
}

export interface TopicNode extends TagNode {
  subtopics: TagNode[];
}

export async function getTagTree(db: Db): Promise<TopicNode[]> {
  const typedDb = db as BetterSQLite3Database<Record<string, unknown>>;
  const allTags = await typedDb.select().from(tags).all();
  const topicTags = allTags.filter((tag) => tag.parentTagId === null);

  return topicTags.map((topic) => ({
    id: topic.id,
    slug: topic.slug,
    name: topic.name,
    subtopics: allTags
      .filter((tag) => tag.parentTagId === topic.id)
      .map((tag) => ({ id: tag.id, slug: tag.slug, name: tag.name })),
  }));
}

export interface QuestionOptionExport {
  id: number;
  textMdx: string;
  isCorrect: boolean;
}

export interface QuestionAcceptedAnswerExport {
  id: number;
  text: string;
}

export interface QuestionMatchingPairExport {
  id: number;
  leftMdx: string;
  rightMdx: string;
}

export interface QuestionExport {
  id: number;
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
  options: QuestionOptionExport[];
  acceptedAnswers: QuestionAcceptedAnswerExport[];
  matchingPairs: QuestionMatchingPairExport[];
  tagIds: number[];
}

export async function getQuestionsForExport(db: Db): Promise<QuestionExport[]> {
  const typedDb = db as BetterSQLite3Database<Record<string, unknown>>;
  const allQuestions = await typedDb.select().from(questions).all();
  const allOptions = await typedDb.select().from(questionOptions).orderBy(questionOptions.order).all();
  const allAcceptedAnswers = await typedDb.select().from(questionAcceptedAnswers).all();
  const allMatchingPairs = await typedDb
    .select()
    .from(questionMatchingPairs)
    .orderBy(questionMatchingPairs.order)
    .all();
  const allQuestionTags = await typedDb.select().from(questionTags).all();

  return allQuestions.map((question) => ({
    id: question.id,
    type: question.type,
    difficulty: question.difficulty,
    promptMdx: question.promptMdx,
    resolutionMdx: question.resolutionMdx,
    correctAnswer: question.correctAnswer,
    answerFormat: question.answerFormat,
    options: allOptions
      .filter((option) => option.questionId === question.id)
      .map((option) => ({ id: option.id, textMdx: option.textMdx, isCorrect: option.isCorrect })),
    acceptedAnswers: allAcceptedAnswers
      .filter((answer) => answer.questionId === question.id)
      .map((answer) => ({ id: answer.id, text: answer.text })),
    matchingPairs: allMatchingPairs
      .filter((pair) => pair.questionId === question.id)
      .map((pair) => ({ id: pair.id, leftMdx: pair.leftMdx, rightMdx: pair.rightMdx })),
    tagIds: allQuestionTags
      .filter((questionTag) => questionTag.questionId === question.id)
      .map((questionTag) => questionTag.tagId),
  }));
}
