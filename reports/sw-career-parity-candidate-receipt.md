# Swahili Career Native-Parity Candidate Receipt

- Candidate repaired and reverified: 2026-08-02
- Exact parent commit: `8354e321ff34caf60a33a3393cd0dcddfb00c023`
- Coordinator base preserved: exact clean replay with no Diaspora or rejected ancestry included
- Candidate family: Career
- Candidate app denominator: 4
- Local candidate result: 4 accepted, 0 product-blocked
- Central acceptance result: pending coordinator review; the central Swahili acceptance ledger and generated AI route map were deliberately not edited
- Deleted paths: 0
- Deploy result: not attempted

## Career Reconciliation

| Measure | Before | Candidate |
| --- | ---: | ---: |
| Exact English canonical owners | 4 | 4 |
| Exact Swahili registry rows | 3 | 4 |
| Swahili public routes | 4 | 4 |
| Native formula-parity apps | 0 | 4 |
| Translated/generic shells | 4 | 0 |
| Missing routes | 0 | 0 |
| Hub-linked routes | 4 | 4 |
| Available tool artwork | 4 | 4 |
| Correct route-specific OG artwork | 2 | 4 |
| Full reciprocal English/French/Swahili hreflang | 4 | 4 |
| Central acceptance-ledger routes | 0 | 0 |
| Generated Swahili AI-map routes | 0 | 0 |

The Career denominator is the four canonical English owners below. A shell, translated wrapper, iframe, or generic calculation was not counted as native or accepted. The `retirement-readiness` counterpart lacked an exact registry row before this candidate. All four routes were already linked from `/sw/kazi-na-ajira/`.

## Local Candidate-Accepted Routes

| English owner | Native Swahili route |
| --- | --- |
| `/tools/career-growth/` | `/sw/zana/ukuaji-wa-kazi/` |
| `/tools/career-switch/` | `/sw/zana/kubadili-kazi/` |
| `/tools/retirement-readiness/` | `/sw/zana/utayari-wa-kustaafu/` |
| `/tools/salary-negotiation/` | `/sw/zana/majadiliano-ya-mshahara/` |

All four are hand-authored native Swahili HTML/CSS/JavaScript apps. Their calculations use the Swahili-scoped deterministic runtime and stylesheet; the existing shared navbar, footer and dark-mode runtimes are restored without modifying those shared owners. No English/French calculation runtime, iframe, redirect, or translated-shell implementation is used for acceptance.

## Coordinator Repair Closure

- Career Growth now renders three English-owner Growth Drivers and its tailored Recommended Next Steps, and includes both sections in TXT and JSON output.
- Retirement Readiness now renders and exports the exact `extraContribution` oracle (`18120.179559550987` for the receipt fixture).
- Salary Negotiation now preserves the English fallback-package paragraph covering bonus, leave, remote flexibility and a six-month review when base pay is fixed.
- All four routes now instantiate the shared `<afro-navbar>` and `<afro-footer>` components and load their maintained runtimes.
- Every Career page now preloads the repository-owned `/assets/js/supabase.min.js` before shared-navbar startup, so the delayed auth bootstrap cannot fall back to jsDelivr.
- Browser request observation remains active for 15 seconds after route settlement and 15 seconds after the full calculate/export/import/save/invalid flow; no delayed external request appeared.

## Exact Formula Oracles

### Career growth

Fixture: Kenya, technology, level 2, monthly salary 120,000, four years of experience, degree, management path, five learning hours, medium network, and occasional employer mobility.

- Starting salary: `120000`
- Annual raise factor: `0.19`
- Year 5 salary: `653180.6087821636`
- Year 10 salary: `2942955.271537162`
- Ten-year cumulative earnings: `129026113.05804905`
- Projected level: `Mkurugenzi / VP`
- Projection rows: 11, including year zero

### Career switch

Fixture: monthly salary 100,000, benefits 15,000, target salary 160,000, training cost 240,000, six training months, two search months, 50% part-time income, and 8% target-career growth.

- Total switch cost: `815000`
- Monthly gain after switch: `45000`
- Break-even: `19` months
- Five-year target-career income: `10010256.173006188`
- Five-year difference: `3110256.173006188`

### Retirement readiness

Fixture: Kenya, age 35, retire at 60, savings 1,200,000, monthly contribution 30,000, salary 120,000, pension zero, retirement expenses 80,000, one dependant, owned home, public-sector employment.

- 25x target: `24000000`
- Projected savings at 0% real return: `10200000`
- Projected savings at 3% real return: `15918258.1611145`
- Projected savings at 5% real return: `22042839.797065057`
- Score: `66`
- Additional monthly contribution: `18120.179559550987`
- Monthly 4% withdrawal from projected savings: `53060.86053704834`
- Monthly gap: `-26939.139462951658`

No pension is invented: only the user-entered pension is included.

### Salary negotiation

Fixture: Kenya, user-verified benchmark 180,000 and offer 165,000.

- Lower bound at 90%: `162000`
- Benchmark midpoint: `180000`
- Counter target at 105%: `189000`
- Upper bound at 110%: `198000`
- Offer position: below midpoint

The app does not claim a live salary database. Its ranges come only from the benchmark the user enters and is told to verify.

## Country, Source, Freshness, And Confidence

- Career growth and retirement preserve the English owners' 15-country currency/model coverage.
- Career switch preserves the English owner's NGN, KES, ZAR, GHS, and USD currency scope.
- Salary negotiation preserves its nine-country currency selector while using only the user-supplied benchmark.
- Each page names its exact English source owner and retains its 2026-07-31 source-review date; this clean candidate was reverified on 2026-08-02.
- Confidence is high for formula equivalence and deterministic export/reopen behavior.
- Confidence is low for predicting a real promotion, salary, job-search duration, investment return, pension outcome, or negotiation result.
- Country selection defines currency/model scope; Kiswahili does not silently imply Kenya.
- The apps disclose that the embedded country bases and multipliers are planning assumptions, not current salary surveys or live official rates.

## Privacy, Export, And Failure Boundaries

- Every input change clears the prior result before another calculation.
- Invalid input fails closed, reports the field problem, focuses the invalid field, and leaves no stale result visible.
- TXT and JSON downloads are captured and parsed in Chromium tests.
- Exported JSON is imported, schema/locale/app validated, repopulated, and recalculated.
- Explicit local saves are reopened and recalculated; users can delete them.
- Inputs and exported content are not logged, placed in URLs, sent to analytics, or sent over the network.
- Browser observation recorded no unexpected external request, console error, page error, or failed resource.
- Each page says that any future AI send must show the exact content to be sent and obtain explicit consent while preserving the local-only path.

## Browser, Accessibility, And SEO Evidence

- 22/22 focused Chromium tests passed.
- Every app passed at 320px and 375px, 200% reflow, and light/dark themes.
- Computed assertions cover every visible app-owned text label, input/select, primary action, secondary action, import label, component boundary and focus indicator across every route and its initial/result states in explicit light, explicit dark, system-light and system-dark variants.
- Measured minima are `6.05:1` for app-owned text, `3.32:1` for control/component boundaries and `6.82:1` for focus indicators; the minimum focus-ring width is `3px`.
- Visible labels, accessible names, keyboard focus entry, focus styles, live status/error regions, local file controls, and reduced-motion behavior are covered.
- Each route is self-canonical, has route-specific Open Graph/tool artwork, and participates in a reciprocal English/French/Swahili hreflang group with `x-default`.

## Validation Receipt

| Command | Result |
| --- | --- |
| `node -c assets/js/pages/sw-career-parity.js` | PASS |
| `node --test tests/swahili-career-parity.test.js` | PASS, 9/9 |
| `PORT=42941 npx playwright test tests/e2e/swahili-career-parity.spec.js --workers=4 --reporter=line` | PASS, 22/22 after the 15-second delayed-auth threshold; text `6.05:1`, boundary `3.32:1`, focus `6.82:1`, focus width `3px`; zero unexpected requests/errors |
| `npm run validate:hreflang` | PASS, 5,276 reciprocal equivalence groups |
| `npm run sw:ai-routes:check` | PASS, existing 199 accepted routes unchanged |
| `npm run test:privacy-ai-consent` | PASS, server check and 3/3 browser checks |
| `npm run check-links` | PASS, 133,170 internal links across 11,072 HTML files |
| `npm run audit` | PASS; its two reported missing pages pre-existed and are outside this family |
| `npm run lint` | PASS |
| `npm run type-check` | PASS |
| `git diff --check` | PASS |
| `npm run localization:check` | EXPECTED COORDINATOR BLOCKER: generated locale coverage JSON/Markdown is stale |
| `npm run build:i18n:validate` | EXPECTED COORDINATOR BLOCKER at the same prohibited generated artifacts |

The i18n validation blocker is intentionally not repaired here. Regenerating `data/registry/locale-page-coverage.json` and `reports/localization-coverage.{json,md}` would broaden this bounded candidate into coordinator-owned output. The coordinator must review the four source-owned apps, regenerate those artifacts, decide central acceptance-ledger entries, and then regenerate the AI route map.

No sitemap, deploy, master ledger, central Swahili acceptance ledger, generated AI route map, English/French visible copy, English/French runtime, or shared cross-locale engine was changed.
