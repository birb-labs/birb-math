export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD_HASH: string;
  SESSION_SECRET: string;
  EXPORT_SECRET: string;
  GITHUB_PAT: string;
}
