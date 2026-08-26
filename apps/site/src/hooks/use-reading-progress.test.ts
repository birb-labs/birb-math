import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReadingProgress, READING_PROGRESS_STORAGE_KEY } from './use-reading-progress';

describe('useReadingProgress', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts with no completed lessons', () => {
    const { result } = renderHook(() => useReadingProgress());
    expect(result.current.completedSlugs.size).toBe(0);
    expect(result.current.isComplete('some-slug')).toBe(false);
  });

  it('marks a lesson complete and persists it to localStorage', () => {
    const { result } = renderHook(() => useReadingProgress());

    act(() => {
      result.current.markComplete('licao-de-exemplo');
    });

    expect(result.current.isComplete('licao-de-exemplo')).toBe(true);
    const stored = JSON.parse(window.localStorage.getItem(READING_PROGRESS_STORAGE_KEY) ?? '[]');
    expect(stored).toEqual(['licao-de-exemplo']);
  });

  it('reads previously completed lessons from localStorage on mount', () => {
    window.localStorage.setItem(READING_PROGRESS_STORAGE_KEY, JSON.stringify(['already-done']));

    const { result } = renderHook(() => useReadingProgress());

    expect(result.current.isComplete('already-done')).toBe(true);
  });

  it('marking the same slug complete twice does not duplicate it', () => {
    const { result } = renderHook(() => useReadingProgress());

    act(() => {
      result.current.markComplete('a');
      result.current.markComplete('a');
    });

    const stored = JSON.parse(window.localStorage.getItem(READING_PROGRESS_STORAGE_KEY) ?? '[]');
    expect(stored).toEqual(['a']);
  });
});
