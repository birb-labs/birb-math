import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getAllLessonSlugs, getLessonBySlug } from '@birb-math/content-schema';
import { getDb } from '@birb-math/content-schema/src/client';
import { compileLessonMdx } from '@/lib/compile-lesson-mdx';
import { LessonBreadcrumb } from '@/components/lesson-breadcrumb';
import { ReadingProgressTracker } from '@/components/reading-progress-tracker';
import styles from '@/styles/lesson.module.css';

// `output: 'export'` requires this to return at least one entry, or the
// build fails outright. In production builds (see
// apps/site/scripts/hydrate-from-admin.ts), the content database is
// hydrated from the admin panel's live D1 data, which must therefore
// always contain at least one lesson -- see apps/admin/README.md's
// "Publishing and the content database" section before ever deleting
// the last remaining lesson via the admin API.
export async function generateStaticParams() {
  return (await getAllLessonSlugs(getDb())).map((slug) => ({ slug }));
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const lesson = await getLessonBySlug(getDb(), slug);
  if (!lesson) notFound();

  let body;
  try {
    body = await compileLessonMdx(lesson.bodyMdx);
  } catch (cause) {
    throw new Error(`Failed to compile lesson "${lesson.slug}"`, { cause });
  }

  return (
    <main className={styles.article}>
      <LessonBreadcrumb subject={lesson.subject} topic={lesson.topic} section={lesson.section} />
      {body}
      <ReadingProgressTracker lessonSlug={lesson.slug} />
    </main>
  );
}
