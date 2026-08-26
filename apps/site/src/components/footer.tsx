import { useTranslations } from 'next-intl';
import styles from './footer.module.css';

const CONTACT_EMAIL = 'contato@birblabs.com';
const GITHUB_URL = 'https://github.com/birb-labs/birb-math';
const KOFI_URL = 'https://ko-fi.com/p4tit0z';

export function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className={styles.footer}>
      <p>
        © {new Date().getFullYear()} {t('rights')}
      </p>
      <p className={styles.links}>
        <a href={`mailto:${CONTACT_EMAIL}`}>{t('contact')}</a>
        <a href={GITHUB_URL}>{t('sourceCode')}</a>
        <a href={KOFI_URL}>{t('donate')}</a>
      </p>
    </footer>
  );
}
