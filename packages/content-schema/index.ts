export * from './src/schema';
export * from './src/queries';
export * from './src/d1-client';
export * from './src/numeric-answer-validation';

// `./src/client` (better-sqlite3-based) is deliberately NOT re-exported from
// this barrel. better-sqlite3 is a native Node addon that cannot run in the
// Cloudflare Workers runtime, and `export *` from a barrel makes it very
// easy for a Workers-targeting consumer (apps/admin) to accidentally pull
// the whole module graph into its bundle just by importing anything else
// from this package -- which is exactly what broke `wrangler deploy` before
// this fix (the client's top-level `fileURLToPath(import.meta.url)` throws
// once bundled into a Worker). Node/Next.js consumers (apps/site) that
// genuinely need the better-sqlite3 client import it directly:
//   import { getDb } from '@birb-math/content-schema/src/client';
