import { describe, expect, it } from 'vitest';
import { assertValidNumericCorrectAnswer, isValidNumericCorrectAnswer } from './numeric-answer-validation';

describe('isValidNumericCorrectAnswer', () => {
  it('rejects a comma-formatted decimal like "1,5"', () => {
    expect(isValidNumericCorrectAnswer('1,5')).toBe(false);
  });

  it('accepts a plain integer', () => {
    expect(isValidNumericCorrectAnswer('1')).toBe(true);
  });

  it('accepts a canonical decimal like "1.5"', () => {
    expect(isValidNumericCorrectAnswer('1.5')).toBe(true);
  });

  it('accepts a negative decimal like "-3.2"', () => {
    expect(isValidNumericCorrectAnswer('-3.2')).toBe(true);
  });

  it('accepts a symbolic answer like "não existe"', () => {
    expect(isValidNumericCorrectAnswer('não existe')).toBe(true);
  });

  it('accepts null (no correctAnswer set)', () => {
    expect(isValidNumericCorrectAnswer(null)).toBe(true);
  });
});

describe('assertValidNumericCorrectAnswer', () => {
  it('throws an error identifying the question id and the bad value', () => {
    expect(() => assertValidNumericCorrectAnswer({ id: 42, correctAnswer: '1,5' })).toThrow(/42/);
    expect(() => assertValidNumericCorrectAnswer({ id: 42, correctAnswer: '1,5' })).toThrow(/1,5/);
  });

  it('does not throw for a valid numeric answer', () => {
    expect(() => assertValidNumericCorrectAnswer({ id: 1, correctAnswer: '1.5' })).not.toThrow();
  });
});
