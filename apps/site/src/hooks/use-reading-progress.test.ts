import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReadingProgress, READING_PROGRESS_STORAGE_KEY } from './use-reading-progress';

// `vi.spyOn(reactModule, 'useState')` cannot be used here: Vitest/Node ESM
// module namespace objects are not configurable, so spying on 'react''s
// export post-hoc throws ("Cannot redefine property: useState"). Instead we
// intercept at module-resolution time via vi.mock, wrapping useState so we
// can inspect every call's arguments while still delegating to the real
// implementation (everything else about React is untouched).
const useStateCalls: unknown[][] = [];
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useState: (...args: unknown[]) => {
      useStateCalls.push(args);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actual.useState as any)(...args);
    },
  };
});

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

  // Regression test for a hydration mismatch: the server-rendered HTML (built
  // with `output: 'export'`, no `window`) always reflects zero completed
  // lessons, so the client's *first* render — the hydration render — must also
  // start empty, with the real value only applied afterwards via useEffect.
  //
  // Note: `renderHook` in this project's installed @testing-library/react
  // (16.3.2, React 19) flushes passive effects synchronously via `act()`
  // before returning, so `result.current` immediately after `renderHook()`
  // already reflects the post-effect value in BOTH the buggy (lazy
  // initializer reads localStorage) and fixed (initializer starts empty)
  // implementations — a plain "check the value right after render" test
  // cannot tell them apart (verified empirically: a probe hook's useEffect
  // had already run by the time its post-render value was inspected). So
  // instead we spy on `useState` to inspect the *initializer function itself*
  // — the thing that actually determines the hydration-render output — and
  // assert it produces an empty set independent of what's in localStorage.
  it('initializes state with a lazy initializer that ignores localStorage (hydration-safety)', () => {
    window.localStorage.setItem(READING_PROGRESS_STORAGE_KEY, JSON.stringify(['already-done']));
    useStateCalls.length = 0;

    renderHook(() => useReadingProgress());

    const completedSlugsCall = useStateCalls.find(
      (call): call is [() => Set<string>] => typeof call[0] === 'function',
    );
    expect(completedSlugsCall).toBeDefined();

    const [initializer] = completedSlugsCall!;
    // This must return an empty set even though localStorage has prior
    // progress: the initializer runs during the client's hydration render,
    // which must match the always-empty server-rendered HTML bit-for-bit.
    expect(initializer()).toEqual(new Set());
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
