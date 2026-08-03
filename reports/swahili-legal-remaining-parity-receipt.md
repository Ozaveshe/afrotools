# Swahili Legal remaining parity receipt

Date: 2026-08-03

Baseline: `0f6990118d9ac8b9dcde446a6ede10a017b9a2db`

Owner: `scripts/build-sw-legal-remaining-parity.js`

## Fail-closed result

- Legal inventory: 66 English free apps.
- Previously accepted: 15.
- Exact remaining scope: 51.
- Accepted in this lane: 51/51.
- Blocked: 0.
- Category hub: 1/1 accepted and counted separately.

Every accepted route is a native Swahili owner without an English iframe or fetched English UI. Each route executes the maintained English-owner contract, and the generator proves a second valid input fixture produces a different result before it may write the page.

## Product proof

- All 51 app routes passed one-worker Chromium proof at alternating 320px and 375px widths, 200% reflow, dark and light themes, keyboard focus, serious/critical axe checks, local resource/console checks and no user-data network mutations.
- Every route passed an invalid-state reset, valid calculation, input-dependent result, JSON parse and reopen, TXT parse, PDF parse, clipboard readback and print invocation.
- The complete app run passed 51/51. The separately counted hub then failed only a 6px mobile overflow gate; its link-card flow was repaired and the focused hub rerun passed 1/1.
- Business Registration and TIN passed an additional 2/2 browser rerun after their existing Yoruba hreflang equivalents were restored to the generated Swahili metadata.
- All 51 canonical artwork files are present and resolved; the missing-artwork queue is empty.

## Source, privacy and search boundaries

- Each route shows its English-owner source reference, or an explicit unavailable-source state, plus checked date where known, confidence limits and a planning-only legal disclaimer.
- Inputs, calculations, imports and exports stay in the browser. There is no account gate, AI call or user-data network send.
- Canonical, OG, schema, self-Swahili, English and French relationships are present. The two existing Yoruba equivalents are preserved for Business Registration and TIN.

## Validation

- `node --test tests/swahili-legal-remaining-parity.test.js tests/swahili-legal-government-insurance-parity.test.js` — 20/20 passed.
- `node scripts/build-sw-legal-remaining-parity.js --check` — 51/51, hub separate, zero drift.
- `npm run build:i18n:validate` — passed.
- `npm run validate:hreflang` — passed after the two exact Yoruba relationships were restored.
- `npm run check-links` — no broken links across 136,386 internal links and 11,345 HTML files.
- `npm run lint` and `npm run type-check` — passed.
- `git diff --check` — passed.
- Deleted files — zero.

No central acceptance ledger, Swahili AI route map, master inventory, broad localization coverage artifact, sitemap, `dist`, push, PR, merge or deploy action belongs to this lane.
