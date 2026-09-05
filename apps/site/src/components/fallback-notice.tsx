import { useTranslations } from 'next-intl';
import styles from './fallback-notice.module.css';

export function FallbackNotice() {
  const t = useTranslations('content');
  return <p className={styles.notice}>{t('notTranslatedYet')}</p>;
}
