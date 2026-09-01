# Birb Math — Admin

Internal content-management app for Birb Math. Hosted on Cloudflare
Workers, backed by Cloudflare D1, gated by Cloudflare Access + its own
login. See `birb-math-internal-docs/superpowers/specs/2026-08-27-admin-panel-design.md`
(a sibling directory outside this public repo, per the project owner's
preference) for the full design.

## Local development

```bash
pnpm --filter @birb-math/admin dev
```

Local dev uses Miniflare's local D1 emulation — no real Cloudflare
credentials needed.

**Deploying:** `pnpm --filter @birb-math/admin run deploy` (`vite build
&& wrangler deploy --config dist/client/birb_math_admin/wrangler.json`).
The `--config` flag is required: `@cloudflare/vite-plugin` builds the
Worker+SPA output under `dist/client/client/` and writes its own
generated Wrangler config (with the correct `assets.directory`) next to
it under `dist/client/birb_math_admin/`. Deploying with the plain
`wrangler.jsonc` in this directory instead reads the wrong assets
directory — the Worker still comes up, but every SPA route 404s and the
Worker's own bundle/config get served publicly on `*.workers.dev`
(this shipped broken once; don't repeat it — always load the deployed
URL in a real browser after deploying, not just `curl /api/health`).

## Deployment (Cloudflare Workers + D1)

One-time setup (already done for the `birb-labs` account):

1. `wrangler d1 create birb-math-admin` → wire the returned id into
   `wrangler.jsonc`.
2. `wrangler d1 migrations apply birb-math-admin --remote`.
3. `wrangler secret put ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH` (from
   `pnpm run hash-password`) / `SESSION_SECRET` / `EXPORT_SECRET` /
   `GITHUB_PAT`.
4. `pnpm run deploy` (see the exact command above).
5. Custom domain `math-admin.birblabs.com` bound to this Worker.
6. A Cloudflare Access application gating `math-admin.birblabs.com`
   (allowing only the project owner's email, via the account's
   existing One-time-PIN identity provider) — with `/api/export`
   deliberately excluded via a second, narrower "bypass" Access
   application on `math-admin.birblabs.com/api/export`, since that
   route authenticates itself via `EXPORT_SECRET` for the CI pipeline,
   which can't complete an interactive Access login.
7. GitHub Actions repository secrets `ADMIN_EXPORT_URL` and
   `ADMIN_EXPORT_SECRET` (matching step 3's `EXPORT_SECRET`) —
   consumed by `.github/workflows/deploy.yml`.

**`ADMIN_EXPORT_URL` must be this Worker's `*.workers.dev` URL
(`https://birb-math-admin.<account>.workers.dev/api/export`), NOT the
`math-admin.birblabs.com` custom domain.** The `birblabs.com` zone's
Cloudflare bot/managed-challenge protection intercepts non-browser
requests (like GitHub Actions' server-side `fetch`) to the custom
domain with a 403 challenge page, even though the export route's own
Access-bypass rule lets it past Access itself — the bot check happens
at a layer in front of that. The `workers.dev` subdomain isn't part of
the `birblabs.com` zone, so it isn't subject to that zone's settings.
This does not weaken security: `/api/export`'s real gate is always its
own `EXPORT_SECRET` bearer check, on either hostname. The durable fix,
once a Cloudflare API token with zone-settings permission is
available, is a Configuration Rule exempting `/api/export` from bot
checks on the custom domain, after which `workers_dev` can be disabled
entirely — until then, `/api/auth/login` (and everything else) is also
reachable, session-cookie-gated only, via the `workers.dev` URL, since
Cloudflare Access only protects the custom domain.

To rotate the admin password: `pnpm run hash-password "<new password>"`,
then `wrangler secret put ADMIN_PASSWORD_HASH` with the printed value.

## Publishing and the content database

Clicking "Publicar" in the admin UI hydrates the site's next build from
this Worker's live D1 data (see `apps/site/scripts/hydrate-from-admin.ts`).
Two constraints that aren't enforced by any code and will break the next
publish if violated:

- **The database must always contain at least one lesson.** The
  site's static export (`output: 'export'`) requires
  `generateStaticParams()` for `/[locale]/content/[slug]` to return at
  least one entry — an empty lesson table makes `next build` fail
  outright. Do not delete the last remaining lesson (a placeholder
  "Disciplina de Exemplo" ships by default) without replacing it in
  the same session, until sub-project 5's real content lands.
- **New Drizzle migrations must be applied to the remote D1 before the
  next publish.** `build:from-admin` only migrates CI's own throwaway
  local SQLite; nothing applies new migrations to this Worker's D1
  automatically. Run `wrangler d1 migrations apply birb-math-admin --remote`
  after adding a migration to `packages/content-schema/drizzle`,
  before clicking Publicar.

## Known limitations

- `apps/admin`'s SPA pages don't yet handle a `401` from an expired
  session by redirecting back to the login screen — a stale session
  currently shows a broken page instead. Not a security issue (the
  Worker still rejects the request), just a UX gap.
- `/api/auth/login` has no rate limiting. Combined with `workers.dev`
  bypassing Access (above), this is the residual attack surface until
  the Configuration Rule fix lands.
