# Swahili Security Native-Parity Candidate Receipt

- Reviewed: 2026-08-02
- Exact parent commit: `8354e321ff34caf60a33a3393cd0dcddfb00c023`
- Coordinator base preserved: exact clean replay with no rejected ancestry included
- Candidate family: Security
- Candidate app denominator: 7
- Local app-level result: 7 candidate-accepted, 0 product-blocked
- Central acceptance result: pending coordinator review; the central Swahili acceptance ledger and generated AI route map were deliberately not edited
- Deleted paths: 0
- Push/deploy result: not attempted

## Security Reconciliation

| Measure | Before | Candidate |
| --- | ---: | ---: |
| Exact English canonical owners | 7 | 7 |
| Exact Swahili registry/discovery source rows | 3 | 7 |
| Swahili public routes | 3 | 7 |
| Native formula-parity apps | 0 | 7 |
| Translated/generic shells | 3 | 0 |
| Missing routes | 4 | 0 |
| Routes linking the all-tools hub and native family | 3 | 7 |
| Available tool artwork | 7 | 7 |
| Correct route-specific OG artwork | 3 | 7 |
| Full reciprocal English/French/Swahili hreflang | 3 | 7 |
| Native locale-policy owners | 0 | 7 |
| Central acceptance-ledger routes | 0 | 0 |
| Generated Swahili AI-map routes | 0 | 0 |

`/sw/zana-zote/` consumes the tool registry. This candidate adds all seven exact Security discovery source rows and each native app links back to the all-tools hub and to every sibling in the family. The minified/generated registry asset is intentionally left for coordinator regeneration.

## Exact Candidate-Accepted Routes

| ACCEPT ID | English canonical owner | Native Swahili route |
| --- | --- | --- |
| `cctv-cost` | `/tools/cctv-cost/` | `/sw/zana/gharama-za-cctv/` |
| `cybersecurity-assessment` | `/tools/cybersecurity-assessment/` | `/sw/zana/tathmini-ya-usalama-wa-kidijitali/` |
| `data-breach-cost` | `/tools/data-breach-cost/` | `/sw/zana/gharama-ya-uvujaji-wa-data/` |
| `fire-safety-checklist` | `/tools/fire-safety-checklist/` | `/sw/zana/ukaguzi-wa-usalama-wa-moto/` |
| `home-security-cost` | `/tools/home-security-cost/` | `/sw/zana/gharama-za-usalama-wa-nyumbani/` |
| `password-strength` | `/tools/password-strength/` | `/sw/zana/nguvu-ya-nenosiri/` |
| `phishing-quiz` | `/tools/phishing-quiz/` | `/sw/zana/jaribio-la-kutambua-hadaa/` |

Product BLOCK IDs: none.

All seven are hand-authored native Swahili apps. They use only the new Swahili-scoped controller and stylesheet. Fire and home security reuse their existing locale-neutral English engines without modifying them. No iframe, redirect, translated shell, shared engine edit, or cross-locale runtime edit is used for acceptance.

## Frozen English Formula Oracles

### CCTV cost

Kenya, eight IP cameras, NVR, four storage weeks, professional installation, and monitoring:

- cameras: `40000`
- recorder: `7000`
- eight 1 TB storage units: `24000`
- installation: `8000`
- setup: `79000`
- monthly: `2000`
- five-year: `199000`

Analog plus NVR and non-analog plus DVR fail closed as incompatible.

### Cybersecurity assessment

Ten selected controls and one minor incident:

- base: `50/100`
- incident penalty: `5`
- final: `45/100`
- grade: `D`

The six domains preserve the English owner's 20 controls at five points each. Country, sector, employee band, and sensitivity provide context only; they do not secretly alter the score.

### Data breach cost

Kenya, 10,000 records, USD 165 base, medium sensitivity, medium organization, and medium detection:

- record cost: `1650000`
- notification: `20000`
- fixed response components: `250000`
- total USD: `1920000`
- KES planning conversion: `249600000`
- per record: `192`

Regulatory fines are explicitly excluded.

### Fire safety checklist

Kenya office, 500 m2, two floors, 50 occupants, and the frozen nine-control selection:

- score: `61/100`
- remediation: `259200`
- maintenance at 5%: `12960`

The unchanged shared engine preserves 17 visible weights totaling 100, four country cost sets, property multipliers, and area scaling.

### Home security cost

Kenya bungalow, medium stated risk, standard package:

- CCTV midpoint: `70000`
- alarm midpoint: `25000`
- setup: `95000`
- monthly: `2700`
- annual: `51400`
- five-year: `257000`

The unchanged shared engine preserves six country cost sets, home-type multipliers, package rules, and midpoints.

### Password strength

Synthetic fixture `CorrectHorseBatteryStaple!9`:

- score: `80/100`
- entropy heuristic: `176.97389899529622` bits
- character types: `4/4`
- crack-time band: more than one billion years

The fixture is synthetic. The app never gives the secret an exportable `input`, and the UI has no save, copy, print, download, analytics, URL, or network path for it.

### Phishing quiz

The exact ten English-owner scenario answers produce `10/10` and `Matokeo thabiti`. Incomplete or out-of-range answer arrays fail closed. The order may shuffle, but scoring is bound to the fixed scenario IDs.

## Country, Source, Freshness, And Confidence

- CCTV and home security expose Nigeria, Kenya, South Africa, Ghana, Egypt, and Tanzania.
- Cybersecurity and breach-cost context expose Nigeria, Kenya, South Africa, Ghana, and Egypt.
- Fire safety cost assumptions expose Nigeria, Kenya, South Africa, and Ghana.
- Password and phishing are country-neutral; they do not infer jurisdiction-specific compliance.
- Every page names its exact English formula/scenario owner and shows `2026-08-02` as the review date.
- Current official context links were reopened on 2026-08-02 for Kenya ODPC breach reporting, Nigeria NDPC resources, Kenya occupational safety, Nigeria Federal Fire Service, South Africa's OHS Act, Ghana Fire Service certification, and NIST SP 800-63B.
- Confidence is high for deterministic formula/scoring parity and export/reopen behavior; it is low for current vendor prices, actual breach cost, inspection/certificate outcome, regulatory duty, password compromise status, or classifying a real message.
- Cost tables are disclosed as static planning assumptions, not live feeds, official filings, quotations, certificates, audits, security guarantees, or legal advice.

## Privacy, Export, And Failure Boundaries

- Every ordinary form input/change clears the prior result; reset clears it too.
- Invalid values fail closed, identify/focus the offending field, and leave no stale result visible.
- CCTV, cyber, breach, fire, home, and quiz advertise copy, TXT, JSON, optional local save/open/delete, and JSON import.
- Chromium captured and parsed every advertised TXT and JSON download. JSON was schema/locale/app checked, imported, repopulated where applicable, and recalculated. Optional local saves were reopened and recalculated.
- Password input is ephemeral: clearing removes the result, storage remains free of the synthetic secret, and the URL never contains it.
- No runtime `fetch`, XHR, WebSocket, beacon, raw console logging, or unexpected external browser request was observed.
- Security-sensitive pages tell users not to enter credentials, raw incidents, addresses, camera layouts, account data, or real messages.
- Every page states that any future AI send must display the exact fields/content, require explicit consent, and preserve the local-only alternative.

## Browser, Accessibility, Theme, And SEO Evidence

- `37/37` focused Chromium tests passed.
- All seven apps passed at 320px and 375px, in light and dark themes, and at 200% reflow.
- Computed assertions cover every visible app-owned text label, input/select, checkbox, primary action, secondary action, import label and focus indicator across every route and its initial/result/question states in explicit light, explicit dark, system-light and system-dark variants.
- Measured minima are `5.39:1` for app-owned text, `4.41:1` for control/component boundaries and `6.80:1` for focus indicators; the minimum focus-ring width is `3px`.
- Visible labels, accessible names, skip-link keyboard entry, focus styles, live status/error regions, import labels, keyboard theme/password controls, tap-sized controls, and reduced-motion CSS are present.
- Browser observation recorded zero console/page errors, failed resources, or unexpected external requests.
- Each Swahili route is self-canonical, has route-specific Open Graph artwork and two structured-data blocks, and participates in a reciprocal English/French/Swahili group with `x-default`.
- Only eight metadata lines were added outside Swahili: the missing `hreflang="sw"` relationship in four English and four French heads. No English/French visible copy or runtime changed.

## Validation Receipt

| Command | Result |
| --- | --- |
| `node -c assets/js/pages/sw-security-parity.js` | PASS |
| `node --test tests/swahili-security-parity.test.js` | PASS, 13/13 |
| isolated `playwright test tests/e2e/swahili-security-parity.spec.js --project=chromium --workers=8` | PASS, 37/37; text `5.39:1`, boundary `4.41:1`, focus `6.80:1`, focus width `3px` |
| `npm run validate:hreflang` | PASS, 5,276 reciprocal equivalence groups |
| `npm run sw:ai-routes:check` | PASS, existing 199 accepted routes unchanged |
| `npm run test:privacy-ai-consent` | PASS, server check and 3/3 browser checks |
| `npm run check-links` | PASS, 133,250 internal links across 11,076 HTML files |
| `npm run lint` | PASS, 49 JavaScript files |
| `npm run type-check` | PASS |
| `git diff --check` | PASS |
| `npm run audit` | EXPECTED COORDINATOR BLOCKER: accurate Security country applicability requires shared country `supportedToolTypes` metadata for EG, GH, KE, NG, TZ, and ZA |
| `npm run build:i18n:validate` | EXPECTED COORDINATOR BLOCKER: prohibited generated locale coverage artifacts are stale |

The audit blocker is intentionally not repaired here because its fix changes shared country metadata used across locales. The i18n blocker is intentionally not repaired because it requires regenerating `data/registry/locale-page-coverage.json` and `reports/localization-coverage.{json,md}`. Both are coordinator-owned boundary decisions.

The coordinator must review the seven source-owned apps, decide the shared country metadata update, regenerate approved outputs, decide central Swahili acceptance entries, and then regenerate the AI route map. No sitemap, deploy, master ledger, central Swahili acceptance ledger, generated AI route map, generated locale coverage, minified registry, English/French visible copy, English/French runtime, shared engine, or cross-locale runtime was changed.

## Candidate Paths

- `assets/css/sw-security-parity.css`
- `assets/js/pages/sw-security-parity.js`
- `assets/js/components/tool-registry.js`
- `data/registry/locale-coverage-policy.json`
- seven `sw/zana/**/index.html` Security routes listed above
- four English owner heads listed above
- four French owner heads listed above
- `tests/swahili-security-parity.test.js`
- `tests/e2e/swahili-security-parity.spec.js`
- `reports/sw-security-parity-candidate-receipt.md`
