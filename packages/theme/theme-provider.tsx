'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import {
  DEFAULT_MODE,
  DEFAULT_THEME,
  MODE_STORAGE_KEY,
  THEME_MODES,
  THEME_NAMES,
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

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readStoredTheme(): ThemeName {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return (THEME_NAMES as string[]).includes(stored ?? '') ? (stored as ThemeName) : DEFAULT_THEME;
}

function readStoredMode(): ThemeMode {
  if (typeof window === 'undefined') return DEFAULT_MODE;
  const stored = window.localStorage.getItem(MODE_STORAGE_KEY);
  return (THEME_MODES as string[]).includes(stored ?? '') ? (stored as ThemeMode) : DEFAULT_MODE;
}

function prefersDark(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getThemeServerSnapshot(): ThemeName {
  return DEFAULT_THEME;
}

function getModeServerSnapshot(): ThemeMode {
  return DEFAULT_MODE;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, readStoredTheme, getThemeServerSnapshot);
  const mode = useSyncExternalStore(subscribe, readStoredMode, getModeServerSnapshot);
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);

  useEffect(() => {
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
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
    notify();
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    window.localStorage.setItem(MODE_STORAGE_KEY, next);
    notify();
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
