'use client';

import { useTranslations } from 'next-intl';
import styles from './true-false-input.module.css';

export function TrueFalseInput({
  questionId,
  value,
  onChange,
}: {
  questionId: number;
  value: string | undefined;
  onChange: (value: string) => void;
}) {
  const t = useTranslations('simulado.taking');

  return (
    <div className={styles.row}>
      <label className={styles.option}>
        <input
          type="radio"
          name={`true-false-${questionId}`}
          checked={value === 'true'}
          onChange={() => onChange('true')}
        />
        {t('true')}
      </label>
      <label className={styles.option}>
        <input
          type="radio"
          name={`true-false-${questionId}`}
          checked={value === 'false'}
          onChange={() => onChange('false')}
        />
        {t('false')}
      </label>
    </div>
  );
}
