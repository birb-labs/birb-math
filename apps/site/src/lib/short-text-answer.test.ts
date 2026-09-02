import { describe, expect, it } from 'vitest';
import { isAcceptedShortTextAnswer, normalizeShortTextAnswer } from './short-text-answer';

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
