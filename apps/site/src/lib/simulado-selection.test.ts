import { describe, expect, it, vi, afterEach } from 'vitest';
import { selectQuestions } from './simulado-selection';
import type { ExportedQuestion } from './simulado-selection';
import type { SimuladoConfig } from '@/components/simulado-setup';

function makeQuestion(overrides: Partial<ExportedQuestion>): ExportedQuestion {
  return {
    id: 1,
    type: 'numeric',
    difficulty: 'easy',
    promptHtml: '<p>prompt</p>',
    options: [],
    acceptedAnswers: [],
    matchingPairs: [],
    correctAnswer: '1',
    resolutionHtml: '<p>resolution</p>',
    tagIds: [],
    ...overrides,
  };
}

describe('selectQuestions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('filters by tag when tagIds is non-empty', () => {
    const questions = [
      makeQuestion({ id: 1, tagIds: [10] }),
      makeQuestion({ id: 2, tagIds: [20] }),
    ];
    const config: SimuladoConfig = { questionCount: 10, tagIds: [10], difficulties: ['easy', 'medium', 'hard'] };

    const result = selectQuestions(questions, config);

    expect(result.map((q) => q.id)).toEqual([1]);
  });

  it('includes all questions when tagIds is empty (no topic filter applied)', () => {
    const questions = [makeQuestion({ id: 1, tagIds: [10] }), makeQuestion({ id: 2, tagIds: [20] })];
    const config: SimuladoConfig = { questionCount: 10, tagIds: [], difficulties: ['easy', 'medium', 'hard'] };

    expect(selectQuestions(questions, config)).toHaveLength(2);
  });

  it('filters by difficulty', () => {
    const questions = [
      makeQuestion({ id: 1, difficulty: 'easy' }),
      makeQuestion({ id: 2, difficulty: 'hard' }),
    ];
    const config: SimuladoConfig = { questionCount: 10, tagIds: [], difficulties: ['easy'] };

    expect(selectQuestions(questions, config).map((q) => q.id)).toEqual([1]);
  });

  it('caps the result at questionCount, sampling randomly', () => {
    const questions = Array.from({ length: 10 }, (_, i) => makeQuestion({ id: i }));
    const config: SimuladoConfig = { questionCount: 3, tagIds: [], difficulties: ['easy', 'medium', 'hard'] };

    const result = selectQuestions(questions, config);

    expect(result).toHaveLength(3);
    // Every selected question must be one of the originals, with no duplicates.
    const ids = result.map((q) => q.id);
    expect(new Set(ids).size).toBe(3);
    for (const id of ids) {
      expect(id).toBeGreaterThanOrEqual(0);
      expect(id).toBeLessThan(10);
    }
  });

  it('returns fewer than questionCount if fewer questions match the filters', () => {
    const questions = [makeQuestion({ id: 1 }), makeQuestion({ id: 2 })];
    const config: SimuladoConfig = { questionCount: 10, tagIds: [], difficulties: ['easy', 'medium', 'hard'] };

    expect(selectQuestions(questions, config)).toHaveLength(2);
  });
});
