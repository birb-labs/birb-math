import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { compileLessonMdx } from './compile-lesson-mdx';

describe('compileLessonMdx', () => {
  it('compiles Markdown headings and paragraphs', async () => {
    const element = await compileLessonMdx('# Título\n\nUm parágrafo de teste.');
    const html = renderToStaticMarkup(element);

    expect(html).toContain('<h1>Título</h1>');
    expect(html).toContain('Um parágrafo de teste.');
  });

  it('compiles inline LaTeX math into KaTeX HTML', async () => {
    const element = await compileLessonMdx('Fórmula: $x^2$.');
    const html = renderToStaticMarkup(element);

    expect(html).toContain('class="katex"');
  });

  it('strips the raw-LaTeX annotation element while keeping the MathML accessibility tree', async () => {
    const element = await compileLessonMdx('Fórmula: $x^2$.');
    const html = renderToStaticMarkup(element);

    expect(html).not.toContain('<annotation');
    expect(html).not.toContain('x^2');
    expect(html).toContain('class="katex-mathml"');
  });

  it('rejects malformed MDX with a thrown error rather than silently producing empty output', async () => {
    await expect(compileLessonMdx('<Unclosed')).rejects.toThrow();
  });

  it('compiles GFM (pipe) tables into real HTML tables', async () => {
    const element = await compileLessonMdx('| a | b |\n|---|---|\n| 1 | 2 |\n');
    const html = renderToStaticMarkup(element);

    expect(html).toContain('<table>');
    expect(html).toContain('<td>1</td>');
    expect(html).toContain('<td>2</td>');
  });
});
