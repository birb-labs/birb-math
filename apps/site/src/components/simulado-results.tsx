'use client';

import { useTranslations } from 'next-intl';
import type { GradedQuestionResult, GradedResult } from '@/lib/grade-simulado';
import { formatNumericAnswerForDisplay } from '@/lib/numeric-answer';
import { parseSelectedOptionIds } from '@/lib/multi-response-answer';
import { parseOrderingAnswer } from '@/lib/ordering-answer';
import { parseMatchingAnswer } from '@/lib/matching-answer';
import styles from './simulado-results.module.css';

// Question types whose "your answer"/"correct answer" value is pre-compiled,
// trusted HTML (produced from our own MDX at build time), and can therefore
// be safely rendered via `dangerouslySetInnerHTML`. `numeric` and
// `short_text` are deliberately excluded: both display the student's own
// raw typed text, which must never be treated as trusted HTML.
const HTML_ANSWER_TYPES = new Set(['multiple_choice', 'multiple_response', 'ordering', 'matching']);

function isHtmlAnswerType(type: GradedQuestionResult['question']['type']): boolean {
  return HTML_ANSWER_TYPES.has(type);
}

function describeAnswers(
  { question, userAnswer }: GradedQuestionResult,
  locale: string,
  tTaking: ReturnType<typeof useTranslations>,
): { yourAnswer: string; correctAnswer: string } {
  if (question.type === 'multiple_choice') {
    const selected = question.options.find((option) => String(option.id) === userAnswer);
    const correct = question.options.find((option) => option.isCorrect);
    return {
      yourAnswer: selected?.textHtml ?? '',
      correctAnswer: correct?.textHtml ?? '',
    };
  }

  if (question.type === 'multiple_response') {
    const selectedIds = parseSelectedOptionIds(userAnswer);
    const selectedOptions = question.options.filter((option) => selectedIds.includes(option.id));
    const correctOptions = question.options.filter((option) => option.isCorrect);
    return {
      yourAnswer: selectedOptions.map((option) => option.textHtml).join(', '),
      correctAnswer: correctOptions.map((option) => option.textHtml).join(', '),
    };
  }

  if (question.type === 'true_false') {
    const toLabel = (value: string | null | undefined) => {
      if (value === 'true') return tTaking('true');
      if (value === 'false') return tTaking('false');
      return '';
    };
    return {
      yourAnswer: toLabel(userAnswer),
      correctAnswer: toLabel(question.correctAnswer),
    };
  }

  if (question.type === 'short_text') {
    return {
      yourAnswer: userAnswer ?? '',
      correctAnswer: question.acceptedAnswers.map((answer) => answer.text).join(' / '),
    };
  }

  if (question.type === 'ordering') {
    const labelForId = (id: number) => question.options.find((option) => option.id === id)?.textHtml ?? '';
    return {
      yourAnswer: parseOrderingAnswer(userAnswer).map(labelForId).join(', '),
      correctAnswer: question.options.map((option) => option.textHtml).join(', '),
    };
  }

  if (question.type === 'matching') {
    const pairById = new Map(question.matchingPairs.map((pair) => [pair.id, pair]));
    const pairing = parseMatchingAnswer(userAnswer);
    const yourPairs = Object.entries(pairing).map(([leftId, rightId]) => {
      const left = pairById.get(Number(leftId));
      const right = pairById.get(rightId);
      return `${left?.leftHtml ?? ''} &rarr; ${right?.rightHtml ?? ''}`;
    });
    const correctPairs = question.matchingPairs.map((pair) => `${pair.leftHtml} &rarr; ${pair.rightHtml}`);
    return {
      yourAnswer: yourPairs.join(', '),
      correctAnswer: correctPairs.join(', '),
    };
  }

  // numeric: the user's raw typed text is shown as-is, and the canonical
  // correctAnswer is reformatted for the active locale for display.
  const rawUserAnswer = userAnswer ?? '';
  const correctAnswer = question.correctAnswer ?? '';
  return {
    yourAnswer: rawUserAnswer,
    correctAnswer: formatNumericAnswerForDisplay(correctAnswer, locale),
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
  const tTaking = useTranslations('simulado.taking');

  return (
    <div>
      <p className={styles.score}>{t('score', { correct: result.correctCount, total: result.total })}</p>

      <div className={styles.list}>
        {result.perQuestion.map((entry) => {
          const { question, isCorrect } = entry;
          const { yourAnswer, correctAnswer } = describeAnswers(entry, locale, tTaking);
          const renderAsHtml = isHtmlAnswerType(question.type);

          return (
            <div key={question.id} className={styles.question}>
              <p className={isCorrect ? `${styles.status} ${styles.statusCorrect}` : `${styles.status} ${styles.statusIncorrect}`}>
                {isCorrect ? t('correct') : t('incorrect')}
              </p>
              {/* eslint-disable-next-line react/no-danger -- pre-rendered at build time from our own MDX */}
              <div dangerouslySetInnerHTML={{ __html: question.promptHtml }} />

              <p className={styles.answers}>
                <strong>{t('yourAnswer')}:</strong>{' '}
                {renderAsHtml ? (
                  // eslint-disable-next-line react/no-danger -- pre-rendered at build time from our own MDX
                  <span dangerouslySetInnerHTML={{ __html: yourAnswer }} />
                ) : (
                  yourAnswer
                )}
              </p>
              {!isCorrect && (
                <p className={styles.answers}>
                  <strong>{t('correctAnswer')}:</strong>{' '}
                  {renderAsHtml ? (
                    // eslint-disable-next-line react/no-danger -- pre-rendered at build time from our own MDX
                    <span dangerouslySetInnerHTML={{ __html: correctAnswer }} />
                  ) : (
                    correctAnswer
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
