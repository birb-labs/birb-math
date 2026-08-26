import { getTranslations, setRequestLocale } from 'next-intl/server';
import { getDb, getTagTree } from '@birb-math/content-schema';
import { SimuladoSetup } from '@/components/simulado-setup';
import styles from '@/styles/page.module.css';

export default async function SimuladoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('simulado');
  const tagTree = getTagTree(getDb());

  return (
    <main className={styles.main}>
      <h1>{t('title')}</h1>
      {tagTree.length === 0 ? (
        <p className={styles.description}>{t('empty')}</p>
      ) : (
        <SimuladoSetup tagTree={tagTree} />
      )}
    </main>
  );
}
