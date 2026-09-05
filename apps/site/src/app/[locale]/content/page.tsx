import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getContentTree, type Locale } from '@birb-math/content-schema';
import { getDb } from '@birb-math/content-schema/src/client';
import { ContentTree } from '@/components/content-tree';
import styles from '@/styles/page.module.css';

export default async function ContentIndexPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('content');
  const tree = await getContentTree(getDb(), locale);

  return (
    <main className={styles.main}>
      <h1>{t('title')}</h1>
      {tree.length === 0 ? (
        <p className={styles.description}>{t('empty')}</p>
      ) : (
        <ContentTree tree={tree} />
      )}
    </main>
  );
}
