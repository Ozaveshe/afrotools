# Codex Playbook

## Default Loop

1. Read `AGENTS.md`.
2. Identify whether the task is page work, registry work, SEO, i18n, Netlify, cars data, or Supabase.
3. Read the matching doc or local skill before editing.
4. Prefer existing scripts to manual batch edits.
5. Run the narrowest validation that proves the change.
6. Update docs, rules, or skills if you created a new repeatable pattern.

## Design Work

- Start with `docs/design-doctrine.md`.
- Reuse `assets/css/design-system.css` and `style-guide.html` before inventing a new UI language.
- Treat typography, token use, spacing, and motion as part of the source of truth, not as polish added at the end.

## Task Routing

### Add or repair a tool page

- Read `docs/ADDING-A-TOOL.md`
- Inspect the target page plus `assets/js/components/tool-registry.js`
- Update source files, not minified bundles
- Run `npm run check-links` and `npm run audit`

### Add or repair a country surface

- Read `docs/ADDING-A-COUNTRY.md`
- Verify registry coverage for the country
- Check related country hub and tax or utility pages
- Validate routing and any engine changes

### SEO sweep or metadata issue

- Use `afrotools-seo-ops`
- Start with existing scripts in `scripts/seo-*.js`, `scripts/build-seo-system.js`, `scripts/apply-og-fallbacks.js`, and `scripts/inject-internal-links.js`
- Avoid hand-editing sitemap files

### Blog or creator news publishing

- Use `afrotools-content-publishing`
- Read `docs/CONTENT-PUBLISHING-WORKFLOW.md`
- Treat `/blog/` as static repo-backed content
- Treat AfroStream news as a live Supabase-backed publishing surface
- Use the configured `supabase` MCP server first for AfroStream news publishing or inspection
- Run the narrowest validation for the surface you touched

### Translation or hreflang issue

- Use the i18n rule
- For French-market rollout or French SEO batching, use `afrotools-french-localization-coordinator` and read `docs/FRENCH-LOCALIZATION-STRATEGY.md`
- For Swahili-market rollout or Swahili SEO batching, use `afrotools-swahili-localization-coordinator` and read `docs/SWAHILI-LOCALIZATION-STRATEGY.md`
- Treat translated outputs as generated unless the task is explicitly a manual patch
- Treat Swahili as a selectively generated or hand-authored surface; do not assume `lang/sw.json` alone is enough for high-value page quality
- If a stale translated page is only a wrapper or thin output, use `node scripts/build-i18n.js --lang fr --page <source-page> --overwrite-existing` to rebuild that specific page from the English source before hand-patching
- After rebuilding a French PAYE page from English source, run `node scripts/polish-fr-paye-batch.js` for the visible and runtime French copy layer, then `node scripts/polish-fr-paye-seo.js` to inject the French SEO/schema bundle on the currently targeted pages
- Run `npm run build:i18n:validate` and `npm run validate:hreflang`

### Release or regression review

- Use `afrotools-release-qa`
- Choose checks based on touched files rather than always running the whole repo

### Supabase task

- Use `afrotools-supabase-ops`
- Use the configured `supabase` MCP server first for live schema, SQL, logs, auth, storage, or types

## Decision Rules

- If the task affects many similar files, prefer a script.
- If the task changes project behavior in a recurring way, add or update a local skill.
- If the task is file-pattern specific, add or update a scoped rule in `.claude/rules/`.
- If the task changes how humans or agents should operate, update `AGENTS.md` or a doc in `docs/`.
