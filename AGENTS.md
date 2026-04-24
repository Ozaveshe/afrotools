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
- `npm test` - link check plus tool audit
- `npm run check-links` - broken links and routing smoke check
- `npm run audit` - tool audit
- `npm run seo` - SEO daily fix pass
- `npm run seo:report` - SEO report mode
- `npm run seo:priority` - rebuild SEO system
- `npm run seo:og` - apply OG fallback metadata
- `npm run seo:links` - repair SEO alias and internal-link issues
- `npm run seo:widgets` - normalize widget iframe SEO metadata
- `npm run build:i18n -- --all` - regenerate translations
- `npm run build:i18n:dry-run` - preview i18n changes without writing output
- `npm run build:i18n:validate` - validate i18n output
- `npm run build:i18n:full` - rebuild i18n output and validate hreflang
- `npm run validate:hreflang` - hreflang validation
- `npm run cars:catalog:refresh` - validate and rebuild car catalog data
- `npm run inventory:site` - rebuild the site inventory snapshot
- `npm run agriculture:taxonomy` - regenerate the agriculture taxonomy report

## Edit Strategy

- Prefer source files over generated outputs.
- Prefer scripts for bulk edits across many pages.
- Keep new workflow knowledge in docs and local skills so future agents inherit it.
- When changing registry, SEO, i18n, build, or Netlify behavior, update the matching playbook or rule.

## High-Risk Zones

- `assets/js/components/tool-registry.js`
- `_redirects`
- `_headers`
- `netlify/functions/`
- `scripts/build-*.js`
- `scripts/generate-*.js`
- `sitemap*.xml`
- `assets/js/bundles/`
- `*.min.js`

Do not hand-edit generated files unless the source is missing or the task explicitly calls for a direct patch.

## Workflow Expectations

### Tool and page work

- If adding or changing a tool, review `docs/ADDING-A-TOOL.md`.
- If adding or changing a country surface, review `docs/ADDING-A-COUNTRY.md`.
- If registry entries change, validate links and audit tool metadata.

### Design and UI work

- Start from `assets/css/design-system.css`, `style-guide.html`, and `docs/design-doctrine.md`.
- Reuse repo tokens, type, spacing, radii, shadows, and motion rules before inventing new ones.
- Prefer stronger composition and hierarchy over piling on more cards or controls.

### SEO work

- Use existing SEO scripts before writing a new fixer.
- Do not manually edit sitemap files as a first choice.
- If canonical, OG, internal linking, alias, or widget iframe behavior changes, run the relevant SEO scripts such as `npm run seo:og`, `npm run seo:links`, or `npm run seo:widgets` and record the workflow in docs if it is new.

### i18n work

- Treat translated pages as build outputs unless the task is a targeted manual fix.
- Validate hreflang after non-trivial translation changes.

### Supabase work

- Use the configured `supabase` MCP server first whenever a task needs live project access, schema inspection, SQL execution, logs, storage, auth, or generated types.
- Keep repo edits and live project actions conceptually separate in your notes and summaries.

## Preferred Validation

- HTML or content changes: `npm test`
- Registry or navigation changes: `npm run check-links` and `npm run audit`
- SEO changes: `npm run seo:report` or the narrower script that matches the change
- i18n changes: `npm run build:i18n:validate` and `npm run validate:hreflang`
- Car data changes: `npm run cars:catalog:refresh`
- Inventory or taxonomy changes: rerun the matching generator command and inspect the resulting report or snapshot
- Netlify/server code changes: targeted `node -c` or direct function smoke checks when available

## Deliverables

When you introduce a new workflow or recurring pattern:

- Add or update a doc in `docs/`
- Add or update a scoped rule in `.claude/rules/` if the pattern is file-specific
- Add or update a local skill in `.agents/skills/` if the workflow is reusable
