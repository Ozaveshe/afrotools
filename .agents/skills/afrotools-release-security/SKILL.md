---
name: afrotools-release-security
description: AfroTools deploy and data security workflow for Netlify publish settings, deploy previews, source exposure, Supabase RLS, secret handling, and release gates. Use when changing Netlify config, functions, env conventions, Supabase policies, or security-sensitive CI.
---
# AfroTools Release Security

Use this skill when a change can affect what ships publicly, how server functions authenticate, or how Supabase data is exposed.

## Read First

- `docs/SECURITY-RUNBOOK.md`
- `docs/release-checklist.md`
- `.claude/rules/netlify-functions.md`
- `.claude/rules/supabase.md`

## Workflow

1. Classify every touched path as public artifact, server-only code, generated output, database migration, or local agent/developer context.
2. Confirm Netlify publishes `dist/` and that all deploy contexts run the real deploy build.
3. Check that server functions read secrets from env and fail closed when required service keys are missing.
4. For public writes, require a Netlify function boundary with validation/rate limiting and service-role access.
5. Run the security/release gate commands below.
6. If Supabase changes are involved, run live advisors through the configured Supabase MCP server and list dashboard-only follow-ups separately.

## Commands

```bash
npm run security:scan
npm test
npm run build:i18n:validate
npm run validate:hreflang
npm run seo:report
npm run build:deploy
npm run audit:dist
```

Use targeted `node --check` for edited Netlify functions and scripts.

## Standards

- Do not publish repo root.
- Do not hard-code provider keys in server code.
- Do not permit anonymous inserts for operational data unless the policy has a documented threat model.
- Do not mark broken-link or artifact-freshness checks as non-blocking in CI.
- Keep crawler assets such as `robots.txt`, `sitemap.xml`, and `llms.txt` public while blocking repo internals.
