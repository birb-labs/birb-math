import katex from 'katex';

// Renders a student's live-typed math-mode answer to display HTML. This is
// deliberately a client-side render (katex's public renderToString API,
// called at result-display time), unlike every other piece of question
// content: prompts/options/resolutions are pre-compiled to HTML at build
// time from authored MDX, but a student's answer doesn't exist until they
// type it in the browser.
//
// We keep KaTeX's default `output: 'htmlAndMathml'` rather than `output:
// 'html'`. The default emits both the visual HTML rendering (marked
// `aria-hidden="true"`) AND a semantic MathML `<math>` tree, which is what
// screen readers actually announce for the formula. `output: 'html'` drops
// the MathML tree entirely, leaving screen-reader users with nothing when a
// math-mode answer is announced on the results page.
//
// The one problem with the default output: inside the MathML tree, KaTeX
// embeds an `<annotation encoding="application/x-tex">` element containing
// the raw LaTeX source, verbatim, as a fallback for consumers that can't
// render MathML. jsdom's `.textContent` (and some assistive tech in
// practice) doesn't respect this element's visual hiding, so the raw LaTeX
// source would leak into the rendered answer's text content alongside the
// formula. We strip just that `<annotation>` sub-element via a string
// replace, leaving the rest of the MathML tree (`<math>`, `<semantics>`,
// `<mrow>`, etc. -- the actual accessible structure) intact.
const TEX_ANNOTATION_PATTERN =
  /<annotation encoding="application\/x-tex">[\s\S]*?<\/annotation>/g;

export function renderMathAnswer(latex: string): string {
  if (latex.trim() === '') return '';
  const html = katex.renderToString(latex, { throwOnError: false });
  return html.replace(TEX_ANNOTATION_PATTERN, '');
}
