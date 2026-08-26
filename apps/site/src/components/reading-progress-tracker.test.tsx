import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render } from '@testing-library/react';
import { ReadingProgressTracker } from './reading-progress-tracker';

describe('ReadingProgressTracker', () => {
  let observedCallback: IntersectionObserverCallback;
  let observeSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    window.localStorage.clear();
    observeSpy = vi.fn();
    vi.stubGlobal(
      'IntersectionObserver',
      // Note: must be a `function` expression, not an arrow function — vitest 4's
      // mock constructor support uses `Reflect.construct` when the mock is invoked
      // via `new`, which requires a constructible function (arrow functions throw
      // "is not a constructor").
      vi.fn().mockImplementation(function (callback: IntersectionObserverCallback) {
        observedCallback = callback;
        return { observe: observeSpy, disconnect: vi.fn(), unobserve: vi.fn() };
      }),
    );
  });

  it('observes its sentinel element on mount', () => {
    render(<ReadingProgressTracker lessonSlug="licao-de-exemplo" />);
    expect(observeSpy).toHaveBeenCalledTimes(1);
  });

  it('marks the lesson complete in localStorage when the sentinel intersects', () => {
    render(<ReadingProgressTracker lessonSlug="licao-de-exemplo" />);

    act(() => {
      observedCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });

    const stored = JSON.parse(window.localStorage.getItem('birb-math-reading-progress') ?? '[]');
    expect(stored).toEqual(['licao-de-exemplo']);
  });

  it('does not mark the lesson complete when the sentinel is not intersecting', () => {
    render(<ReadingProgressTracker lessonSlug="licao-de-exemplo" />);

    act(() => {
      observedCallback(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });

    expect(window.localStorage.getItem('birb-math-reading-progress')).toBeNull();
  });
});
