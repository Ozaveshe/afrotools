# Known Traps

## Generated Files

- Do not treat `sitemap*.xml` as hand-authored.
- `scripts/generate-sitemaps.js` preserves existing sitemap `<lastmod>` values by default so CI checkout mtimes do not create generated-output drift. Set `AFROTOOLS_REFRESH_SITEMAP_LASTMOD=1` only when intentionally restamping sitemap dates.
- Do not patch minified bundles first if the source file exists.
- Treat many translated pages as outputs of the i18n flow, not canonical sources.
- Use `npm run build:i18n:full` for hreflang proof. Raw `npm run build:i18n -- --all` can leave reciprocal tags incomplete until `scripts/fix-hreflang-reciprocity.js` runs.
- On Windows, bulk i18n writes can hit transient `UNKNOWN`/`EBUSY`/`EPERM` locks; keep retry-safe writes in build scripts that touch hundreds of HTML files.

## Registry Coupling

- `assets/js/components/tool-registry.js` affects discovery, cards, counts, sitemaps, and internal linking.
- Small registry mistakes can surface as routing, SEO, and UI bugs at the same time.

## Static Site Assumptions

- The product is static-first, but the repo is not edit-only. Several scripts mutate outputs during build and maintenance.
- "No framework" does not mean "no generated layer."
- Do not publish the repo root. Netlify must publish the clean `dist/` artifact so source files, prompts, migrations, functions, tests, and agent configuration cannot become static assets.
- Public Supabase anon keys may appear in browser code; service-role keys must never appear outside Netlify/Supabase secret stores.

## Mission Control Split

- `afrotools-mission-control.html` is the Codex cockpit and workflow launcher.
- `mc-7a2f9x.html` is the legacy internal operations dashboard.

## SEO Footguns

- Avoid manual mass edits when a script already exists.
- Re-run validation after canonical, OG, internal link, or alias changes.
- Hausa and Yoruba are route-first language surfaces with dedicated generated
  sitemaps. Keep `/ha/` and `/yo/` out of `sitemap-misc.xml`; the root
  `/jamb/` tree has its own sitemap, but nested language routes such as
  `/ha/jamb/` are public content and must be included in the language sitemap.

## Supabase Footguns

- Use the configured `supabase` MCP server first for live operations.
- Keep live data actions separate from repo edits in notes and summaries.
- New Supabase-backed features need both a replayable repo migration and a live-project check against Supabase advisors.
