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
  },
});
