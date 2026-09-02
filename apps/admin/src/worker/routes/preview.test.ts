import { describe, expect, it, beforeAll } from 'vitest';
import { env, applyD1Migrations, SELF } from 'cloudflare:test';
import { hashPassword } from '../auth/password';

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  env.ADMIN_USERNAME = 'admin';
  env.ADMIN_PASSWORD_HASH = await hashPassword('test-password');
  env.SESSION_SECRET = 'test-session-secret';
});

async function login(): Promise<string> {
  const response = await SELF.fetch('https://admin.test/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'test-password' }),
  });
  return response.headers.get('set-cookie')!.split(';')[0];
}

describe('POST /api/preview', () => {
  it('compiles MDX with LaTeX math to HTML', async () => {
    const cookie = await login();
    const response = await SELF.fetch('https://admin.test/api/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ mdx: 'Qual é o valor de $1 + 1$?' }),
    });

    expect(response.status).toBe(200);
    const { html } = await response.json<{ html: string }>();
    expect(html).toContain('class="katex"');
  });

  it('compiles GFM (pipe) tables into real HTML tables', async () => {
    const cookie = await login();
    const response = await SELF.fetch('https://admin.test/api/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ mdx: '| a | b |\n|---|---|\n| 1 | 2 |\n' }),
    });

    expect(response.status).toBe(200);
    const { html } = await response.json<{ html: string }>();
    expect(html).toContain('<table>');
    expect(html).toContain('<td>1</td>');
  });

  it('reports an error for MDX that real MDX rejects but plain Markdown would accept', async () => {
    // A bare autolink like `<https://example.com>` is valid CommonMark, but
    // real MDX (which the site's build actually uses) parses `<` as a JSX
    // tag opener and chokes on the `://`. This preview must catch that,
    // since it once slipped through and broke a production deploy.
    const cookie = await login();
    const response = await SELF.fetch('https://admin.test/api/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ mdx: 'Fonte: <https://example.com>' }),
    });

    expect(response.status).toBe(200);
    const { error } = await response.json<{ error?: string }>();
    expect(error).toBeTruthy();
  });
});
