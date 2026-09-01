import { describe, expect, it, beforeAll } from 'vitest';
import { env, applyD1Migrations, SELF } from 'cloudflare:test';

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  env.EXPORT_SECRET = 'test-export-secret';
  await env.DB.prepare(
    "INSERT INTO subjects (slug, name, \"order\") VALUES ('exemplo', 'Exemplo', 1)",
  ).run();
});

describe('GET /api/export', () => {
  it('rejects a request without the correct bearer token', async () => {
    const response = await SELF.fetch('https://admin.test/api/export');
    expect(response.status).toBe(401);
  });

  it('returns every table as JSON when the correct token is provided', async () => {
    const response = await SELF.fetch('https://admin.test/api/export', {
      headers: { Authorization: 'Bearer test-export-secret' },
    });

    expect(response.status).toBe(200);
    const data = await response.json<{ subjects: { slug: string }[] }>();
    expect(data.subjects.find((s) => s.slug === 'exemplo')).toBeDefined();
  });
});
