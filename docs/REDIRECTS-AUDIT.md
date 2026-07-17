# Redirects Audit - 2026-05-13

## Scope

Reviewed `_redirects` while repairing Pro, API, SEO, and i18n close-out blockers.

## Changes

- Added `/api/v1/tax/*` route coverage to the tax API so clean API paths reach `api-tax`.
- Added `/fr/tools/currency-converter` and `/fr/tools/currency-converter/` as 301 aliases to `/fr/tools/convertisseur-devises/`.
- Confirmed the stale `scheduled-fetch-crypto-p2p` schedule reported in the prompt is not present in `netlify.toml`.

## Current Release Behavior

- Netlify publish target is `dist/` globally.
- Deploy preview, branch deploy, and staging contexts inherit the same publish target and run `npm run build:deploy`.
- `npm run audit:dist` and `npm run security:scan` are the required proof gates for redirect or publish-surface changes.

## Follow-Up

The redirect file is large and generated blocks should continue to be managed through `scripts/update-html-canonical-redirects.js` and `scripts/fix-canonical-alias-links.js`.
