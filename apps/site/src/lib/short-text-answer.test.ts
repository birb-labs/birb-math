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
  it('accepts a match after normalization on either side', async () => {
    expect(await isAcceptedShortTextAnswer('nao existe', ['Não Existe'])).toBe(true);
    expect(await isAcceptedShortTextAnswer('OXIGENIO', ['Oxigênio', 'O2'])).toBe(true);
  });

  it('rejects a non-match', async () => {
    expect(await isAcceptedShortTextAnswer('nitrogênio', ['Oxigênio', 'O2'])).toBe(false);
  });

  it('rejects an empty or unanswered response', async () => {
    expect(await isAcceptedShortTextAnswer('', ['Oxigênio'])).toBe(false);
    expect(await isAcceptedShortTextAnswer(undefined, ['Oxigênio'])).toBe(false);
  });
});

describe('isAcceptedShortTextAnswer with answerFormat "math"', () => {
  it('accepts a symbolically equivalent answer, not just a syntactic match', async () => {
    expect(await isAcceptedShortTextAnswer('1+3x', ['3x+1'], 'math')).toBe(true);
  });

  it('accepts a match against any one of several accepted answers', async () => {
    expect(await isAcceptedShortTextAnswer('0.5', ['1/3', '1/2'], 'math')).toBe(true);
  });

  it('rejects a mathematically different answer', async () => {
    expect(await isAcceptedShortTextAnswer('3x+2', ['3x+1'], 'math')).toBe(false);
  });

  it('accepts an equal physical quantity in different units', async () => {
    expect(await isAcceptedShortTextAnswer('5000\\mathrm{m}', ['5\\mathrm{km}'], 'math')).toBe(true);
  });

  it('defaults to text-mode (lowercase, diacritic-insensitive) comparison when answerFormat is omitted', async () => {
    expect(await isAcceptedShortTextAnswer('OXIGÊNIO', ['oxigenio'], undefined)).toBe(true);
  });
});
