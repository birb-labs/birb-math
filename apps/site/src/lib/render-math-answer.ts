import katex from 'katex';

// Renders a student's live-typed math-mode answer to display HTML. This is
// deliberately a client-side render (katex's public renderToString API,
// called at result-display time), unlike every other piece of question
// content: prompts/options/resolutions are pre-compiled to HTML at build
// time from authored MDX, but a student's answer doesn't exist until they
// type it in the browser.
//
// `output: 'html'` (rather than KaTeX's default `htmlAndMathml`) is
// deliberate: the default also emits a hidden MathML `<annotation>` element
// containing the raw LaTeX source, verbatim, for accessibility purposes.
// That would defeat the purpose of rendering at all here, since the raw
// source text would still be present in the DOM (and in `.textContent`)
// alongside the rendered formula. HTML-only output renders the same visual
// formula without echoing the LaTeX source back into the page.
export function renderMathAnswer(latex: string): string {
  if (latex.trim() === '') return '';
  return katex.renderToString(latex, { throwOnError: false, output: 'html' });
}
