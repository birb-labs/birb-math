import { Hono } from 'hono';
import type { Env } from '../env';

const GITHUB_REPO = 'birb-labs/birb-math';
const WORKFLOW_FILE = 'deploy.yml';

export const publishRoutes = new Hono<{ Bindings: Env }>();

publishRoutes.post('/', async (c) => {
  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${c.env.GITHUB_PAT}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'birb-math-admin',
      },
      body: JSON.stringify({ ref: 'main' }),
    },
  );

  if (!response.ok) {
    return c.json({ error: 'Failed to trigger the deploy workflow' }, 502);
  }

  return c.json({ ok: true });
});
