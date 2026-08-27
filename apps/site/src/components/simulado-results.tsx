'use client';

import { useTranslations } from 'next-intl';
import type { GradedQuestionResult, GradedResult } from '@/lib/grade-simulado';
import { formatNumericAnswerForDisplay } from '@/lib/numeric-answer';
import { parseSelectedOptionIds } from '@/lib/multi-response-answer';
import styles from './simulado-results.module.css';

function describeAnswers(
  { question, userAnswer }: GradedQuestionResult,
  locale: string,
): { yourAnswerHtml: string; correctAnswerHtml: string } {
  if (question.type === 'multiple_choice') {
    const selected = question.options.find((option) => String(option.id) === userAnswer);
    const correct = question.options.find((option) => option.isCorrect);
    return {
      yourAnswerHtml: selected?.textHtml ?? '',
      correctAnswerHtml: correct?.textHtml ?? '',
    };
  }

  if (question.type === 'multiple_response') {
    const selectedIds = parseSelectedOptionIds(userAnswer);
    const selectedOptions = question.options.filter((option) => selectedIds.includes(option.id));
    const correctOptions = question.options.filter((option) => option.isCorrect);
    return {
      yourAnswerHtml: selectedOptions.map((option) => option.textHtml).join(', '),
      correctAnswerHtml: correctOptions.map((option) => option.textHtml).join(', '),
    };
  }

  const rawUserAnswer = userAnswer ?? '';
  const correctAnswer = question.correctAnswer ?? '';
  return {
    yourAnswerHtml: rawUserAnswer,
    correctAnswerHtml: formatNumericAnswerForDisplay(correctAnswer, locale),
  };
}

export function SimuladoResults({
  result,
  locale,
  onBackToSetup,
}: {
  result: GradedResult;
  locale: string;
  onBackToSetup: () => void;
}) {
  const t = useTranslations('simulado.results');

  return (
    <div>
      <p className={styles.score}>{t('score', { correct: result.correctCount, total: result.total })}</p>

      <div className={styles.list}>
        {result.perQuestion.map((entry) => {
          const { question, isCorrect } = entry;
          const { yourAnswerHtml, correctAnswerHtml } = describeAnswers(entry, locale);

          return (
            <div key={question.id} className={styles.question}>
              <p className={isCorrect ? `${styles.status} ${styles.statusCorrect}` : `${styles.status} ${styles.statusIncorrect}`}>
                {isCorrect ? t('correct') : t('incorrect')}
              </p>
              {/* eslint-disable-next-line react/no-danger -- pre-rendered at build time from our own MDX */}
              <div dangerouslySetInnerHTML={{ __html: question.promptHtml }} />

              <p className={styles.answers}>
                <strong>{t('yourAnswer')}:</strong>{' '}
                {question.type !== 'numeric' ? (
                  // eslint-disable-next-line react/no-danger -- pre-rendered at build time from our own MDX
                  <span dangerouslySetInnerHTML={{ __html: yourAnswerHtml }} />
                ) : (
                  yourAnswerHtml
                )}
              </p>
              {!isCorrect && (
                <p className={styles.answers}>
                  <strong>{t('correctAnswer')}:</strong>{' '}
                  {question.type !== 'numeric' ? (
                    // eslint-disable-next-line react/no-danger -- pre-rendered at build time from our own MDX
                    <span dangerouslySetInnerHTML={{ __html: correctAnswerHtml }} />
                  ) : (
                    correctAnswerHtml
                  )}
                </p>
              )}

              <div
                className={styles.resolution}
                // eslint-disable-next-line react/no-danger -- pre-rendered at build time from our own MDX
                dangerouslySetInnerHTML={{ __html: question.resolutionHtml }}
              />
            </div>
          );
        })}
      </div>

      <button type="button" className={styles.backButton} onClick={onBackToSetup}>
        {t('backToSetup')}
      </button>
    </div>
  );
}
