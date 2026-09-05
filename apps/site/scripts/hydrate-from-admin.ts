import {
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
import { getDb } from '@birb-math/content-schema/src/client';

interface AdminExport {
  subjects: (typeof subjects.$inferSelect)[];
  subjectTranslations: (typeof subjectTranslations.$inferSelect)[];
  topics: (typeof topics.$inferSelect)[];
  topicTranslations: (typeof topicTranslations.$inferSelect)[];
  sections: (typeof sections.$inferSelect)[];
  sectionTranslations: (typeof sectionTranslations.$inferSelect)[];
  lessons: (typeof lessons.$inferSelect)[];
  lessonTranslations: (typeof lessonTranslations.$inferSelect)[];
  tags: (typeof tags.$inferSelect)[];
  tagTranslations: (typeof tagTranslations.$inferSelect)[];
  questions: (typeof questions.$inferSelect)[];
  questionTranslations: (typeof questionTranslations.$inferSelect)[];
  questionOptions: (typeof questionOptions.$inferSelect)[];
  questionOptionTranslations: (typeof questionOptionTranslations.$inferSelect)[];
  questionTags: (typeof questionTags.$inferSelect)[];
  questionAcceptedAnswers: (typeof questionAcceptedAnswers.$inferSelect)[];
  questionMatchingPairs: (typeof questionMatchingPairs.$inferSelect)[];
  questionMatchingPairTranslations: (typeof questionMatchingPairTranslations.$inferSelect)[];
}

async function main() {
  const exportUrl = process.env.ADMIN_EXPORT_URL;
  const exportSecret = process.env.ADMIN_EXPORT_SECRET;
  if (!exportUrl || !exportSecret) {
    throw new Error('ADMIN_EXPORT_URL and ADMIN_EXPORT_SECRET must be set to hydrate from the admin database.');
  }

  const response = await fetch(exportUrl, { headers: { Authorization: `Bearer ${exportSecret}` } });
  if (!response.ok) {
    throw new Error(`Failed to fetch admin export: ${response.status} ${await response.text()}`);
  }
  const data = (await response.json()) as AdminExport;

  // Tags self-reference via parentTagId — parents must be inserted (and
  // committed) before the children that point at them, even within one
  // exported table, or the foreign key check fails mid-statement. This is
  // a real two-way comparator (unlike a one-argument partition), so it
  // stays correct if tag nesting ever goes past today's 2 levels.
  const sortedTags = [...data.tags].sort(
    (a, b) => Number(a.parentTagId !== null) - Number(b.parentTagId !== null),
  );

  const db = getDb();
  if (data.subjects.length > 0) db.insert(subjects).values(data.subjects).run();
  if (data.subjectTranslations.length > 0) db.insert(subjectTranslations).values(data.subjectTranslations).run();
  if (data.topics.length > 0) db.insert(topics).values(data.topics).run();
  if (data.topicTranslations.length > 0) db.insert(topicTranslations).values(data.topicTranslations).run();
  if (data.sections.length > 0) db.insert(sections).values(data.sections).run();
  if (data.sectionTranslations.length > 0) db.insert(sectionTranslations).values(data.sectionTranslations).run();
  if (data.lessons.length > 0) db.insert(lessons).values(data.lessons).run();
  if (data.lessonTranslations.length > 0) db.insert(lessonTranslations).values(data.lessonTranslations).run();
  if (sortedTags.length > 0) db.insert(tags).values(sortedTags).run();
  if (data.tagTranslations.length > 0) db.insert(tagTranslations).values(data.tagTranslations).run();
  if (data.questions.length > 0) db.insert(questions).values(data.questions).run();
  if (data.questionTranslations.length > 0) db.insert(questionTranslations).values(data.questionTranslations).run();
  if (data.questionOptions.length > 0) db.insert(questionOptions).values(data.questionOptions).run();
  if (data.questionOptionTranslations.length > 0) {
    db.insert(questionOptionTranslations).values(data.questionOptionTranslations).run();
  }
  if (data.questionTags.length > 0) db.insert(questionTags).values(data.questionTags).run();
  if (data.questionAcceptedAnswers.length > 0) {
    db.insert(questionAcceptedAnswers).values(data.questionAcceptedAnswers).run();
  }
  if (data.questionMatchingPairs.length > 0) {
    db.insert(questionMatchingPairs).values(data.questionMatchingPairs).run();
  }
  if (data.questionMatchingPairTranslations.length > 0) {
    db.insert(questionMatchingPairTranslations).values(data.questionMatchingPairTranslations).run();
  }

  console.log(
    `Hydrated from admin: ${data.subjects.length} subjects, ${data.lessons.length} lessons, ${data.questions.length} questions.`,
  );
}

main();
