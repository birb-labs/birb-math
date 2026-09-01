import { describe, expect, it, vi, afterEach, beforeAll, beforeEach } from 'vitest';
import { env, applyD1Migrations, SELF } from 'cloudflare:test';
import { hashPassword } from '../auth/password';

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  env.ADMIN_USERNAME = 'admin';
  env.ADMIN_PASSWORD_HASH = await hashPassword('test-password');
  env.SESSION_SECRET = 'test-session-secret';
  env.GITHUB_PAT = 'test-github-pat';
});

let cookie = '';

beforeEach(async () => {
  const response = await SELF.fetch('https://admin.test/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'test-password' }),
  });
  cookie = response.headers.get('set-cookie')!.split(';')[0];
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('POST /api/publish', () => {
  it('calls the GitHub workflow_dispatch API with the configured PAT', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));

    const response = await SELF.fetch('https://admin.test/api/publish', {
      method: 'POST',
      headers: { Cookie: cookie },
    });

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledExactlyOnceWith(
      'https://api.github.com/repos/birb-labs/birb-math/actions/workflows/deploy.yml/dispatches',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer test-github-pat' }),
      }),
    );
  });

  it('returns an error when GitHub responds with a failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('bad request', { status: 422 }));

    const response = await SELF.fetch('https://admin.test/api/publish', {
      method: 'POST',
      headers: { Cookie: cookie },
    });

    expect(response.status).toBe(502);
  });

  it('rejects an unauthenticated request', async () => {
    const response = await SELF.fetch('https://admin.test/api/publish', { method: 'POST' });
    expect(response.status).toBe(401);
  });
});
