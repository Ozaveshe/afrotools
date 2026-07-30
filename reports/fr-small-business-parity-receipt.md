# French Small Business & SME parity receipt

Date: 2026-07-29

Foundation: `8ce5cac175e42201968b1f7540752d6acf92d4ca`

Branch: `codex/fr-small-business-sme-parity`

## Scope and acceptance

- Exact English denominator: 28 free Small Business & SME applications.
- Native French owners: 28/28.
- Native local calculation engine coverage: 28/28.
- Frozen English-oracle fixtures: 28/28.
- Browser workflows and parsed downloads: 28/28.
- Hub routes: 1/1.
- Canonical artwork: 28/28 present; 0 missing.
- French AI route ownership: 28/28.
- English/French reciprocal hreflang: 28/28 applications plus the category hub.
- Deleted files: 0.

The 26 former bridge/handoff pages were replaced by native French applications.
The two missing owners were created at `/fr/tools/tarification-couture/` and
`/fr/tools/revenus-youtube/`.

## Product contract

All 28 applications run locally in the browser and expose a visible French
input workflow, deterministic result, decision boundary, copy action and a
download. TXT, CSV and JSON downloads were reopened and parsed in browser
tests. The freelance contract workflow also exposes print/PDF.

No account, network calculation, analytics payload, or AI transfer is required
for calculation or export. The AfroTools AI link is explicit and voluntary,
and does not include entered values.

## Validation

- PASS: `node tests/fr-small-business-engine-parity.test.js` — 28/28 frozen fixtures.
- PASS: `node scripts/audit-fr-small-business-parity.js` — 28/28 routes; 0 missing artwork.
- PASS: Playwright on isolated port 43028 — 29/29 tests (hub plus 28 physical applications).
- PASS: 320px, 375px, 200% reflow, light mode, manual dark mode, system dark mode, keyboard focus, console checks.
- PASS: TXT/CSV/JSON download creation and parsing for all 28 routes.
- PASS: `npm run ai:french-routes:check` — exact 28/28 SME mappings in the generated runtime map.
- PASS: `npm run lint`.
- PASS: `npm run type-check`.
- PASS: `npm run audit` with the two pre-existing missing registry pages unchanged.
- PASS: `npm run check-links` — 126,206 internal links across 10,840 HTML files.
- PASS: `git diff --check`.
- PASS: `git diff --diff-filter=D --summary` — no deletions.
- GLOBAL CARRY: `npm run validate:hreflang` has two reciprocal warnings for the
  French and Swahili Small Business hubs because the Swahili hub does not
  declare the new French hub. The English/French relationship is reciprocal.
  The Swahili owner was not edited because this lane is strictly French.

## Generated and shared surfaces

- The broad locale coverage inventory, sitemaps, service-worker stamp and
  master ledger were not regenerated.
- The French AI route map was regenerated through its owner after adding a
  source-owned exact SME overlay. Its semantic change is two newly created
  routes; the remaining 26 were already mapped.
- English changes are limited to reciprocal French hreflang on the category
  hub and the two newly created French counterparts.
- No Supabase, Netlify, commit-to-main, push, PR, merge or deployment action was
  performed.
