'use client';

import styles from './theme-switcher.module.css';
import { THEME_MODES, THEME_NAMES, type ThemeMode, type ThemeName } from './theme-types';
import { useTheme } from './theme-provider';

export interface ThemeSwitcherLabels {
  themeLabel: string;
  appearanceLabel: string;
  themeNames: Record<ThemeName, string>;
  modeNames: Record<ThemeMode, string>;
}

export function ThemeSwitcher({ labels }: { labels: ThemeSwitcherLabels }) {
  const { theme, mode, setTheme, setMode } = useTheme();

  return (
    <div className={styles.switcher}>
      <select
        aria-label={labels.themeLabel}
        value={theme}
        onChange={(event) => setTheme(event.target.value as ThemeName)}
        className={styles.select}
      >
        {THEME_NAMES.map((name) => (
          <option key={name} value={name}>
            {labels.themeNames[name]}
          </option>
        ))}
      </select>
      <select
        aria-label={labels.appearanceLabel}
        value={mode}
        onChange={(event) => setMode(event.target.value as ThemeMode)}
        className={styles.select}
      >
        {THEME_MODES.map((m) => (
          <option key={m} value={m}>
            {labels.modeNames[m]}
          </option>
        ))}
      </select>
    </div>
  );
}
