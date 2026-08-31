import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Vitest does not enable global test APIs by default (`test.globals` is
// `false`), so @testing-library/react's own auto-cleanup — which only
// registers when it finds a global `afterEach` at import time — never
// fires. Without this, the DOM from one test's `render()` leaks into the
// next test in the same file. `apps/site` and `packages/theme` hit the same
// thing and fix it the same way, so this matches the established
// convention in this monorepo.
afterEach(() => {
  cleanup();
});
