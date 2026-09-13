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

### Scheduled worker authentication boundary

`netlify/functions/_shared/scheduled-event.js` accepts the legacy `x-nf-event: schedule` marker. Headerless `{"next_run":"<ISO UTC timestamp>"}` support is restricted to literal, code-owned function names in `SCHEDULED_ONLY_FUNCTIONS`; tests require every opted-in handler and proof wrapper to have a matching schedule in `netlify.toml`. Generic callers and ordinary HTTP APIs must never opt in using a request-supplied name. Conflicting markers, extra/malformed payload fields, manual origin/authentication headers, non-POST methods, encoded bodies, and query parameters cannot activate the body fallback. Existing manual admin authorization remains in each handler.

The security boundary is [Netlify's production scheduled-only entrypoint restriction](https://docs.netlify.com/build/functions/scheduled-functions/), **not** secrecy or authenticity of `next_run` or user-agent. Lambda-compatible scheduler events can contain HTTP-shaped fields; the Netlify CLI constructs a POST event with a `next_run` body. Local/dev invocation is not production authentication proof. Removing a schedule or routing ordinary HTTP traffic to these workers requires removing this fallback contract or adding separately authenticated HTTP entrypoints first.

On 2026-09-13, unauthenticated, bodyless GETs to the production market-refresh and watchdog function URLs, plus `/api/market-data-refresh`, returned empty platform HTTP 403 responses rather than their application 401/cached-200 branches. Recheck this platform boundary after deployment without invoking a worker. Verify subsequent **natural** scheduled runs using new durable receipts and source timestamps; HTTP success, old cached watchdog output, or synthetic tests alone do not prove recovery.

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
