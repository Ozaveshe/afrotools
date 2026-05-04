# AfroTools Agent Guide

## Mission

AfroTools is a static-first, multi-surface product for African tools, country hubs, blogs, and data-driven pages. Optimize for safe repeatable changes, not clever one-off edits.

## First Read Order

1. `package.json`
2. `docs/ARCHITECTURE.md`
3. `docs/ADDING-A-TOOL.md`
4. `docs/ADDING-A-COUNTRY.md`
5. `docs/design-doctrine.md`
6. `docs/codex-playbook.md`
7. `docs/known-traps.md`

## Repo Reality

- Most pages are plain HTML with shared JS and CSS.
- Many outputs are generated or post-processed by scripts in `scripts/`.
- `assets/js/components/tool-registry.js` is the routing and discovery backbone for tools.
- Netlify serves the site and functions.
- `afrotools-mission-control.html` is the Codex cockpit.
- `mc-7a2f9x.html` is the legacy ops dashboard.

## Core Commands

- `npm run build` - full site rebuild and post-processing
- `npm run build:deploy` - rebuild and prepare the publishable `dist/` artifact
- `npm run counts:sync` - refresh public tool-count copy from the registry-backed source of truth
- `npm run sitemap` - regenerate sitemap files from source routes
- `npm run blog:feed:check` - detect blog feed drift without writing files
- `npm run blog:verify` - verify static blog hub, feed, canonical, and JSON-LD integrity
- `npm test` - link check plus tool audit
- `npm run check-links` - broken links and routing smoke check
- `npm run audit` - tool audit
- `npm run pro:verify` - verify Pro control/dashboard architecture wiring
- `npm run afrostream:media:audit` - audit AfroStream live-media thumbnail coverage and fallback policy
- `npm run audit:dist` - verify the deploy artifact only contains publishable output
- `npm run pdf:verify` - verify PDF category gate coverage and workflow wiring
- `npm run security:scan` - scan publish surfaces for leaked repo internals and risky files
- `npm run seo` - SEO daily fix pass
- `npm run seo:og` - apply or refresh OG image fallbacks for tool routes
- `npm run seo:report` - SEO report mode
- `npm run seo:priority` - rebuild SEO system
- `npm run seo:widgets` - normalize embed and thin utility surface SEO
- `npm run build:i18n -- --all` - regenerate translations
- `npm run build:i18n:validate` - validate i18n output
- `npm run build:i18n:full` - rebuild i18n output and validate hreflang together
- `npm run validate:hreflang` - hreflang validation
- `npm run cars:catalog:refresh` - validate and rebuild car catalog data
- `npm run inventory:site` - refresh the internal site ledger used by `mc-7a2f9x.html`

## Edit Strategy

- Prefer source files over generated outputs.
- Prefer scripts for bulk edits across many pages.
- Keep new workflow knowledge in docs and local skills so future agents inherit it.
- When changing registry, SEO, i18n, build, or Netlify behavior, update the matching playbook or rule.

## High-Risk Zones

- `assets/js/components/tool-registry.js`
- `netlify.toml`
- `_redirects`
- `_headers`
- `netlify/functions/`
- `scripts/build-*.js`
- `scripts/audit-dist.js`
- `scripts/generate-*.js`
- `sitemap*.xml`
- `assets/js/bundles/`
- `dist/`
- `*.min.js`

Do not hand-edit generated files unless the source is missing or the task explicitly calls for a direct patch.

## Workflow Expectations

### Tool and page work

- If adding or changing a tool, review `docs/ADDING-A-TOOL.md`.
- If adding or changing a country surface, review `docs/ADDING-A-COUNTRY.md`.
- If registry entries change, validate links and audit tool metadata.

### PDF and document tools

- Read `docs/PDF-CATEGORY-WORKFLOW.md`.
- Keep processing local first unless the tool explicitly documents a server-backed flow.
- Load `assets/js/lib/pdf-download-gate.js` on PDF-category tools that generate downloads, and wrap direct download callbacks with the shared gate.
- Treat the shared gate's intercepted `<a download>` behavior as fallback coverage, not a replacement for wiring the main action.

### Design and UI work

- Start from `assets/css/design-system.css`, `style-guide.html`, and `docs/design-doctrine.md`.
- Use `docs/MOBILE-AUDIT-WORKFLOW.md` and `node scripts/mobile-audit.js` for repo-wide mobile risk sweeps before broad page-by-page fixes.
- Reuse repo tokens, type, spacing, radii, shadows, and motion rules before inventing new ones.
- Prefer stronger composition and hierarchy over piling on more cards or controls.

### SEO work

- Use existing SEO scripts before writing a new fixer.
- Do not manually edit sitemap files as a first choice.
- `scripts/generate-sitemaps.js` preserves existing sitemap `<lastmod>` values by default; set `AFROTOOLS_REFRESH_SITEMAP_LASTMOD=1` only when intentionally restamping sitemap dates.
- Keep `widgets/iframe/` utility pages `noindex, follow` and normalize them with `npm run seo:widgets`.
- Keep generated deploy output such as `dist/` out of source SEO scans; regenerate it from source instead of patching generated URLs.
- For tool social-card changes, add the matching route image and run `npm run seo:og`.
- If canonical, OG, internal linking, or alias behavior changes, run the relevant SEO scripts and record the workflow in docs if it is new.

### Content publishing

- Read `docs/CONTENT-PUBLISHING-WORKFLOW.md`.
- Treat `/blog/` as static repo-backed content.
- Run `npm run blog:feed:check` to catch RSS/feed drift without rewriting output.
- Run `npm run blog:verify` when changing static blog cards, metadata, or feed-linked posts.
- Treat AfroStream news as a live Supabase-backed publishing surface and use the configured `supabase` MCP server first for live publishing or inspection.
- Run `npm run afrostream:media:audit` during AfroStream QA when live thumbnails, fallbacks, or media policy behavior changes.

### Pro surfaces

- Read `docs/AFROTOOLS-PRO-CONTROL-DASHBOARD.md` when changing Pro dashboard, app directory, or shared architecture helpers.
- Run `npm run pro:verify` after Pro control or registry-backed app-directory changes.

### i18n work

- Treat translated pages as build outputs unless the task is a targeted manual fix.
- Validate hreflang after non-trivial translation changes.

### Supabase work

- Use the configured `supabase` MCP server first whenever a task needs live project access, schema inspection, SQL execution, logs, storage, auth, or generated types.
- Keep repo edits and live project actions conceptually separate in your notes and summaries.

### Email marketing

- Read `docs/EMAIL-MARKETING-WORKFLOW.md` before changing lifecycle, lead-capture, digest, or unsubscribe email flows.
- Treat Resend delivery and Supabase recipient state as live systems; keep secrets and one-time send tokens out of docs, commits, and summaries.
- After email-function changes, run the narrow `node --check` commands listed in that doc plus `npm run security:scan`.

### Release and publish-surface work

- Read `docs/release-checklist.md`.
- Netlify must publish `dist/`, never the repo root.
- For Netlify, redirects, functions, or publish-surface changes, run `npm run security:scan`, `npm run build:deploy`, and `npm run audit:dist`.
- Inspect `dist/` directly when validating a release or deploy-surface fix.

### Internal inventory work

- If `mc-7a2f9x.html` counts look stale after registry or page changes, run `npm run inventory:site` before relying on the dashboard.
- If public tool-count copy drifts across homepage, search, category, or country surfaces, run `npm run counts:sync` before SEO review so static marketing pages inherit the current registry-backed total.

## Preferred Validation

- HTML or content changes: `npm test`
- PDF/document tool changes: `npm run pdf:verify`, `npm run audit`, plus a guest and registered-user browser smoke when downloads changed
- Registry or navigation changes: `npm run check-links` and `npm run audit`
- SEO changes: `npm run seo:report` or the narrower script that matches the change
- Static blog changes: `npm run blog:feed:check`, `npm run blog:verify`, and `npm run check-links`
- Pro dashboard/app-directory changes: `npm run pro:verify`
- AfroStream media changes: `npm run afrostream:media:audit`
- i18n changes: `npm run build:i18n:validate` and `npm run validate:hreflang`
- Car data changes: `npm run cars:catalog:refresh`
- Netlify/server code changes: `npm run security:scan`, `npm run build:deploy`, `npm run audit:dist`, plus targeted `node -c` or direct function smoke checks when available

## Deliverables

When you introduce a new workflow or recurring pattern:

- Add or update a doc in `docs/`
- Add or update a scoped rule in `.claude/rules/` if the pattern is file-specific
- Add or update a local skill in `.agents/skills/` if the workflow is reusable
