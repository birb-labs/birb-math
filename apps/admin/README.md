# Birb Math — Admin

Internal content-management app for Birb Math. Hosted on Cloudflare
Workers, backed by Cloudflare D1, gated by Cloudflare Access + its own
login. See `birb-math-internal-docs/superpowers/specs/2026-08-27-admin-panel-design.md`
for the full design.

## Local development

```bash
pnpm --filter @birb-math/admin dev
```

Local dev uses Miniflare's local D1 emulation — no real Cloudflare
credentials needed. Deployment/ops steps are documented as they're
introduced later in this plan.

## Deployment (Cloudflare Workers + D1)

One-time setup (already done for the `birb-labs` account — see the
implementation plan's Task 19 for the exact commands run):

1. `wrangler d1 create birb-math-admin` → wire the returned id into
   `wrangler.jsonc`.
2. `wrangler d1 migrations apply birb-math-admin --remote`.
3. `wrangler secret put ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH` (from
   `pnpm run hash-password`) / `SESSION_SECRET` / `EXPORT_SECRET` /
   `GITHUB_PAT`.
4. `wrangler deploy`.
5. Custom domain `math-admin.birblabs.com` bound to this Worker.
6. A Cloudflare Access application gating `math-admin.birblabs.com`
   (allowing only the project owner's email, via the account's
   existing One-time-PIN identity provider) — with `/api/export`
   deliberately excluded, since that route authenticates itself via
   `EXPORT_SECRET` for the CI pipeline, which can't complete an
   interactive Access login.
7. GitHub Actions repository secrets `ADMIN_EXPORT_URL` (this Worker's
   `/api/export` URL) and `ADMIN_EXPORT_SECRET` (matching step 3's
   `EXPORT_SECRET`) — consumed by `.github/workflows/deploy.yml`.

To rotate the admin password: `pnpm run hash-password "<new password>"`,
then `wrangler secret put ADMIN_PASSWORD_HASH` with the printed value.
