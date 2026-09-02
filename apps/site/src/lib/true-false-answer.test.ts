import { describe, expect, it } from 'vitest';
import { isTrueFalseAnswerCorrect } from './true-false-answer';

describe('isTrueFalseAnswerCorrect', () => {
  it('is correct when the answer matches', () => {
    expect(isTrueFalseAnswerCorrect('true', 'true')).toBe(true);
    expect(isTrueFalseAnswerCorrect('false', 'false')).toBe(true);
  });

  it('is incorrect when the answer does not match', () => {
    expect(isTrueFalseAnswerCorrect('true', 'false')).toBe(false);
  });

  it('is incorrect when unanswered', () => {
    expect(isTrueFalseAnswerCorrect(undefined, 'true')).toBe(false);
  });
});
