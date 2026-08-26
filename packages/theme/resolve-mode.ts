import type { ResolvedMode, ThemeMode } from './theme-types';

export function resolveMode(mode: ThemeMode, prefersDark: boolean): ResolvedMode {
  if (mode === 'system') {
    return prefersDark ? 'dark' : 'light';
  }
  return mode;
}
