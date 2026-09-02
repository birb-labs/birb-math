import { describe, expect, it } from 'vitest';
import { isMatchingAnswerCorrect, parseMatchingAnswer, serializeMatchingAnswer } from './matching-answer';

describe('serializeMatchingAnswer / parseMatchingAnswer', () => {
  it('round-trips a leftId -> rightId pairing', () => {
    expect(parseMatchingAnswer(serializeMatchingAnswer({ 1: 2, 3: 4 }))).toEqual({ 1: 2, 3: 4 });
  });

  it('parses an unanswered value as an empty pairing', () => {
    expect(parseMatchingAnswer(undefined)).toEqual({});
  });
});

describe('isMatchingAnswerCorrect', () => {
  // A correct match is leftId === rightId: each question_matching_pairs row's
  // id represents both the left slot and its correctly-paired right item.
  const pairs = [{ id: 1 }, { id: 2 }, { id: 3 }];

  it('is correct when every left is paired with its own id', () => {
    expect(isMatchingAnswerCorrect(serializeMatchingAnswer({ 1: 1, 2: 2, 3: 3 }), pairs)).toBe(true);
  });

  it('is incorrect when any pair is wrong', () => {
    expect(isMatchingAnswerCorrect(serializeMatchingAnswer({ 1: 2, 2: 1, 3: 3 }), pairs)).toBe(false);
  });

  it('is incorrect when incomplete', () => {
    expect(isMatchingAnswerCorrect(serializeMatchingAnswer({ 1: 1, 2: 2 }), pairs)).toBe(false);
  });

  it('is incorrect when unanswered', () => {
    expect(isMatchingAnswerCorrect(undefined, pairs)).toBe(false);
  });

  it('is incorrect for a question with zero pairs, even with an empty answer (not vacuously true)', () => {
    // Without an explicit empty-array guard, `[].every(...)` is vacuously
    // true and `Object.keys({}).length === 0` both hold for an unanswered
    // question with no pairs, which would otherwise grade as "correct".
    expect(isMatchingAnswerCorrect(undefined, [])).toBe(false);
    expect(isMatchingAnswerCorrect('', [])).toBe(false);
  });
});
