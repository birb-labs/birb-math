'use client';

import { useTranslations } from 'next-intl';
import type { ExportedQuestion } from '@/lib/simulado-selection';
import { NumericAnswerInput } from './numeric-answer-input';
import styles from './simulado-taking.module.css';

export function SimuladoTaking({
  questions,
  answers,
  onAnswerChange,
  onFinish,
}: {
  questions: ExportedQuestion[];
  answers: Record<number, string>;
  onAnswerChange: (questionId: number, value: string) => void;
  onFinish: () => void;
}) {
  const t = useTranslations('simulado.taking');

  return (
    <div className={styles.list}>
      {questions.map((question) => (
        <div key={question.id} className={styles.question}>
          {/* eslint-disable-next-line react/no-danger -- pre-rendered at build time from our own MDX, not user input */}
          <div dangerouslySetInnerHTML={{ __html: question.promptHtml }} />

          {question.type === 'multiple_choice' ? (
            question.options.map((option) => (
              <div key={option.id} className={styles.optionRow}>
                <input
                  type="radio"
                  id={`q${question.id}-o${option.id}`}
                  name={`question-${question.id}`}
                  checked={answers[question.id] === String(option.id)}
                  onChange={() => onAnswerChange(question.id, String(option.id))}
                />
                <label
                  htmlFor={`q${question.id}-o${option.id}`}
                  // eslint-disable-next-line react/no-danger -- pre-rendered at build time from our own MDX
                  dangerouslySetInnerHTML={{ __html: option.textHtml }}
                />
              </div>
            ))
          ) : (
            <NumericAnswerInput
              value={answers[question.id] ?? ''}
              onChange={(value) => onAnswerChange(question.id, value)}
            />
          )}
        </div>
      ))}

      <button type="button" className={styles.finishButton} onClick={onFinish}>
        {t('finish')}
      </button>
    </div>
  );
}
