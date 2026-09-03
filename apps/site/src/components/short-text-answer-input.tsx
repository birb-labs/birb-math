'use client';

import { useTranslations } from 'next-intl';
import { MathField } from '@birb-math/math-input';
import styles from './short-text-answer-input.module.css';

export function ShortTextAnswerInput({
  value,
  onChange,
  answerFormat = 'text',
}: {
  value: string;
  onChange: (value: string) => void;
  answerFormat?: 'text' | 'math';
}) {
  const t = useTranslations('simulado.results');

  if (answerFormat === 'math') {
    return <MathField value={value} onChange={onChange} ariaLabel={t('yourAnswer')} />;
  }

  return (
    <input
      type="text"
      className={styles.input}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={t('yourAnswer')}
    />
  );
}
