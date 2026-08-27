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
