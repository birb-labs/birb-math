import {
  type AnySQLiteColumn,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';

export const subjects = sqliteTable('subjects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  order: integer('order').notNull(),
});

export const topics = sqliteTable('topics', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  subjectId: integer('subject_id')
    .notNull()
    .references(() => subjects.id),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  order: integer('order').notNull(),
});

export const sections = sqliteTable('sections', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  topicId: integer('topic_id')
    .notNull()
    .references(() => topics.id),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  order: integer('order').notNull(),
});

export const lessons = sqliteTable('lessons', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sectionId: integer('section_id')
    .notNull()
    .references(() => sections.id),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  bodyMdx: text('body_mdx').notNull(),
  order: integer('order').notNull(),
});

export const questions = sqliteTable('questions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type', { enum: ['multiple_choice', 'multiple_response', 'numeric'] }).notNull(),
  difficulty: text('difficulty', { enum: ['easy', 'medium', 'hard'] }).notNull(),
  promptMdx: text('prompt_mdx').notNull(),
  resolutionMdx: text('resolution_mdx').notNull(),
  correctAnswer: text('correct_answer'),
});

export const questionOptions = sqliteTable('question_options', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  questionId: integer('question_id')
    .notNull()
    .references(() => questions.id),
  textMdx: text('text_mdx').notNull(),
  isCorrect: integer('is_correct', { mode: 'boolean' }).notNull(),
  order: integer('order').notNull(),
});

export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  parentTagId: integer('parent_tag_id').references((): AnySQLiteColumn => tags.id),
});

export const questionTags = sqliteTable(
  'question_tags',
  {
    questionId: integer('question_id')
      .notNull()
      .references(() => questions.id),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id),
  },
  (table) => [primaryKey({ columns: [table.questionId, table.tagId] })],
);
