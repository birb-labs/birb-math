import { describe, expect, it } from 'vitest';
import { isAcceptedShortTextAnswer, normalizeMathAnswer, normalizeShortTextAnswer } from './short-text-answer';

describe('normalizeShortTextAnswer', () => {
  it('trims and lowercases', () => {
    expect(normalizeShortTextAnswer('  Oxigênio  ')).toBe('oxigenio');
  });

  it('strips diacritics', () => {
    expect(normalizeShortTextAnswer('não existe')).toBe('nao existe');
    expect(normalizeShortTextAnswer('Oxigênio')).toBe('oxigenio');
  });
});

describe('isAcceptedShortTextAnswer', () => {
  it('accepts a match after normalization on either side', () => {
    expect(isAcceptedShortTextAnswer('nao existe', ['Não Existe'])).toBe(true);
    expect(isAcceptedShortTextAnswer('OXIGENIO', ['Oxigênio', 'O2'])).toBe(true);
  });

  it('rejects a non-match', () => {
    expect(isAcceptedShortTextAnswer('nitrogênio', ['Oxigênio', 'O2'])).toBe(false);
  });

  it('rejects an empty or unanswered response', () => {
    expect(isAcceptedShortTextAnswer('', ['Oxigênio'])).toBe(false);
    expect(isAcceptedShortTextAnswer(undefined, ['Oxigênio'])).toBe(false);
  });
});

describe('normalizeMathAnswer', () => {
  it('trims leading/trailing whitespace', () => {
    expect(normalizeMathAnswer('  x^2  ')).toBe('x^2');
  });

  it('collapses internal whitespace', () => {
    expect(normalizeMathAnswer('3 x + 1')).toBe('3x+1');
  });

  it('does not lowercase, unlike normalizeShortTextAnswer — LaTeX is case-sensitive', () => {
    expect(normalizeMathAnswer('\\Delta')).toBe('\\Delta');
    expect(normalizeMathAnswer('\\Delta')).not.toBe('\\delta');
  });
});

describe('isAcceptedShortTextAnswer with answerFormat "math"', () => {
  it('is correct on a whitespace-insensitive, case-sensitive match', () => {
    expect(isAcceptedShortTextAnswer('3x + 1', ['3x+1'], 'math')).toBe(true);
    expect(isAcceptedShortTextAnswer('3x+1', ['  3x + 1  '], 'math')).toBe(true);
  });

  it('is incorrect when case differs', () => {
    expect(isAcceptedShortTextAnswer('\\delta', ['\\Delta'], 'math')).toBe(false);
  });

  it('defaults to text-mode (lowercase, diacritic-insensitive) comparison when answerFormat is omitted', () => {
    expect(isAcceptedShortTextAnswer('OXIGÊNIO', ['oxigenio'], undefined)).toBe(true);
  });
});
