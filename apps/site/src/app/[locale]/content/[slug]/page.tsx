import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getAllLessonSlugs, getDb, getLessonBySlug } from '@birb-math/content-schema';
import { compileLessonMdx } from '@/lib/compile-lesson-mdx';
import { LessonBreadcrumb } from '@/components/lesson-breadcrumb';
import { ReadingProgressTracker } from '@/components/reading-progress-tracker';
import styles from '@/styles/lesson.module.css';

export function generateStaticParams() {
  return getAllLessonSlugs(getDb()).map((slug) => ({ slug }));
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const lesson = getLessonBySlug(getDb(), slug);
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
