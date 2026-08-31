import path from 'node:path';
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-pool-workers';
import { defineConfig } from 'vitest/config';

// Task 3's plain-Node crypto tests (password.test.ts, session.test.ts) run
// fine under the Workers pool too — Web Crypto's `crypto.subtle` is
// available there — so a single config now covers all of apps/admin's
// tests instead of the plain `defineConfig` used in Task 3.
//
// Note: `@cloudflare/vitest-pool-workers@^0.22.0` (matching this repo's
// vitest 4.x) exposes its Workers-runtime integration as a Vite plugin
// (`cloudflareTest`) rather than the `defineWorkersConfig` wrapper used by
// older 0.9.x releases (which only support vitest 2.0-3.2). The 0.9.x line
// hits a `vm._setUnsafeEval is not a function` crash in its bundled workerd
// build under this environment's Node version, so this project pins the
// current `cloudflareTest`-based API instead.
export default defineConfig({
  plugins: [
    cloudflareTest(async () => {
      const migrationsPath = path.join(import.meta.dirname, '../../packages/content-schema/drizzle');
      const migrations = await readD1Migrations(migrationsPath);

      return {
        wrangler: { configPath: './wrangler.jsonc' },
        // Exposed to tests as `env.TEST_MIGRATIONS` so `applyD1Migrations`
        // knows which migrations to apply against the local D1 binding.
        miniflare: {
          bindings: { TEST_MIGRATIONS: migrations },
        },
      };
    }),
  ],
});
