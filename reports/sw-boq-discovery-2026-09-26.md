# Swahili BOQ discovery repair — 2026-09-26

## Problem and change

The search-visible `/sw/zana/mjenzi-boq/` page is a quick subtotal/contingency/VAT calculator, yet its metadata and registry description advertised line-item editing. Its full-app link opened English even though the established native app exists at `/sw/zana/orodha-vifaa/`.

The full-app CTA now opens that native Swahili route. The authored page descriptions, schema description and registry row describe the actual quick calculator and explain where to add items and export. Touched form labels now use native Swahili instead of Subtotal/Currency. The quick calculator, both canonical routes, existing English source-reference link and native BOQ implementation remain intact. No new app, redirect or canonical consolidation was introduced.

## Owners and generated outputs

- Source owners: `sw/zana/mjenzi-boq/index.html` (authored quick form, inline calculation and copy) and `assets/js/components/tool-registry.js` (discovery row `zana-mjenzi-boq-sw`). Targeted script/path searches found no active generator for this legacy shell. The unrelated architectural-fee generator only replaces its own page.
- Existing native app ownership remains `scripts/lib/sw-boq-builder-contract.js` → `sw/zana/orodha-vifaa/index.html`, validated by `scripts/build-sw-boq-builder-parity.js`; its engine is unchanged.
- Regenerated only affected outputs: tool-registry.min.js, related-tools-data.js/min.js, canonical-registry.json and search-index-full.json. Each generated/source registry diff changes only this description. Catalog counts and the slim search index remain unchanged.
- Base: freshly verified origin/main `22c93812c1c97a2645260cd96fe7f52c08577fa9`. Separate branch/worktree `codex/sw-boq-discovery-20260926`; preserved coordinator and earlier evidence trees.

## Validation

- PASS: canonical registry `--check` before edits, `--write` after owner edits (one generated registry file), then `--check`; 3,698 tool rows / 3,690 canonical published tools / 223 widgets, 108 count markers unchanged.
- PASS: focused owner regeneration: `node scripts/minify.js --only=components/tool-registry.js`, `node scripts/build-search-index.js`, `node scripts/build-related-tools-data.js`.
- PASS: `node scripts/build-sw-boq-builder-parity.js`.
- PASS: `node --test tests/swahili-boq-builder-parity.test.js` — 5/5. Initial sandbox attempt could not spawn Node test workers (EPERM); the authorized escalated retry passed.
- PASS: `node tests/canonical-registry.test.js`.
- PASS: `npm run check-links` — 141,939 internal links across 11,809 HTML files; none broken.
- PASS: `git diff --check`; no deleted files.
- PASS: `tests/e2e/sw-boq-discovery.spec.js` — 2/2 Chromium cases in21.1 seconds, private port4528 config `../sw-boq-discovery.config.cjs`, results `../evidence/sw-boq-discovery-results`. Canonical dependency installation used read-only; no dependency installation or canonical checkout edits.

Browser evidence exercises the real CTA from old page to native app, checks both existing canonical identities and Swahili labels, and enters a native line with quantity1 and markup0. At320px, both pages have no horizontal document overflow and no page errors. Synthetic examples:

| Subtotal | Contingency | VAT | Quick result / native total / actual JSON and CSV |
|---|---|---|---|
| KES250,000 | 10% | 16% | KES319,000 |
| KES0 | 10% | 16% | KES0 |

Both downloaded JSON and CSV were read independently and checked for totals and the synthetic item; CSV headings are native Swahili. No uploads, account gate or external-data request was needed for the workflow.

## Limits / integration

This is the third bounded batch, separate from the coordinator release and preceding recommendation/PDF Repair work. No full build, deployment or production/search-performance claim. No analytics, pricing data, Pro behavior, arithmetic engine or export implementation changed. The CTA does not introduce automatic input transfer: users enter their item values in the established native app. Existing PDF export was not retested because this repair changes discovery/copy only; actual JSON and CSV exports were verified.

Rollback: revert this candidate. Future canonical/redirect consolidation remains a separate decision; both current routes are preserved.
