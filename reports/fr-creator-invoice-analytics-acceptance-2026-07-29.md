# French CreatorInvoice and CreatorAnalytics acceptance

Date: 2026-07-29
Frozen English baseline: `data/localization/fr-creative-english-baseline.json`
Scope: exactly two Creative owners, handled serially.

## Acceptance

| Owner | English launcher/workspace | French launcher/workspace | Result |
| --- | --- | --- | --- |
| `creator-invoice` | `/tools/creator-invoice/`, `/tools/creator-invoice/app` | `/fr/tools/facture-createur/`, `/fr/tools/facture-createur/app` | Accepted |
| `creator-analytics` | `/tools/creator-analytics/`, `/tools/creator-analytics/app` | `/fr/tools/stats-createur/`, `/fr/tools/stats-createur/app` | Accepted |

Accepted: 2/2 owners and 8/8 physical surfaces.
Remaining in this scoped lane: 0.

## Product proof

- Both French launchers and workspaces are native French pages with no iframe bridge.
- Both English and French workspaces use the same DOM-free calculation engines.
- CreatorInvoice validates required document fields, calculates subtotal, tax, discount and total using cents-safe arithmetic, saves and loads one local draft, and exports parsed JSON, TXT and PDF.
- CreatorAnalytics validates post metrics, calculates the disclosed weighted engagement rate, ranks platforms and formats, saves/removes/clears local records, and exports parsed CSV and JSON.
- No invoice or analytics field values are sent to Supabase, AI, analytics, email, or another server.
- The English launchers were reconciled with the implemented products: unsupported claims about client management, quote conversion, payment tracking, heatmaps, growth goals and industry benchmarks were removed.

## Experience and search proof

- Chromium workflow proof passed at 320px and 375px.
- Chromium 200% reflow proof passed at an effective 320px width.
- Light and dark themes passed with keyboard focus and zero page errors.
- English/French canonicals and reciprocal hreflang relationships are present.
- French launchers are indexable; `/app` utility routes are `noindex,follow`.
- Existing artwork resolves for both owners.
- Existing French AI route mappings resolve the two English owners to the native French launchers.

## Validation

- PASS: `node --test tests/fr-creator-invoice-analytics-native.test.js` — 4/4.
- PASS: `npx playwright test tests/e2e/fr-creator-invoice-analytics-native.spec.js --workers=1 --reporter=line` — 5/5.
- PASS: invoice export parsing for EN and FR JSON, TXT and PDF.
- PASS: analytics export parsing for EN and FR CSV and JSON.
- PASS: JavaScript syntax checks for engines, controllers, generator and Playwright specification.
- PASS: `git diff --check`.
- PASS: `git diff --diff-filter=D --summary` — zero deleted files.

## Changed source

- `engines/src/creator-invoice-engine.js`
- `engines/src/creator-analytics-engine.js`
- `assets/js/pages/creative/creator-invoice-native.js`
- `assets/js/pages/creative/creator-analytics-native.js`
- `assets/css/creator-business-native.css`
- `scripts/build-fr-creative-invoice-analytics.js`
- `tools/creator-invoice/index.html`
- `tools/creator-invoice/app.html`
- `tools/creator-analytics/index.html`
- `tools/creator-analytics/app.html`
- `fr/tools/facture-createur/index.html`
- `fr/tools/facture-createur/app.html`
- `fr/tools/stats-createur/index.html`
- `fr/tools/stats-createur/app.html`
- `tests/fr-creator-invoice-analytics-native.test.js`
- `tests/e2e/fr-creator-invoice-analytics-native.spec.js`

Generated engine outputs were rebuilt narrowly:

- `engines/creator-invoice-engine.js`
- `engines/creator-analytics-engine.js`

No master ledger, sitemap, broad localization artifact, build, commit, push, PR, merge, deployment, or live Supabase action was performed.
