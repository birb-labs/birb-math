'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  DEFAULT_MODE,
  DEFAULT_THEME,
  MODE_STORAGE_KEY,
  THEME_STORAGE_KEY,
  type ResolvedMode,
  type ThemeMode,
  type ThemeName,
} from './theme-types';
import { resolveMode } from './resolve-mode';

interface ThemeContextValue {
  theme: ThemeName;
  mode: ThemeMode;
  resolvedMode: ResolvedMode;
  setTheme: (theme: ThemeName) => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): ThemeName {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  return (window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeName | null) ?? DEFAULT_THEME;
}

function readStoredMode(): ThemeMode {
  if (typeof window === 'undefined') return DEFAULT_MODE;
  return (window.localStorage.getItem(MODE_STORAGE_KEY) as ThemeMode | null) ?? DEFAULT_MODE;
}

function prefersDark(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(DEFAULT_THEME);
  const [mode, setModeState] = useState<ThemeMode>(DEFAULT_MODE);
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);

  useEffect(() => {
    setThemeState(readStoredTheme());
    setModeState(readStoredMode());
    setSystemPrefersDark(prefersDark());

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const resolvedMode = useMemo(() => resolveMode(mode, systemPrefersDark), [mode, systemPrefersDark]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-mode', resolvedMode);
  }, [theme, resolvedMode]);

  const setTheme = useCallback((next: ThemeName) => {
    setThemeState(next);
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    window.localStorage.setItem(MODE_STORAGE_KEY, next);
  }, []);

  const value = useMemo(
    () => ({ theme, mode, resolvedMode, setTheme, setMode }),
    [theme, mode, resolvedMode, setTheme, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
