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

  it('does not contain the raw LaTeX source in the rendered output', () => {
    const html = renderMathAnswer('\\frac{1}{2}');
    expect(html).not.toContain('\\frac');
  });

  it('retains the semantic MathML tree for screen readers', () => {
    const html = renderMathAnswer('\\frac{1}{2}');
    expect(html).toContain('<math');
    expect(html).toContain('class="katex-mathml"');
  });
});
