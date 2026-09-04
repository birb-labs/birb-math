import type { ReactElement } from 'react';
import { evaluate } from 'next-mdx-remote-client/rsc';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';

interface HastNode {
  type: string;
  tagName?: string;
  children?: HastNode[];
}

/**
 * rehype-katex's default output embeds the raw LaTeX source inside a
 * hidden `<annotation encoding="application/x-tex">` element (part of the
 * MathML accessibility tree) — that raw source leaks into `textContent`
 * (and whatever a screen reader does with it), which is exactly the bug
 * already found and fixed once for student-typed math answers (see
 * apps/site/src/lib/render-math-answer.ts). This does the same thing for
 * build-time-compiled MDX (lessons, question prompts/resolutions): strip
 * only the `<annotation>` node, keeping the rest of the `<math>` tree
 * (the part a screen reader actually reads) intact.
 */
function stripKatexAnnotations() {
  return (tree: HastNode) => {
    function walk(node: HastNode) {
      if (!node.children) return;
      node.children = node.children.filter(
        (child) => !(child.type === 'element' && child.tagName === 'annotation'),
      );
      for (const child of node.children) walk(child);
    }
    walk(tree);
  };
}

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
        remarkPlugins: [remarkGfm, remarkMath],
        rehypePlugins: [rehypeKatex, stripKatexAnnotations],
      },
    },
  });

  if (error) {
    throw error;
  }

  return content;
}
