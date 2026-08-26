'use client';

import { useTranslations } from 'next-intl';
import type { ContentTree as ContentTreeData } from '@birb-math/content-schema';
import { Link } from '@/i18n/navigation';
import { useReadingProgress } from '@/hooks/use-reading-progress';
import styles from './content-tree.module.css';

function countLessons(section: ContentTreeData['topics'][number]['sections'][number]): number {
  return section.lessons.length;
}

export function ContentTree({ tree }: { tree: ContentTreeData[] }) {
  const t = useTranslations('content');
  const { isComplete } = useReadingProgress();

  return (
    <div>
      {tree.map((subject) => (
        <details key={subject.slug} className={styles.subject} open>
          <summary>{subject.name}</summary>
          {subject.topics.map((topic) => (
            <details key={topic.slug} className={styles.topic} open>
              <summary>{topic.name}</summary>
              {topic.sections.map((section) => {
                const total = countLessons(section);
                const completed = section.lessons.filter((lesson) => isComplete(lesson.slug)).length;

                return (
                  <details key={section.slug} className={styles.section} open>
                    <summary>
                      {section.name}
                      <span className={styles.progress}>
                        {t('lessonsCompleted', { completed, total })}
                      </span>
                    </summary>
                    <ul className={styles.lessonList}>
                      {section.lessons.map((lesson) => (
                        <li key={lesson.slug}>
                          <Link href={`/content/${lesson.slug}`}>{lesson.title}</Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                );
              })}
            </details>
          ))}
        </details>
      ))}
    </div>
  );
}
