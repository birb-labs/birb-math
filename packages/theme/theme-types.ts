export type ThemeName = 'default' | 'solarized' | 'monokai' | 'mocha';
export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedMode = 'light' | 'dark';

export const THEME_NAMES: ThemeName[] = ['default', 'solarized', 'monokai', 'mocha'];
export const THEME_MODES: ThemeMode[] = ['light', 'dark', 'system'];

export const DEFAULT_THEME: ThemeName = 'default';
export const DEFAULT_MODE: ThemeMode = 'system';

export const THEME_STORAGE_KEY = 'birb-math-theme';
export const MODE_STORAGE_KEY = 'birb-math-mode';
