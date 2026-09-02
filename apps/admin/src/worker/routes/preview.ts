import { Hono } from 'hono';
import { unified } from 'unified';
import { compile as compileMdx } from '@mdx-js/mdx';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
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
 * This deliberately does NOT use `@mdx-js/mdx`'s `compile`/`run` for the
 * HTML rendering itself (the pattern this route was originally speced
 * with): `run()` executes the compiled module body via
 * `new AsyncFunction(...)`, and the Workers runtime unconditionally
 * rejects that with `EvalError: Code generation from strings disallowed
 * for this context` -- Cloudflare's `unsafe_eval` binding that would
 * permit it is internal-only and not available to customer Workers
 * (confirmed against current docs/community reports, not a
 * version-drift issue). Going straight from mdast to hast to an HTML
 * string sidesteps code generation entirely, at the cost of not evaluating
 * embedded JSX components -- acceptable for a raw-text live preview that
 * doesn't bind any component implementations anyway.
 *
 * However, `remark-parse` alone treats the source as plain CommonMark, NOT
 * as real MDX -- it has no idea that `<` and `{` are special JSX/expression
 * characters there. That let genuinely broken MDX (e.g. a bare autolink
 * like `<https://example.com>`, which real MDX misparses as a JSX tag)
 * pass this preview cleanly while failing the site's actual
 * `next-mdx-remote-client` build. `@mdx-js/mdx`'s `compile()` (unlike
 * `run()`) only parses and generates JS source as a string -- it never
 * calls `new Function`/`eval`, so it's safe to call here purely to
 * validate real MDX syntax, even though we still render the visible HTML
 * through the remark-only pipeline below.
 */
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype)
  .use(rehypeKatex)
  .use(rehypeStringify);

previewRoutes.post('/', async (c) => {
  const { mdx } = await c.req.json<{ mdx: string }>();

  try {
    await compileMdx(mdx, {
      remarkPlugins: [remarkGfm, remarkMath],
      rehypePlugins: [rehypeKatex],
    });
  } catch (cause) {
    return c.json({ error: (cause as Error).message });
  }

  const file = await processor.process(mdx);
  const html = String(file);

  return c.json({ html });
});
