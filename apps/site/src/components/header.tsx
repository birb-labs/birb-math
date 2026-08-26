import { useTranslations } from 'next-intl';
import { ThemeSwitcher } from '@birb-math/theme';
import { Link } from '@/i18n/navigation';
import { LocaleSwitcher } from './locale-switcher';
import styles from './header.module.css';

export function Header() {
  const t = useTranslations('nav');
  const tTheme = useTranslations('theme');
  const tLanguage = useTranslations('language');

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        Birb Math
      </Link>
      <nav className={styles.nav}>
        <Link href="/">{t('home')}</Link>
        <Link href="/content">{t('content')}</Link>
        <Link href="/simulado">{t('simulado')}</Link>
      </nav>
      <ThemeSwitcher
        labels={{
          themeLabel: tTheme('themeLabel'),
          appearanceLabel: tTheme('appearanceLabel'),
          themeNames: {
            default: tTheme('themes.default'),
            solarized: tTheme('themes.solarized'),
            monokai: tTheme('themes.monokai'),
            mocha: tTheme('themes.mocha'),
          },
          modeNames: {
            light: tTheme('modes.light'),
            dark: tTheme('modes.dark'),
            system: tTheme('modes.system'),
          },
        }}
      />
      <LocaleSwitcher
        labels={{
          switcherLabel: tLanguage('switcherLabel'),
          localeNames: {
            'pt-BR': tLanguage('locales.pt-BR'),
            'en-US': tLanguage('locales.en-US'),
            es: tLanguage('locales.es'),
          },
        }}
      />
    </header>
  );
}
