import { describe, expect, it } from 'vitest';
import { formatNumericAnswerForDisplay, normalizeNumericAnswer } from './numeric-answer';

describe('normalizeNumericAnswer', () => {
  it('normalizes a plain integer identically regardless of locale', () => {
    expect(normalizeNumericAnswer('1', 'pt-BR')).toBe('1');
    expect(normalizeNumericAnswer('1', 'en-US')).toBe('1');
  });

  it('converts a pt-BR decimal comma to a canonical dot', () => {
    expect(normalizeNumericAnswer('1,5', 'pt-BR')).toBe('1.5');
  });

  it('keeps an en-US decimal dot as-is', () => {
    expect(normalizeNumericAnswer('1.5', 'en-US')).toBe('1.5');
  });

  it('strips pt-BR thousands separators and converts the decimal comma', () => {
    expect(normalizeNumericAnswer('1.000.000', 'pt-BR')).toBe('1000000');
    expect(normalizeNumericAnswer('1.000.000,5', 'pt-BR')).toBe('1000000.5');
  });

  it('strips en-US thousands separators, keeping the decimal dot', () => {
    expect(normalizeNumericAnswer('1,000,000', 'en-US')).toBe('1000000');
  });

  it('accepts an unformatted number the same as a formatted one', () => {
    expect(normalizeNumericAnswer('1000000', 'pt-BR')).toBe('1000000');
  });

  it('passes symbolic answers through unchanged apart from trim/lowercase', () => {
    expect(normalizeNumericAnswer('  Não Existe  ', 'pt-BR')).toBe('não existe');
    expect(normalizeNumericAnswer('∞', 'pt-BR')).toBe('∞');
    expect(normalizeNumericAnswer('-∞', 'en-US')).toBe('-∞');
  });

  it('handles negative numbers', () => {
    expect(normalizeNumericAnswer('-5', 'en-US')).toBe('-5');
    expect(normalizeNumericAnswer('-1,5', 'pt-BR')).toBe('-1.5');
  });
});

describe('formatNumericAnswerForDisplay', () => {
  it('formats a canonical integer for pt-BR', () => {
    expect(formatNumericAnswerForDisplay('1000000', 'pt-BR')).toBe('1.000.000');
  });

  it('formats a canonical integer for en-US', () => {
    expect(formatNumericAnswerForDisplay('1000000', 'en-US')).toBe('1,000,000');
  });

  it('formats a canonical decimal for pt-BR using a comma', () => {
    expect(formatNumericAnswerForDisplay('1.5', 'pt-BR')).toBe('1,5');
  });

  it('passes symbolic answers through unchanged', () => {
    expect(formatNumericAnswerForDisplay('não existe', 'pt-BR')).toBe('não existe');
    expect(formatNumericAnswerForDisplay('∞', 'en-US')).toBe('∞');
  });
});
