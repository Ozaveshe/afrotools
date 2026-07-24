# Day 1–2 UI/UX Refinement Ledger

Review date: 2026-07-24

Scope: six category hubs and 77 English canonical apps

Method: app-by-app browser review at 390 × 844, explicit dark mode, plus targeted desktop-source review

Current proof state: `ARTIFACT PASS` (deploy and live proof are recorded separately)

## Scope reconciliation

| Day | Category | Hub | English apps | Surfaces reviewed | State |
| --- | --- | --- | ---: | ---: | --- |
| 1 | Diaspora | `/diaspora/` | 2 | 3 | LOCAL PASS |
| 1 | Career & Development | `/career/` | 4 | 5 | LOCAL PASS |
| 1 | Security & Safety | `/security/` | 7 | 8 | LOCAL PASS |
| 2 | Personal Finance | `/personal-finance/` | 5 | 6 | LOCAL PASS |
| 2 | Small Business & SME | `/small-business/` | 28 | 29 | LOCAL PASS |
| 2 | Fintech & Banking | `/fintech/` | 31 | 32 | LOCAL PASS |
|  | **Total** | **6 hubs** | **77** | **83** | **LOCAL PASS** |

The route list is generated from `assets/js/components/tool-registry.js`; localized
surfaces remain owned by localization review lanes.

## Evidence-backed improvements

| Surface | Finding | Improvement | Verification |
| --- | --- | --- | --- |
| All 77 apps | 63 apps had no semantic main landmark | Existing primary content container receives `role="main"`; no layout wrapper was introduced | 77/77 app routes expose a main landmark |
| Day 1–2 dark pages | Light hero surfaces inherited light text, making headings and supporting copy unreadable | Added six-category dark hero, badge, note, and disclosure tokens | Representative visual review plus 83-route dark browser gate |
| Related tools | Shadow-DOM heading remained near-black in dark mode | Added explicit dark-theme title color in the component source and rebuilt its minified asset | Readable title on every rendered related-tools section |
| Injected FAQ cards | Light FAQ surfaces remained white inside dark pages | Added scoped dark surfaces, borders, headings, and body copy | Debt Snowball visual review and computed-style check |
| Startup Runway | Cost removal controls collapsed to 8 px and lost their visible glyph | Replaced text glyph with stable SVG, accessible name, and 44 × 44 target | All rendered cost actions are 44 × 44 |
| Burn Rate | Removal controls were undersized and depended on a stripped text glyph | Replaced text glyph with stable SVG, accessible name, and 44 × 44 target | All rendered cost actions are 44 × 44 |
| Debt Snowball | Five-column desktop table produced truncated mobile values and a 13 px delete target | Reflowed rows into labelled two-column mobile cards; enlarged removal action | No overflow; inputs remain readable; action is 44 × 44 |
| Stock Portfolio | Five-column holdings table produced narrow, clipped mobile fields | Reflowed holdings into labelled two-column mobile cards; enlarged removal action | No overflow; inputs remain readable; action is 44 × 44 |
| Net Worth | Long item names, amounts, and narrow delete controls competed on one mobile row | Reflowed each item into a two-row mobile card; enlarged and named removal action | No overflow; all visible actions are 44 × 44 |
| Loan Consolidation | Static removal controls lacked accessible names and were undersized | Added stable names and 44 × 44 targets | Three default actions pass size/name checks |
| Bill Split | Removal controls were 32 px and static/dynamic controls lacked stable names | Added 44 × 44 targets and per-person accessible names | Static and newly generated actions pass size/name checks |

## Verification record

| Gate | Result |
| --- | --- |
| 83-route HTTP/browser smoke | PASS: 83/83 HTTP 200 |
| Mobile horizontal overflow | PASS: 83/83 at 390 px |
| Explicit dark mode | PASS: 83/83, including related-tools title |
| Application runtime errors | PASS: zero page errors across 83 routes |
| Semantic main landmark | PASS: 83/83 surfaces |
| Dense-row touch actions | PASS: seven targeted apps, minimum 44 × 44 and named |
| Representative calculator smoke | PASS: Startup Runway, Debt Snowball, Net Worth, Loan Consolidation, Bill Split, and Stock Portfolio |
| `npm run category-workflow:verify` | PASS |
| `npm run lint` | PASS |
| `npm run type-check` | PASS |
| `npm test` | PASS: 259 test files; 419 assertions; seven audits |
| `git diff --check` | PASS |
| `npm run build:deploy` | TIMED OUT after producing `dist/`; do not count the command itself as a pass |
| `npm run audit:dist` | PASS: generated publish artifact independently audited |
| `npm run security:scan` | PASS |

## Safety and scope

- No calculator formula, engine, registry route, canonical, structured-data claim,
  persistence behavior, analytics event, or network contract changed.
- The new shared stylesheet loads only on the six reviewed categories.
- Existing unrelated work in the original dirty checkout was not modified.
- `ARTIFACT PASS` is supported by the generated artifact plus independent
  `audit:dist` and security passes; the parent build command timed out and is
  recorded honestly rather than upgraded to a pass.
- `LIVE PASS` requires the exact deployed commit and independent production-route proof.
