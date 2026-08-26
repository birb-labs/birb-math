import type { ReactElement } from 'react';
import { evaluate } from 'next-mdx-remote-client/rsc';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

/**
 * Compiles Markdown/MDX lesson source (with inline LaTeX math support via
 * remark-math + rehype-katex) into a React element ready to render inside a
 * Server Component.
 *
 * Note: `next-mdx-remote-client`'s `evaluate` does NOT throw on malformed
 * MDX — it catches the compile/run error internally and resolves with an
 * `error` field plus an empty placeholder `content`. We rethrow that error
 * here so callers can rely on rejection (via try/catch or a React error
 * boundary) instead of silently rendering empty output.
 */
export async function compileLessonMdx(source: string): Promise<ReactElement> {
  const { content, error } = await evaluate({
    source,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkMath],
        rehypePlugins: [rehypeKatex],
      },
    },
  });

  if (error) {
    throw error;
  }

  return content;
}
