'use client';

import { useTranslations } from 'next-intl';
import type { SimuladoAttempt } from '@/hooks/use-simulado-history';
import styles from './simulado-history.module.css';

export function SimuladoHistory({
  history,
  onViewAttempt,
}: {
  history: SimuladoAttempt[];
  onViewAttempt: (attempt: SimuladoAttempt) => void;
}) {
  const t = useTranslations('simulado.history');

  if (history.length === 0) {
    return (
      <div>
        <h2>{t('title')}</h2>
        <p>{t('empty')}</p>
      </div>
    );
  }

  return (
    <div>
      <h2>{t('title')}</h2>
      <div className={styles.list}>
        {history.map((attempt, index) => (
          <div key={attempt.completedAt} className={styles.entry}>
            <span>{new Date(attempt.completedAt).toLocaleString()}</span>
            <span>
              {attempt.result.correctCount}/{attempt.result.total}
            </span>
            <button type="button" className={styles.viewButton} onClick={() => onViewAttempt(attempt)}>
              {t('viewAttempt')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
