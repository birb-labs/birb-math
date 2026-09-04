import { describe, expect, it, vi } from 'vitest';
import { isEquivalentExpression } from './math-equivalence';

describe('isEquivalentExpression', () => {
  it('accepts commutative reordering', async () => {
    expect(await isEquivalentExpression('3x+1', '1+3x')).toBe(true);
  });

  it('accepts algebraic expansion', async () => {
    expect(await isEquivalentExpression('(x+1)^2', 'x^2+2x+1')).toBe(true);
  });

  it('accepts a trigonometric identity', async () => {
    expect(await isEquivalentExpression('\\sin^2(x)+\\cos^2(x)', '1')).toBe(true);
  });

  it('rejects a genuinely different expression', async () => {
    expect(await isEquivalentExpression('3x+1', '3x+2')).toBe(false);
  });

  it('accepts a fraction and its decimal equivalent', async () => {
    expect(await isEquivalentExpression('1/2', '0.5')).toBe(true);
  });

  it('accepts equal physical quantities in different units', async () => {
    expect(await isEquivalentExpression('5\\mathrm{km}', '5000\\mathrm{m}')).toBe(true);
  });

  it('rejects a wrong numeric value in matching units', async () => {
    expect(await isEquivalentExpression('5\\mathrm{km}', '4000\\mathrm{m}')).toBe(false);
  });

  it('rejects incompatible units as a normal wrong answer', async () => {
    expect(await isEquivalentExpression('5\\mathrm{km}', '5\\mathrm{s}')).toBe(false);
  });

  it('accepts equal plain numbers', async () => {
    expect(await isEquivalentExpression('7', '7')).toBe(true);
  });

  it('rejects different plain numbers', async () => {
    expect(await isEquivalentExpression('7', '8')).toBe(false);
  });

  it('accepts an equivalence that only resolves after simplifying an irrational intermediate value', async () => {
    expect(await isEquivalentExpression('\\sqrt{2}\\cdot\\sqrt{2}', '2')).toBe(true);
  });

  it('rejects two structurally different free-variable expressions', async () => {
    expect(await isEquivalentExpression('x^2', 'x')).toBe(false);
  });

  it('returns false for malformed LaTeX on either side, without throwing', async () => {
    expect(await isEquivalentExpression('\\frac{1', '1')).toBe(false);
    expect(await isEquivalentExpression('1', '\\frac{1')).toBe(false);
  });

  it('returns false for an empty string on either side, without throwing', async () => {
    expect(await isEquivalentExpression('', '1')).toBe(false);
    expect(await isEquivalentExpression('1', '')).toBe(false);
  });
});

describe('isEquivalentExpression when the compute-engine module fails to load', () => {
  it('returns false instead of throwing, and allows a later call to retry', async () => {
    vi.resetModules();
    vi.doMock('@cortex-js/compute-engine', () => {
      throw new Error('simulated network failure');
    });

    const { isEquivalentExpression: isEquivalentWithFailingImport } = await import('./math-equivalence');
    const result = await isEquivalentWithFailingImport('x', 'x');
    expect(result).toBe(false);

    vi.doUnmock('@cortex-js/compute-engine');
    vi.resetModules();

    const { isEquivalentExpression: isEquivalentAfterRecovery } = await import('./math-equivalence');
    expect(await isEquivalentAfterRecovery('x', 'x')).toBe(true);
  });
});
