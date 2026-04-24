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
- If Search Console starts surfacing `.html` alternates, run `node scripts/fix-canonical-alias-links.js` to collapse internal hrefs onto each page's preferred route and `node scripts/update-html-canonical-redirects.js` to regenerate the 301 block for safe `.html` aliases
- Treat the file shape as the route source of truth: `foo/index.html` serves `/foo/`, while `foo.html` serves `/foo` with no trailing slash. Keep canonicals, hreflang, JSON-LD, sitemap entries, and injected internal links aligned to that served route rather than to a stale in-page canonical.
- Treat `widgets/iframe/` as embed utility surfaces: keep them `noindex, follow` and canonicalize them to the full tool route with `npm run seo:widgets`
- Treat thin tool workspace/query/detail subviews under `tools/` as utility surfaces: run `node scripts/fix-thin-tool-pages-seo.js` to set `noindex, follow` and canonicalize them back to `/tools/<tool>/`
- Keep `npm run seo` from self-canonicalizing `noindex` utility pages; those pages should keep the parent canonical assigned by the thin-page fixer.
- Keep `noindex` utility pages out of sitemap generation so auth, offline, app workspaces, and other thin utility routes do not leak into search-facing indexes
- For AfroKitchen static-route work, use the manifest-driven flow in order: `node scripts/export-afrokitchen-seo-manifest.js`, `node scripts/generate-afrokitchen-static-pages.js`, `node scripts/generate-sitemaps.js`, `npm run seo`, then `npm run seo:report`
- For Africa Conflict static-dossier work, use the live Supabase-backed manifest flow in order: `node scripts/export-africa-conflict-seo-manifest.js`, `node scripts/generate-africa-conflict-static-pages.js`, `node scripts/generate-sitemaps.js`, `npm run seo`, then `npm run seo:report`
- Treat `npm run seo` as the sitemap normalization pass after regeneration: it now normalizes generated sitemap files against each page's preferred canonical URL rather than relying on hand-edited XML cleanup
- Keep `scripts/generate-sitemaps.js` and `scripts/seo-daily-fix.js` aligned on stale `<lastmod>` handling so a fresh sitemap generation does not leave predictable report-only sitemap fixes.
- Keep generated deploy output such as `dist/` out of source SEO scans; regenerate it from source rather than letting sitemap or alias scripts discover `/dist/...` URLs.
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

### Swahili country-hub salary pass checklist

- Classify each target hub before editing:
  - strong salary-entry hub
  - lighter bridge hub
- Keep the hub order stable:
  - salary-first hero
  - local summary blocks already on the page
  - existing local tax tables
  - divider
  - `Mishahara Kwanza` or `Njia ya Mishahara`
  - `Zana za Mishahara na Ajira`
- Use local Sw PAYE as the first featured card only if the route is live and strong enough to feature
- If local salary depth is thin, bridge back to `sw/mshahara-na-kodi/` and `sw/tools/` instead of pretending the hub is deeper than it is
- If the paired English hub is in scope, add reciprocal `hreflang="sw"` there only for that paired page
- For real hub batches, run:
  - `npm run check-links`
  - `npm run audit`
  - `npm run build:i18n:validate`
  - `npm run validate:hreflang`
  - `npm run seo:report`
- In the summary, separate baseline repo debt from net-new issues on the touched hubs

### Release or regression review

- Use `afrotools-release-qa`
- Choose checks based on touched files rather than always running the whole repo

### Supabase task

- Use `afrotools-supabase-ops`
- Use the configured `supabase` MCP server first for live schema, SQL, logs, auth, storage, or types

### Scholarship platform task

- Read `docs/SCHOLARSHIP-PIPELINE.md`
- Keep scholarship source freshness, save state, and reminder logic aligned across:
  - `assets/js/education-scholarship-feed.js`
  - `tools/scholarship-finder/`
  - `tools/education-hub/`
  - `netlify/functions/_shared/scholarship-platform.js`
- Keep live project actions and repo edits separate in notes and summaries

## Automation Operating Model

- Keep the active production automation set focused on the highest-value AfroTools loops:
  - `AM Content Batch`
  - `PM Content Batch`
  - `SEO Guardrail Sweep`
  - `Live Data Freshness Watch`
  - `Release Safety Sweep`
- Prefer `worktree` execution for recurring repo jobs so runs stay isolated from the main checkout.
- For content-batch automations on Windows, keep the Supabase MCP config in global Codex config so clean worktrees can see it.
- If a fallback secret appears missing during a Windows worktree run, check the Windows user environment store before concluding the live publish path is blocked.
- If you change Supabase MCP URL query parameters such as `read_only=true`, restart Codex before expecting the current session's MCP tools to use the new mode.

## Decision Rules

- If the task affects many similar files, prefer a script.
- If the task changes project behavior in a recurring way, add or update a local skill.
- If the task is file-pattern specific, add or update a scoped rule in `.claude/rules/`.
- If the task changes how humans or agents should operate, update `AGENTS.md` or a doc in `docs/`.
