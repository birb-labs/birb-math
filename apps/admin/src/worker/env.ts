export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD_HASH: string;
  SESSION_SECRET: string;
  EXPORT_SECRET: string;
  GITHUB_PAT: string;
}

// Merges `Env` into the ambient `Cloudflare.Env` namespace so that
// `env` from `cloudflare:test`/`cloudflare:workers` (typed as
// `Cloudflare.Env` by @cloudflare/vitest-pool-workers) knows about our
// bindings without needing a generated `worker-configuration.d.ts`.
type AdminEnv = Env;

declare global {
  namespace Cloudflare {
    interface Env extends AdminEnv {}
  }
}
