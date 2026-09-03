import { describe, expect, it } from 'vitest';
import { renderMathAnswer } from './render-math-answer';

describe('renderMathAnswer', () => {
  it('renders LaTeX to KaTeX HTML markup', () => {
    const html = renderMathAnswer('x^2');
    expect(html).toContain('katex');
  });

  it('returns an empty string for an empty answer', () => {
    expect(renderMathAnswer('')).toBe('');
  });

  it('does not throw on invalid LaTeX', () => {
    expect(() => renderMathAnswer('\\frac{1')).not.toThrow();
  });
});
