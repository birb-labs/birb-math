'use client';

import { useTranslations } from 'next-intl';
import styles from './short-text-answer-input.module.css';

export function ShortTextAnswerInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const t = useTranslations('simulado.results');

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
