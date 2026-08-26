import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import styles from '@/styles/page.module.css';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');

  return (
    <main className={styles.mainCentered}>
      <h1>{t('title')}</h1>
      <p className={styles.description}>{t('description')}</p>
      <div className={styles.actions}>
        <Link href="/content" className={styles.primaryAction}>
          {t('ctaContent')}
        </Link>
        <Link href="/simulado" className={styles.secondaryAction}>
          {t('ctaSimulado')}
        </Link>
      </div>
    </main>
  );
}
