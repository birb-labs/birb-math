import { Hono } from 'hono';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import type { Env } from '../env';

export const previewRoutes = new Hono<{ Bindings: Env }>();

/**
 * Compiles raw MDX (well, Markdown + inline LaTeX math, via the same
 * `remark-math`/`rehype-katex` plugins the site's lesson/question export
 * pipeline uses) directly to an HTML string through a `unified`
 * remark->rehype pipeline.
 *
 * This deliberately does NOT use `@mdx-js/mdx`'s `compile`/`run` (the
 * pattern this route was originally speced with): `run()` executes the
 * compiled module body via `new AsyncFunction(...)`, and the Workers
 * runtime unconditionally rejects that with `EvalError: Code generation
 * from strings disallowed for this context` -- Cloudflare's `unsafe_eval`
 * binding that would permit it is internal-only and not available to
 * customer Workers (confirmed against current docs/community reports, not
 * a version-drift issue). Going straight from mdast to hast to an HTML
 * string sidesteps code generation entirely, at the cost of not evaluating
 * embedded JSX components -- acceptable for a raw-text live preview that
 * doesn't bind any component implementations anyway.
 */
const processor = unified()
  .use(remarkParse)
  .use(remarkMath)
  .use(remarkRehype)
  .use(rehypeKatex)
  .use(rehypeStringify);

previewRoutes.post('/', async (c) => {
  const { mdx } = await c.req.json<{ mdx: string }>();

  const file = await processor.process(mdx);
  const html = String(file);

  return c.json({ html });
});
