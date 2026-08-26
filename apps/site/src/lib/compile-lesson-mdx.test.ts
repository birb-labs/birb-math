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

  it('rejects malformed MDX with a thrown error rather than silently producing empty output', async () => {
    await expect(compileLessonMdx('<Unclosed')).rejects.toThrow();
  });
});
