import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

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
