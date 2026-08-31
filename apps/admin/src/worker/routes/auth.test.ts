import { describe, expect, it, beforeAll } from 'vitest';
import { env, applyD1Migrations, SELF, type D1Migration } from 'cloudflare:test';
import { hashPassword } from '../auth/password';

// `env` (from `cloudflare:test`) is typed as the ambient `Cloudflare.Env`
// (see ../env.ts for the merge of our own `Env` bindings into it). Here we
// additionally merge in `TEST_MIGRATIONS`, injected by vitest.config.ts via
// `readD1Migrations`, so `applyD1Migrations` below knows which migrations
// to apply.
declare global {
  namespace Cloudflare {
    interface Env {
      TEST_MIGRATIONS: D1Migration[];
    }
  }
}

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});

describe('POST /api/auth/login', () => {
  it('rejects a request before the admin password is configured for the test', async () => {
    const response = await SELF.fetch('https://admin.test/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'someone', password: 'wrong' }),
    });
    expect(response.status).toBe(401);
  });

  it('accepts the correct username/password and sets a session cookie', async () => {
    const hash = await hashPassword('correct-password');
    env.ADMIN_USERNAME = 'admin';
    env.ADMIN_PASSWORD_HASH = hash;
    env.SESSION_SECRET = 'test-session-secret';

    const response = await SELF.fetch('https://admin.test/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'correct-password' }),
    });

    expect(response.status).toBe(200);
    const setCookie = response.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('session=');
    expect(setCookie).toContain('HttpOnly');
  });

  it('rejects the correct username with a wrong password', async () => {
    const response = await SELF.fetch('https://admin.test/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'not-the-password' }),
    });
    expect(response.status).toBe(401);
  });
});

describe('requireSession middleware', () => {
  it('blocks an unauthenticated request to a protected route', async () => {
    const response = await SELF.fetch('https://admin.test/api/lessons');
    expect(response.status).toBe(401);
  });
});
