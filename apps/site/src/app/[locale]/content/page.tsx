import { getTranslations, setRequestLocale } from 'next-intl/server';
import styles from '@/styles/page.module.css';

export default async function ContentIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('content');

  return (
    <main className={styles.main}>
      <h1>{t('title')}</h1>
      <p className={styles.description}>{t('empty')}</p>
    </main>
  );
}
