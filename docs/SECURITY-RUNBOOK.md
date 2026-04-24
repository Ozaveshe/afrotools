# AfroTools Security Runbook

## Release Security Standard

- Netlify publishes `dist/`, never the repo root.
- `dist/` must not contain source, prompts, migrations, tests, package manifests, agent configuration, or local reports.
- Production, deploy-preview, branch-deploy, and staging contexts must run the same deploy build class.
- Build failures must fail deploys. Best-effort jobs can fail only after the deploy artifact is built.

## Required Checks

Run these before any release touching deploy, auth, API, Supabase, payments, headers, redirects, or env docs:

```bash
npm run security:scan
npm test
npm run build:i18n:validate
npm run validate:hreflang
npm run seo:report
node scripts/build-dist.js
npm run audit:dist
```

For Supabase-backed changes, also run Supabase advisors after migrations.

## Secret Rotation After Source Exposure

If repo source is ever exposed publicly, rotate:

- Supabase service-role keys
- `AUTH_SECRET`
- `ADMIN_SECRET`
- Payment provider secrets
- AI provider API keys
- Webhook signing secrets
- Any provider token used by Netlify functions or scheduled jobs

Supabase anon keys are public client credentials, but RLS policies must be checked before relying on that assumption.

## Public Versus Internal Surfaces

Public surfaces belong under public product routes such as `/tools/`, `/api/`, `/developers/`, `/security/`, and country/category hubs.

Internal surfaces must not ship as static source paths:

- `/docs/*`
- `/scripts/*`
- `/supabase/*`
- `/netlify/*`
- `/tests/*`
- `/prompts/*`
- `/.codex/*`
- `/.agents/*`

## Supabase Access Standard

- Public read-only browser access may use Supabase anon keys, but anon keys should still live in config/env when used by server functions.
- Public writes must go through Netlify functions with validation and rate limiting. Do not depend on anonymous `INSERT` policies for lead capture, search capture, operational alerts, or crowdsource reports.
- Service-role keys are server-only and must be referenced through `SUPABASE_DATA_SERVICE_ROLE_KEY`, `SUPABASE_AUTH_SERVICE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or the legacy `SUPABASE_SERVICE_KEY` fallback.
- After any RLS change, run Supabase security advisors and record remaining owner-level items separately from repo migrations.

## Live Verification

After deploy, these must not return `200`:

```bash
curl -I https://afrotools.com/package.json
curl -I https://afrotools.com/AGENTS.md
curl -I https://afrotools.com/netlify/functions/api-scholarships.js
curl -I https://afrotools.com/supabase/migrations/022-scholarship-platform.sql
```

These must remain crawlable:

```bash
curl -I https://afrotools.com/robots.txt
curl -I https://afrotools.com/sitemap.xml
curl -I https://afrotools.com/llms.txt
```
