import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { lessons, sections, subjects, topics } from './schema';

type Db = BetterSQLite3Database<Record<string, unknown>>;

export interface ContentTree {
  slug: string;
  name: string;
  topics: {
    slug: string;
    name: string;
    sections: {
      slug: string;
      name: string;
      lessons: { slug: string; title: string }[];
    }[];
  }[];
}

export function getContentTree(db: Db): ContentTree[] {
  const allSubjects = db.select().from(subjects).orderBy(subjects.order).all();
  const allTopics = db.select().from(topics).orderBy(topics.order).all();
  const allSections = db.select().from(sections).orderBy(sections.order).all();
  const allLessons = db
    .select({ id: lessons.id, sectionId: lessons.sectionId, slug: lessons.slug, title: lessons.title, order: lessons.order })
    .from(lessons)
    .orderBy(lessons.order)
    .all();

  return allSubjects.map((subject) => ({
    slug: subject.slug,
    name: subject.name,
    topics: allTopics
      .filter((topic) => topic.subjectId === subject.id)
      .map((topic) => ({
        slug: topic.slug,
        name: topic.name,
        sections: allSections
          .filter((section) => section.topicId === topic.id)
          .map((section) => ({
            slug: section.slug,
            name: section.name,
            lessons: allLessons
              .filter((lesson) => lesson.sectionId === section.id)
              .map((lesson) => ({ slug: lesson.slug, title: lesson.title })),
          })),
      })),
  }));
}

export function getAllLessonSlugs(db: Db): string[] {
  return db
    .select({ slug: lessons.slug })
    .from(lessons)
    .all()
    .map((row) => row.slug);
}

export interface LessonWithAncestors {
  slug: string;
  title: string;
  bodyMdx: string;
  section: { slug: string; name: string };
  topic: { slug: string; name: string };
  subject: { slug: string; name: string };
}

export function getLessonBySlug(db: Db, slug: string): LessonWithAncestors | undefined {
  const row = db
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
