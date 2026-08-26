'use client';

import { useEffect, useRef } from 'react';
import { useReadingProgress } from '@/hooks/use-reading-progress';

export function ReadingProgressTracker({ lessonSlug }: { lessonSlug: string }) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { markComplete } = useReadingProgress();

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        markComplete(lessonSlug);
      }
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [lessonSlug, markComplete]);

  return <div ref={sentinelRef} data-testid="reading-progress-sentinel" aria-hidden="true" />;
}
