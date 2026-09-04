'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { TopicNode } from '@birb-math/content-schema';
import styles from './simulado-setup.module.css';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface SimuladoConfig {
  questionCount: number;
  tagIds: number[];
  difficulties: Difficulty[];
}

const ALL_DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

export function SimuladoSetup({
  tagTree,
  onStart = () => {},
}: {
  tagTree: TopicNode[];
  onStart?: (config: SimuladoConfig) => void | Promise<void>;
}) {
  const t = useTranslations('simulado.setup');
  const [questionCount, setQuestionCount] = useState(10);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<number>>(new Set());
  const [selectedDifficulties, setSelectedDifficulties] = useState<Set<Difficulty>>(
    new Set(ALL_DIFFICULTIES),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleTopic(topic: TopicNode) {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      const ids = [topic.id, ...topic.subtopics.map((subtopic) => subtopic.id)];
      if (next.has(topic.id)) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function toggleSubtopic(topic: TopicNode, subtopicId: number) {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(subtopicId)) {
        next.delete(subtopicId);
        next.delete(topic.id);
      } else {
        next.add(subtopicId);
        const allSubtopicsSelected = topic.subtopics.every(
          (subtopic) => subtopic.id === subtopicId || next.has(subtopic.id),
        );
        if (allSubtopicsSelected) next.add(topic.id);
      }
      return next;
    });
  }

  function toggleDifficulty(difficulty: Difficulty) {
    setSelectedDifficulties((prev) => {
      const next = new Set(prev);
      if (next.has(difficulty)) next.delete(difficulty);
      else next.add(difficulty);
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onStart({
        questionCount,
        tagIds: [...selectedTagIds],
        difficulties: [...selectedDifficulties],
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="question-count">{t('questionCount')}</label>
        <input
          id="question-count"
          className={styles.countInput}
          type="number"
          min={1}
          value={questionCount}
          onChange={(event) => setQuestionCount(Number(event.target.value))}
        />
      </div>

      <div className={styles.field}>
        <span>{t('topics')}</span>
        {tagTree.map((topic) => (
          <div key={topic.id}>
            <div className={styles.checkboxRow}>
              <input
                id={`tag-${topic.id}`}
                type="checkbox"
                checked={selectedTagIds.has(topic.id)}
                onChange={() => toggleTopic(topic)}
              />
              <label htmlFor={`tag-${topic.id}`}>{topic.name}</label>
            </div>
            {topic.subtopics.length > 0 && (
              <div className={styles.subtopics}>
                {topic.subtopics.map((subtopic) => (
                  <div key={subtopic.id} className={styles.checkboxRow}>
                    <input
                      id={`tag-${subtopic.id}`}
                      type="checkbox"
                      checked={selectedTagIds.has(subtopic.id)}
                      onChange={() => toggleSubtopic(topic, subtopic.id)}
                    />
                    <label htmlFor={`tag-${subtopic.id}`}>{subtopic.name}</label>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={styles.field}>
        <span>{t('difficulty')}</span>
        <div className={styles.difficultyRow}>
          {ALL_DIFFICULTIES.map((difficulty) => (
            <div key={difficulty} className={styles.checkboxRow}>
              <input
                id={`difficulty-${difficulty}`}
                type="checkbox"
                checked={selectedDifficulties.has(difficulty)}
                onChange={() => toggleDifficulty(difficulty)}
              />
              <label htmlFor={`difficulty-${difficulty}`}>
                {t(`difficulty${difficulty.charAt(0).toUpperCase()}${difficulty.slice(1)}`)}
              </label>
            </div>
          ))}
        </div>
      </div>

      <button type="submit" className={styles.startButton} disabled={isSubmitting}>
        {isSubmitting ? t('loading') : t('start')}
      </button>
    </form>
  );
}
