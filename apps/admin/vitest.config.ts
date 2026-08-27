import { defineConfig } from 'vitest/config';

// Deliberately does NOT reuse vite.config.ts: the @cloudflare/vite-plugin
// registers a Workers-runtime Vite environment whose `resolve.external`
// setting (Node built-ins excluded from the Workers bundle) is rejected by
// Vitest's own environment validation. Unit tests here exercise plain
// TypeScript/React logic, not the Workers runtime, so a plain jsdom
// environment (matching apps/site and packages/theme) is what's needed.
export default defineConfig({
  test: {
    environment: 'jsdom',
    // This task adds no test files yet (later tasks do); without this,
    // Vitest's default "no test files found" behavior exits 1, which
    // would break the repo-wide `pnpm -r test` (run by CI in deploy.yml).
    passWithNoTests: true,
  },
});
