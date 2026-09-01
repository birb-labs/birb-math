import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import styles from './ContentTreePage.module.css';

interface AdminLesson {
  id: number;
  slug: string;
  title: string;
}

interface AdminSection {
  slug: string;
  name: string;
  lessons: AdminLesson[];
}

interface AdminTopic {
  slug: string;
  name: string;
  sections: AdminSection[];
}

interface AdminSubject {
  slug: string;
  name: string;
  topics: AdminTopic[];
}

export function ContentTreePage({ onEditLesson }: { onEditLesson: (lessonId: number) => void }) {
  const [tree, setTree] = useState<AdminSubject[]>([]);

  useEffect(() => {
    apiFetch('/api/lessons/tree')
      .then((response) => response.json())
      .then(setTree);
  }, []);

  return (
    <div className={styles.tree}>
      {tree.map((subject) => (
        <div key={subject.slug}>
          <strong>{subject.name}</strong>
          {subject.topics.map((topic) => (
            <div key={topic.slug} className={styles.subject}>
              {topic.name}
              {topic.sections.map((section) => (
                <div key={section.slug} className={styles.topic}>
                  {section.name}
                  {section.lessons.map((lesson) => (
                    <div key={lesson.id} className={styles.section}>
                      <button type="button" className={styles.lessonLink} onClick={() => onEditLesson(lesson.id)}>
                        {lesson.title}
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
