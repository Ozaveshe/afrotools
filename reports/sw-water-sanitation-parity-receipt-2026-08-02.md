# Swahili Engineering water and sanitation parity receipt

- Reviewed: 2026-08-03
- Coordinator base: `0f6990118d9ac8b9dcde446a6ede10a017b9a2db`
- Exact family scope: 2 Engineering owners
- Candidate ACCEPT: 2
- Candidate BLOCK: 0
- Central acceptance recorded: no; the shared ledger and AI route map remain coordinator-owned and were not edited
- Deployment state: local candidate only; no push, merge, build artifact or deploy

This is the clean-main reflow-repair respin for original candidate `9bbc1ff5ebe9a0a2291900c65537c4284681becf` and repair `db0da9db986ea36ebe9e2dce741703be64e8f0be`; neither stale branch is used as an integration base. The verifier's deterministic 19px overflow on `plumbing-material` at 375px with a true 200% root font reproduced before repair. The maintained family CSS now permits the source-evidence grid and its unbroken engine path to shrink and wrap. The scoped browser assertion also reports every overflowing element and fails unless that list is empty.

## Exact candidate decisions

| Decision | Tool ID | English owner | Native Swahili route | Maintained DOM-free engine |
| --- | --- | --- | --- | --- |
| ACCEPT | `septic-tank` | `/tools/septic-tank/` | `/sw/zana/ukubwa-wa-septic-tank/` | `engines/src/septic-tank-engine.js` |
| ACCEPT | `plumbing-material` | `/tools/plumbing-material/` | `/sw/zana/vifaa-vya-mabomba/` | `engines/src/plumbing-material-engine.js` |

No other Engineering, Energy, Climate or Mining row is adjudicated by this receipt. The other 24 Engineering rows, 13 Climate rows and 17 remaining Energy rows remain outside this family receipt, not implicitly blocked or accepted. The independently accepted Mining six and Energy exact-three are excluded.

## Product and workflow proof

- Each route is a native Kiswahili product surface generated from `data/localization/sw-water-sanitation-parity-manifest.json`; neither route uses an iframe, English application shell, formula copy or bridge route.
- `septic-tank` preserves country, occupants, building type, toilets, soil, tank material and soakaway choices, then renders volume, dimensions, chambers, construction/soakaway cost and annual desludging planning output.
- `plumbing-material` preserves country, building type, pipe material, bathrooms, tank size/choice and labour choice, then renders totals plus the complete six-row engine BOM: pipe, fittings, sanitaryware, connection, tank and labour.
- Exact primary and boundary oracles use the public owner engines. Every numeric result is finite. Raw DOM values and JSON retain engine precision; display rounding never replaces exported raw values.
- Changing any input immediately removes the old result and disables copy, JSON and TXT. Invalid calculation remains fail-closed. JSON restore uses its inputs to run the current engine again rather than trusting stored results.
- Copy was read back and parsed through both `navigator.clipboard` and the forced local textarea/`execCommand` fallback. JSON and TXT downloads were reopened and parsed. The plumbing JSON retained raw engine unit tokens; visible UI, copied text and TXT translated them to `m`, `vipande`, `seti`, `kimoja` and `siku`.

## Source, freshness and planning boundary

- Both engines last changed in repository commit `ba2589068db44d22a85a93576cf228eb0ee75948` on 2026-07-30. This is file history, explicitly not market-price freshness.
- Country rates are static planning assumptions. The pages label the calculations as planning estimates, not current or official prices, BOQs, designs, health approvals, pressure certificates or guaranteed supplier quotes.
- Procurement confidence is visibly low. Users are told to confirm design, geology/soil conditions, health and building rules, quantities and current supplier quotes locally.
- The English septic owner exposes a `block` material choice that the maintained engine rejects. The Kiswahili route exposes only the engine-supported `concrete` and `plastic` choices so it cannot promise a non-working result; repairing that English-owner mismatch is outside this source-owned locale candidate.

## Export, privacy and AI boundary

- Browser proof recorded zero write requests, zero changed storage keys, zero local resource failures, zero page errors and zero console errors.
- Inputs, calculation, copy, download and JSON restore remain local. No user-entered value is sent to AI or another network destination.
- AI controls start disabled and require explicit consent. Candidate links are `/sw/ai/?tool=septic-tank` and `/sw/ai/?tool=plumbing-material`; the scoped test proves those IDs and routes only. The coordinator-owned central route map was not edited.

## Accessibility, reflow and theme proof

Both routes passed keyboard calculation and result focus, visible labels/accessibility names, 44px targets (24px checkbox glyph inside a 48px labelled target), no horizontal overflow at 320px or 375px, 200% text reflow, reduced motion, light, dark, system-light and system-dark.

Exact repaired reflow measurements were **0px overflow and 0 overflowing elements** for both routes at 320px/100%, 320px/200%, 375px/100% and 375px/200%. This includes the previously failing plumbing source-evidence path.

Computed minima across every route and all four theme states:

| Measure | Minimum | Required |
| --- | ---: | ---: |
| Control boundary vs control and surrounding surfaces | 3.476:1 | 3:1 |
| Keyboard `:focus-visible` outline vs surrounding surface | 3.200:1 | 3:1 |
| Control text | 15.810:1 | 4.5:1 |
| Normal text, including hero eyebrow/body against both gradient endpoints | 4.759:1 | 4.5:1 |
| Large hero heading against both gradient endpoints | 5.408:1 | 3:1 |

Every tested field was reached with Shift+Tab/Tab keyboard modality and retained a 3px focus outline with a 2px offset.

## SEO, route and artwork proof

- Both Swahili routes are self-canonical and have matching OG metadata, truthful existing artwork dimensions, `WebApplication`, `FAQPage` and native `BreadcrumbList` schema.
- English, French, Swahili and x-default alternates are declared. English and French source owners reciprocate both Swahili routes.
- Full hreflang validation passed: 11,127 public pages, 32,466 relationships and 5,340 equivalence groups.
- Link validation passed: 136,947 internal links across 11,346 HTML files with no broken internal links.
- Both maintained images loaded at their declared natural dimensions; no artwork generation is queued.

## Commands and results

- PASS — `node --test tests/sw-water-sanitation-parity.test.js` — 7/7 before commit and again at the exact candidate SHA
- PASS — `npx playwright test tests/e2e/sw-water-sanitation-parity.spec.js --config=playwright.sw-water-sanitation.config.js --project=chromium --workers=1` — 2/2 with eight explicit viewport/root-text combinations at 0px overflow
- PASS — `node scripts/generate-sw-water-sanitation-parity.js --check` — 2/2 generated routes current
- PASS — `node scripts/build-french-engineering-parity.js --ids=plumbing-material,septic-tank` — 0 source-owner changes required
- PASS — `npm run validate:hreflang`
- PASS — `npm run check-links`
- PASS — `node scripts/build-i18n.js --validate` — French, Swahili, Yoruba and Hausa keys match English
- PASS — `npm run audit` — both scoped routes resolve; two unrelated carried registry rows remain missing
- EXPECTED EXCLUDED DRIFT — `npm run build:i18n:validate` stops on coordinator-owned stale localization coverage artifacts.
- EXPECTED EXCLUDED DRIFT — `npm run test:localization` differs by exactly the new plumbing route in raw, localized-shell, indexable and sitemap counts because those central artifacts are prohibited here.
- EXPECTED EXCLUDED DRIFT — `npm run sw:parity:check` reports the central Swahili inventory stale; this candidate does not record its own acceptance.
- EXPECTED EXCLUDED DRIFT — `npm run test:sw-surface` reports coordinator-owned generated Swahili surfaces stale; broad regeneration is prohibited.

## Carried integration risk

The product routes, reciprocal metadata and direct local workflows are proven. Discovery counts, the shared Swahili tool surface, the central acceptance ledger and shared AI route map remain intentionally stale until the coordinator reviews and integrates this candidate. This receipt is therefore a route-family ACCEPT candidate, not release or deployment proof.
