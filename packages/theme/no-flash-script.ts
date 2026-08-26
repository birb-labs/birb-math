import { DEFAULT_MODE, DEFAULT_THEME, MODE_STORAGE_KEY, THEME_STORAGE_KEY } from './theme-types';

export const noFlashScript = `(function() {
  try {
    var theme = window.localStorage.getItem('${THEME_STORAGE_KEY}') || '${DEFAULT_THEME}';
    var mode = window.localStorage.getItem('${MODE_STORAGE_KEY}') || '${DEFAULT_MODE}';
    var resolved = mode === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : mode;
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-mode', resolved);
  } catch (e) {}
})();`;
