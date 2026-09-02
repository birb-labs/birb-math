import { describe, expect, it } from 'vitest';
import { isOrderingAnswerCorrect, parseOrderingAnswer, serializeOrderingAnswer } from './ordering-answer';

describe('serializeOrderingAnswer / parseOrderingAnswer', () => {
  it('round-trips an ordered list of ids', () => {
    expect(parseOrderingAnswer(serializeOrderingAnswer([3, 1, 2]))).toEqual([3, 1, 2]);
  });

  it('parses an unanswered value as an empty list', () => {
    expect(parseOrderingAnswer(undefined)).toEqual([]);
  });
});

describe('isOrderingAnswerCorrect', () => {
  const options = [{ id: 10 }, { id: 20 }, { id: 30 }];

  it('is correct when the user order exactly matches the options order', () => {
    expect(isOrderingAnswerCorrect(serializeOrderingAnswer([10, 20, 30]), options)).toBe(true);
  });

  it('is incorrect when the order differs', () => {
    expect(isOrderingAnswerCorrect(serializeOrderingAnswer([20, 10, 30]), options)).toBe(false);
  });

  it('is incorrect when unanswered', () => {
    expect(isOrderingAnswerCorrect(undefined, options)).toBe(false);
  });

  it('is incorrect for a question with zero options, even with an empty answer (not vacuously true)', () => {
    // Without an explicit empty-array guard, `[].every(...)` is vacuously
    // true and both sequences have length 0 for an unanswered question with
    // no options, which would otherwise grade as "correct".
    expect(isOrderingAnswerCorrect(undefined, [])).toBe(false);
    expect(isOrderingAnswerCorrect('', [])).toBe(false);
  });
});
