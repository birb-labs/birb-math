'use client';

import { useCallback, useEffect, useState } from 'react';

export const READING_PROGRESS_STORAGE_KEY = 'birb-math-reading-progress';

function readStoredSlugs(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(READING_PROGRESS_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []);
  } catch {
    return new Set();
  }
}

export function useReadingProgress() {
  const [completedSlugs, setCompletedSlugs] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setCompletedSlugs(readStoredSlugs());
  }, []);

  const markComplete = useCallback((slug: string) => {
    setCompletedSlugs((prev) => {
      if (prev.has(slug)) return prev;
      const next = new Set(prev);
      next.add(slug);
      window.localStorage.setItem(READING_PROGRESS_STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const isComplete = useCallback((slug: string) => completedSlugs.has(slug), [completedSlugs]);

  return { completedSlugs, isComplete, markComplete };
}
