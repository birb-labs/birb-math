import { and, eq, isNull, or } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import {
  type Locale,
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
} from './schema';

type Db = BetterSQLite3Database<Record<string, unknown>> | DrizzleD1Database<Record<string, unknown>>;

const FALLBACK_LOCALE: Locale = 'pt-BR';

/** Picks the row for `locale`, or the `pt-BR` row if none exists, reporting whether it fell back. */
function resolveTranslation<T extends { locale: string }>(
  rows: T[],
  entityId: number,
  entityIdKey: keyof T,
  locale: Locale,
): { row: T; isFallback: boolean } {
  const own = rows.find((row) => row[entityIdKey] === entityId && row.locale === locale);
  if (own) return { row: own, isFallback: false };
  const fallback = rows.find((row) => row[entityIdKey] === entityId && row.locale === FALLBACK_LOCALE);
  if (!fallback) {
    throw new Error(
      `No ${FALLBACK_LOCALE} translation found for entity id ${entityId} — every translatable entity must have a ${FALLBACK_LOCALE} row (see Task 1's backfill migration).`,
    );
  }
  return { row: fallback, isFallback: true };
}

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

export async function getContentTree(db: Db, locale: Locale): Promise<ContentTree[]> {
  const typedDb = db as BetterSQLite3Database<Record<string, unknown>>;
  const allSubjects = await typedDb.select().from(subjects).orderBy(subjects.order).all();
  const allSubjectTranslations = await typedDb.select().from(subjectTranslations).all();
  const allTopics = await typedDb.select().from(topics).orderBy(topics.order).all();
  const allTopicTranslations = await typedDb.select().from(topicTranslations).all();
  const allSections = await typedDb.select().from(sections).orderBy(sections.order).all();
  const allSectionTranslations = await typedDb.select().from(sectionTranslations).all();
  const allLessons = await typedDb
    .select({ id: lessons.id, sectionId: lessons.sectionId, slug: lessons.slug, order: lessons.order })
    .from(lessons)
    .orderBy(lessons.order)
    .all();
  const allLessonTranslations = await typedDb
    .select({ lessonId: lessonTranslations.lessonId, locale: lessonTranslations.locale, title: lessonTranslations.title })
    .from(lessonTranslations)
    .all();

  return allSubjects.map((subject) => {
    const { row: subjectName } = resolveTranslation(allSubjectTranslations, subject.id, 'subjectId', locale);
    return {
      id: subject.id,
      slug: subject.slug,
      name: subjectName.name,
      topics: allTopics
        .filter((topic) => topic.subjectId === subject.id)
        .map((topic) => {
          const { row: topicName } = resolveTranslation(allTopicTranslations, topic.id, 'topicId', locale);
          return {
            id: topic.id,
            slug: topic.slug,
            name: topicName.name,
            sections: allSections
              .filter((section) => section.topicId === topic.id)
              .map((section) => {
                const { row: sectionName } = resolveTranslation(allSectionTranslations, section.id, 'sectionId', locale);
                return {
                  id: section.id,
                  slug: section.slug,
                  name: sectionName.name,
                  lessons: allLessons
                    .filter((lesson) => lesson.sectionId === section.id)
                    .map((lesson) => {
                      const { row: lessonTitle } = resolveTranslation(allLessonTranslations, lesson.id, 'lessonId', locale);
                      return { slug: lesson.slug, title: lessonTitle.title };
                    }),
                };
              }),
          };
        }),
    };
  });
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
  isFallback: boolean;
  section: { slug: string; name: string };
  topic: { slug: string; name: string };
  subject: { slug: string; name: string };
}

export async function getLessonBySlug(db: Db, slug: string, locale: Locale): Promise<LessonWithAncestors | undefined> {
  const typedDb = db as BetterSQLite3Database<Record<string, unknown>>;
  const row = await typedDb
    .select({
      lessonId: lessons.id,
      slug: lessons.slug,
      sectionId: sections.id,
      sectionSlug: sections.slug,
      topicId: topics.id,
      topicSlug: topics.slug,
      subjectId: subjects.id,
      subjectSlug: subjects.slug,
    })
    .from(lessons)
    .innerJoin(sections, eq(lessons.sectionId, sections.id))
    .innerJoin(topics, eq(sections.topicId, topics.id))
    .innerJoin(subjects, eq(topics.subjectId, subjects.id))
    .where(eq(lessons.slug, slug))
    .get();

  if (!row) return undefined;

  const allLessonTranslations = await typedDb.select().from(lessonTranslations).all();
  const allSectionTranslations = await typedDb.select().from(sectionTranslations).all();
  const allTopicTranslations = await typedDb.select().from(topicTranslations).all();
  const allSubjectTranslations = await typedDb.select().from(subjectTranslations).all();

  const { row: lessonT, isFallback } = resolveTranslation(allLessonTranslations, row.lessonId, 'lessonId', locale);
  const { row: sectionT } = resolveTranslation(allSectionTranslations, row.sectionId, 'sectionId', locale);
  const { row: topicT } = resolveTranslation(allTopicTranslations, row.topicId, 'topicId', locale);
  const { row: subjectT } = resolveTranslation(allSubjectTranslations, row.subjectId, 'subjectId', locale);

  return {
    slug: row.slug,
    title: lessonT.title,
    bodyMdx: lessonT.bodyMdx,
    isFallback,
    section: { slug: row.sectionSlug, name: sectionT.name },
    topic: { slug: row.topicSlug, name: topicT.name },
    subject: { slug: row.subjectSlug, name: subjectT.name },
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

export async function getTagTree(db: Db, locale: Locale): Promise<TopicNode[]> {
  const typedDb = db as BetterSQLite3Database<Record<string, unknown>>;
  const allTags = await typedDb.select().from(tags).all();
  const allTagTranslations = await typedDb.select().from(tagTranslations).all();
  const topicTags = allTags.filter((tag) => tag.parentTagId === null);

  function nameFor(tagId: number): string {
    return resolveTranslation(allTagTranslations, tagId, 'tagId', locale).row.name;
  }

  return topicTags.map((topic) => ({
    id: topic.id,
    slug: topic.slug,
    name: nameFor(topic.id),
    subtopics: allTags
      .filter((tag) => tag.parentTagId === topic.id)
      .map((tag) => ({ id: tag.id, slug: tag.slug, name: nameFor(tag.id) })),
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
  isFallback: boolean;
  correctAnswer: string | null;
  answerFormat: 'text' | 'math';
  options: QuestionOptionExport[];
  acceptedAnswers: QuestionAcceptedAnswerExport[];
  matchingPairs: QuestionMatchingPairExport[];
  tagIds: number[];
}

export async function getQuestionsForExport(db: Db, locale: Locale): Promise<QuestionExport[]> {
  const typedDb = db as BetterSQLite3Database<Record<string, unknown>>;
  const allQuestions = await typedDb.select().from(questions).all();
  const allQuestionTranslations = await typedDb.select().from(questionTranslations).all();
  const allOptions = await typedDb.select().from(questionOptions).orderBy(questionOptions.order).all();
  const allOptionTranslations = await typedDb.select().from(questionOptionTranslations).all();
  const allAcceptedAnswers = await typedDb
    .select()
    .from(questionAcceptedAnswers)
    .where(or(isNull(questionAcceptedAnswers.locale), eq(questionAcceptedAnswers.locale, locale)))
    .all();
  const allMatchingPairs = await typedDb
    .select()
    .from(questionMatchingPairs)
    .orderBy(questionMatchingPairs.order)
    .all();
  const allMatchingPairTranslations = await typedDb.select().from(questionMatchingPairTranslations).all();
  const allQuestionTags = await typedDb.select().from(questionTags).all();

  return allQuestions.map((question) => {
    const { row: promptRow, isFallback: promptFallback } = resolveTranslation(
      allQuestionTranslations,
      question.id,
      'questionId',
      locale,
    );

    const options = allOptions
      .filter((option) => option.questionId === question.id)
      .map((option) => {
        const { row: optionText, isFallback } = resolveTranslation(allOptionTranslations, option.id, 'optionId', locale);
        return { id: option.id, textMdx: optionText.textMdx, isCorrect: option.isCorrect, isFallback };
      });

    const matchingPairs = allMatchingPairs
      .filter((pair) => pair.questionId === question.id)
      .map((pair) => {
        const { row: pairText, isFallback } = resolveTranslation(allMatchingPairTranslations, pair.id, 'pairId', locale);
        return { id: pair.id, leftMdx: pairText.leftMdx, rightMdx: pairText.rightMdx, isFallback };
      });

    const isFallback =
      promptFallback || options.some((o) => o.isFallback) || matchingPairs.some((p) => p.isFallback);

    return {
      id: question.id,
      type: question.type,
      difficulty: question.difficulty,
      promptMdx: promptRow.promptMdx,
      resolutionMdx: promptRow.resolutionMdx,
      isFallback,
      correctAnswer: question.correctAnswer,
      answerFormat: question.answerFormat,
      options: options.map(({ id, textMdx, isCorrect }) => ({ id, textMdx, isCorrect })),
      acceptedAnswers: allAcceptedAnswers
        .filter((answer) => answer.questionId === question.id)
        .map((answer) => ({ id: answer.id, text: answer.text })),
      matchingPairs: matchingPairs.map(({ id, leftMdx, rightMdx }) => ({ id, leftMdx, rightMdx })),
      tagIds: allQuestionTags
        .filter((questionTag) => questionTag.questionId === question.id)
        .map((questionTag) => questionTag.tagId),
    };
  });
}
