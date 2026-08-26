'use client';

import { useCallback, useEffect, useState } from 'react';
import type { GradedResult } from '@/lib/grade-simulado';

export const SIMULADO_HISTORY_STORAGE_KEY = 'birb-math-simulado-history';

export interface SimuladoAttempt {
  completedAt: string;
  result: GradedResult;
}

function readStoredHistory(): SimuladoAttempt[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SIMULADO_HISTORY_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as SimuladoAttempt[]) : [];
  } catch {
    return [];
  }
}

export function useSimuladoHistory() {
  const [history, setHistory] = useState<SimuladoAttempt[]>(() => []);

  useEffect(() => {
    setHistory(readStoredHistory());
  }, []);

  const addAttempt = useCallback((result: GradedResult) => {
    setHistory((prev) => {
      const next = [...prev, { completedAt: new Date().toISOString(), result }];
      window.localStorage.setItem(SIMULADO_HISTORY_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { history, addAttempt };
}
