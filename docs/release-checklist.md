# Release Checklist

## Choose Checks By Change Type

### Content or page-only changes

- `npm run check-links`

### Registry, navigation, cards, or discovery changes

- `npm run check-links`
- `npm run audit`

### SEO or metadata changes

- `npm run seo:report`
- Run the narrower SEO script that matches the change if needed

### i18n changes

- `npm run build:i18n:validate`
- `npm run validate:hreflang`

### Car catalog or pricing data changes

- `npm run cars:catalog:refresh`

### Full rebuild or shared asset changes

- `npm run build`
- `npm run build:deploy`
- `npm test`

### Netlify, redirects, functions, or publish-surface changes

- `npm run security:scan`
- `npm run build:deploy`
- `npm run audit:dist`
- Confirm `dist/` does not contain repo internals such as `package.json`, `AGENTS.md`, `netlify/`, `scripts/`, `supabase/`, `tests/`, `docs/`, `.codex/`, or `.agents/`.
- Confirm production, deploy-preview, branch-deploy, and staging contexts all run the real build.

## Manual Review

- Confirm the touched route renders cleanly.
- Confirm there are no accidental edits to generated files.
- Confirm docs or skills were updated if the workflow changed.
- Confirm any legacy dashboard or cockpit links still point to valid targets.

## Release Standards

- Netlify must publish `dist/`, never the repo root.
- `netlify/functions` must stay outside the publish directory.
- Build failures must fail deploys; best-effort post-build jobs must be scoped so they cannot mask a failed build.
- CI link, registry, i18n, hreflang, and deploy-artifact checks should block merges once the current known failures are cleared.
- Security scans and deploy-artifact audits block CI.
