'use client';

import { useLocale } from 'next-intl';
import { routing } from '@/i18n/routing';
import { usePathname, useRouter } from '@/i18n/navigation';
import styles from './locale-switcher.module.css';

export interface LocaleSwitcherLabels {
  switcherLabel: string;
  localeNames: Record<string, string>;
}

export function LocaleSwitcher({ labels }: { labels: LocaleSwitcherLabels }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <select
      aria-label={labels.switcherLabel}
      value={locale}
      onChange={(event) => router.replace(pathname, { locale: event.target.value })}
      className={styles.select}
    >
      {routing.locales.map((code) => (
        <option key={code} value={code}>
          {labels.localeNames[code]}
        </option>
      ))}
    </select>
  );
}
