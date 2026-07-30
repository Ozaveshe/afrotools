# French Religious & Cultural 22-route parity receipt

Date: 2026-07-29

Scope: the exact 22 canonical English Religious & Cultural app owners and their
preferred French counterparts.

State: **22/22 accepted locally in this isolated worktree; not pushed, merged,
deployed, or recorded in the master free-app ledger.**

## Denominator

| Measure | Count | Owner |
| --- | ---: | --- |
| Canonical live/new English registry apps | 22 | `assets/js/components/tool-registry.js` plus `tests/support/day10-category-inventory.js` |
| Preferred French registry owners | 22 | Exact `sourceId` + `href` pairs in `assets/js/components/tool-registry.js` |
| Physical preferred French app routes | 22 | `fr/tools/**/index.html` |
| Native French hub links | 22 | `/fr/religion-culture/` |
| AI English-to-French route mappings | 22 | `scripts/lib/french-ai-route-map.js` output from locale coverage |
| Unique dedicated artwork paths | 22 | `data/localization/fr-religious-cultural-parity.json` |
| Expanded French Lobola country routes outside this denominator | 4 | Registry expansion rows; not counted as canonical app owners |

The exact manifest and frozen fixtures live in
`data/localization/fr-religious-cultural-parity.json`. The manifest is the
source for the 22 generated native pages and the native French hub.

## Per-route acceptance

| # | English owner | Preferred French owner | Frozen local oracle | Authority boundary | Browser/export proof | Status |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | `/tools/tithe-calculator/` | `/fr/tools/calculateur-dime/` | 1,000 × 10% + 50 + 120/6 = 170; remainder 430 | No prescribed rate, doctrine, blessing, prosperity, beneficiary, or tax result | 320px; keyboard; invalid clear; dark; 200%; JSON reopened | Accepted |
| 2 | `/tools/lobola-calculator/` | `/fr/tools/calculateur-lobola/` | (1,000 + 100 + 50) × 1.10 = 1,265 | Editable family envelope, never an official tariff or universal custom | 375px; keyboard; invalid clear; dark; 200%; JSON reopened | Accepted |
| 3 | `/tools/lobola-negotiation-checklist/` | `/fr/tools/checklist-negociation-dot/` | Family A, Family B, pending question, and next step preserved | No mandatory custom or cultural authority | 320px; keyboard; invalid clear; dark; 200%; JSON reopened | Accepted |
| 4 | `/tools/lobola-gift-list/` | `/fr/tools/liste-cadeaux-dot/` | Three editable rows total 123 | User list, never an official requirement | 375px; keyboard; invalid clear; dark; 200%; JSON reopened | Accepted |
| 5 | `/tools/african-proverbs/` | `/fr/tools/generateur-proverbes-africains/` | Swahili reference returns `Haraka haraka haina baraka` | Attribution, spelling, translation, and context remain unverified | 320px; keyboard; invalid clear; dark; 200%; JSON reopened | Accepted |
| 6 | `/tools/zakat-calculator/` | `/fr/tools/calculateur-zakat/` | 1,000,000 assets, 595,000 silver nisab, 25,000 estimate | Limited arithmetic; scholar review required for eligibility and edge cases | 375px; keyboard; invalid clear; dark; 200%; JSON reopened | Accepted |
| 7 | `/tools/prayer-times/` | `/fr/tools/horaires-priere-qibla/` | Nairobi preset returns Fajr 05:18 and Qibla 7° | Static comparison sample, not an official mosque timetable | 320px; keyboard; invalid clear; dark; 200%; JSON reopened | Accepted |
| 8 | `/tools/ramadan-timetable/` | `/fr/tools/calendrier-ramadan/` | Fajr 05:10 less 10 minutes = 05:00; iftar 18:52 | Draft only; moon sighting and local timetable control | 375px; keyboard; invalid clear; dark; 200%; JSON reopened | Accepted |
| 9 | `/tools/faraid-inheritance/` | `/fr/tools/heritage-islamique-faraid/` | 1,200,000 limited wife/son/daughter case: 150,000 / 700,000 / 350,000 | Incomplete model; qualified scholar and jurist review required | 320px; keyboard; invalid clear; dark; 200%; JSON reopened | Accepted |
| 10 | `/tools/hajj-budget/` | `/fr/tools/budget-hajj-umrah/` | User quotes plus 10% margin total 7,942 | No operator quote, visa, booking, availability, or official approval | 375px; keyboard; invalid clear; dark; 200%; JSON reopened | Accepted |
| 11 | `/tools/islamic-finance/` | `/fr/tools/finance-islamique-profit/` | 1,000 price, 200 deposit, 10% margin: 88 monthly, 1,080 total | Comparison only; no fatwa, Sharia approval, offer, or recommendation | 320px; keyboard; invalid clear; dark; 200%; JSON reopened | Accepted |
| 12 | `/tools/wedding-budget/` | `/fr/tools/budget-mariage-africain/` | 100 guests × 1,000 food = 100,000 | User/vendor quotes; no universal ceremony assumptions | 375px; keyboard; invalid clear; dark; 200%; JSON reopened | Accepted |
| 13 | `/tools/naming-ceremony/` | `/fr/tools/budget-ceremonie-nommage/` | 10 guests × 100 food = 1,000 | No prescribed aqiqah, church, Yoruba, Igbo, or Akan practice | 320px; keyboard; invalid clear; dark; 200%; JSON reopened | Accepted |
| 14 | `/tools/funeral-cost/` | `/fr/tools/planification-funerailles/` | 10 attendees × 100 food = 1,000, separated from fixed costs | Planning only; no legal, religious, cultural, or official fee claim | 375px; keyboard; invalid clear; dark; 200%; JSON reopened | Accepted |
| 15 | `/tools/baby-name-generator/` | `/fr/tools/generateur-prenom-africain/` | Candidate, reported meaning, community, and reviewer remain intact | Does not invent, authenticate, gender, spell, or recommend a name | 320px; keyboard; invalid clear; dark; 200%; JSON reopened | Accepted |
| 16 | `/tools/traditional-calendar/` | `/fr/tools/calendrier-traditionnel/` | Same reference date and cycle index returns Eke | User-anchored estimate, never an official civil, palace, market, church, or religious date | 375px; keyboard; invalid clear; dark; 200%; JSON reopened | Accepted |
| 17 | `/tools/age-calculator-african/` | `/fr/tools/calculateur-age-jour-nom/` | 2000-01-01 to 2026-01-01 = 26 years, Saturday, Ama suggestion | Day-name is a cultural suggestion, not official identity advice | 320px; keyboard; invalid clear; dark; 200%; JSON reopened | Accepted |
| 18 | `/tools/festival-calendar/` | `/fr/tools/calendrier-festivals-culturels/` | Provisional date and organiser produce an exact-date confirmation action | No live date, access, sacred rule, filming permission, or travel availability | 375px; keyboard; invalid clear; dark; 200%; JSON reopened | Accepted |
| 19 | `/tools/aso-ebi-cost/` | `/fr/tools/cout-aso-ebi/` | 2 × (3 × 100 + 50 + 25), less 10% = 675 | User-entered quotes; no live price, fit, delivery, or cultural guarantee | 320px; keyboard; invalid clear; dark; 200%; JSON reopened | Accepted |
| 20 | `/tools/traditional-attire/` | `/fr/tools/cout-tenue-traditionnelle/` | 2 × (100 fabric + 50 tailoring) = 300 | No prescribed style, gender, quantity, fabric, price, or delivery date | 375px; keyboard; invalid clear; dark; 200%; JSON reopened | Accepted |
| 21 | `/tools/halal-compliance/` | `/fr/tools/conformite-halal/` | Five unknown answers = 0 documented and 5 follow-ups | Documentation readiness only; no certification, halal status, fatwa, certifier, fee, or timeline | 320px; keyboard; invalid clear; dark; 200%; JSON reopened | Accepted |
| 22 | `/tools/islamic-calendar/` | `/fr/tools/convertisseur-calendrier-islamique/` | 2026-01-01 returns a deterministic tabular estimate and explicit boundary | No official moon sighting or observance date | 375px; keyboard; invalid clear; dark; 200%; JSON reopened | Accepted |

## Product and privacy contract

- All 22 routes use `assets/js/engines/religious-cultural-parity.js`, a DOM-free
  deterministic engine, through
  `assets/js/pages/fr-religious-cultural-parity.js`.
- All labels, validation, status, result labels, methods, source notes,
  confidence notes, privacy copy, and action labels are native French.
- No route contains an iframe, English calculator bridge, account gate, lead
  capture, network calculation, AI request, storage write, or analytics event
  carrying user input.
- Every route declares deterministic-local AI mode and requires consent before
  any hypothetical network send. The local engine remains the fallback.
- Every app route has self-canonical, `fr`, `en`, `x-default`, and every
  existing reciprocal launched-locale alternate, plus French
  `WebApplication` schema, French OG metadata, and dedicated artwork.
- The 22 English app counterparts link reciprocally to their preferred French
  owners. The new French hub stays self-referential only because forming a
  three-language hub clique would require an out-of-scope Swahili edit.

## Proof recorded

- `node tests/french-religious-cultural-parity.test.js` — exact denominator,
  registry, filesystem, AI route, fixture, metadata, reciprocal hreflang,
  artwork, no-iframe, and generator check: pass.
- `npx playwright test tests/e2e/french-religious-cultural-parity.spec.js --project=chromium --workers=1`
  on isolated port 49341 — 23/23 pass in 2.6 minutes.
- Browser proof covers every route at 320px or 375px, 200% text reflow,
  manual dark mode, system dark mode on the hub, keyboard operation, invalid
  focus/status, console/page errors, interaction-time external requests, JSON
  download, and parsed reopen.
- `npx playwright test tests/e2e/day10-religious-cultural-contracts.spec.js --project=chromium --workers=1`
  on isolated port 49339 — 42/42 pass in 2.4 minutes, freezing the English
  calculation oracles and PDF/CSV/TXT export-reopen behavior before migration.
- `node tests/day10-category-contract.test.js` and
  `node tests/day10-shared-export-privacy.test.js` — pass.
- `npm run fr:surface:check`, `npm run ai:french-routes:check`,
  `npm run directories:check`, `npm run registry:check`,
  `npm run validate:hreflang`, `npm run lint`, `npm run type-check`,
  `npm run check-links`, and `git diff --check` — pass.
- `npm run fr:tools:verify-gap-pages` reports zero issues when scoped to these
  22 French owners. Its global result retains 256 issues outside this category.
- Final scope guard: zero deleted files, zero other-locale files, and zero
  prohibited master-ledger or sitemap files.

## Carried release-integration gaps

- `npm run fr:parity:check` remains red because
  `reports/french-free-app-parity-inventory.json` is intentionally unchanged.
  That master inventory is outside this worktree lane's authority.
- `npm run build:i18n:validate` identifies the intentionally stale broad
  generated coverage artifacts at
  `data/registry/locale-page-coverage.json`,
  `reports/localization-coverage.json`, and
  `reports/localization-coverage.md`. Regenerating them would violate the
  prohibition on broad generated output.
- `npm run audit` exits successfully but retains two unrelated missing-route
  findings for `job-offer-evaluator` and
  `zana-tathmini-ya-ofa-ya-kazi-sw-wave8`.
- The French hub is self-referential rather than part of a full EN/FR/SW hub
  hreflang clique because completing that clique requires an out-of-scope
  Swahili hub edit. All 22 app routes have reciprocal launched-locale
  hreflang.
- No production ledger, push, PR, merge, preview, deployment, or live-route
  proof is claimed by this local acceptance receipt.
