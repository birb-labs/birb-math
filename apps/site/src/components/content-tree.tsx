'use client';

import { useTranslations } from 'next-intl';
import type { ContentTree as ContentTreeData } from '@birb-math/content-schema';
import { Link } from '@/i18n/navigation';
import { useReadingProgress } from '@/hooks/use-reading-progress';
import styles from './content-tree.module.css';

type Section = ContentTreeData['topics'][number]['sections'][number];
type Topic = ContentTreeData['topics'][number];
type Subject = ContentTreeData;

function countLessons(section: Section): number {
  return section.lessons.length;
}

function countLessonsInTopic(topic: Topic): number {
  return topic.sections.reduce((sum, section) => sum + countLessons(section), 0);
}

function countLessonsInSubject(subject: Subject): number {
  return subject.topics.reduce((sum, topic) => sum + countLessonsInTopic(topic), 0);
}

function countCompletedInSection(section: Section, isComplete: (slug: string) => boolean): number {
  return section.lessons.filter((lesson) => isComplete(lesson.slug)).length;
}

function countCompletedInTopic(topic: Topic, isComplete: (slug: string) => boolean): number {
  return topic.sections.reduce((sum, section) => sum + countCompletedInSection(section, isComplete), 0);
}

function countCompletedInSubject(subject: Subject, isComplete: (slug: string) => boolean): number {
  return subject.topics.reduce((sum, topic) => sum + countCompletedInTopic(topic, isComplete), 0);
}

export function ContentTree({ tree }: { tree: ContentTreeData[] }) {
  const t = useTranslations('content');
  const { isComplete } = useReadingProgress();

  return (
    <div>
      {tree.map((subject) => {
        const subjectTotal = countLessonsInSubject(subject);
        const subjectCompleted = countCompletedInSubject(subject, isComplete);

        return (
          <details key={subject.slug} className={styles.subject} open>
            <summary>
              {subject.name}
              <span className={styles.progress}>
                {t('lessonsCompleted', { completed: subjectCompleted, total: subjectTotal })}
              </span>
            </summary>
            {subject.topics.map((topic) => {
              const topicTotal = countLessonsInTopic(topic);
              const topicCompleted = countCompletedInTopic(topic, isComplete);

              return (
                <details key={topic.slug} className={styles.topic} open>
                  <summary>
                    {topic.name}
                    <span className={styles.progress}>
                      {t('lessonsCompleted', { completed: topicCompleted, total: topicTotal })}
                    </span>
                  </summary>
                  {topic.sections.map((section) => {
                    const total = countLessons(section);
                    const completed = countCompletedInSection(section, isComplete);

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
              );
            })}
          </details>
        );
      })}
    </div>
  );
}
