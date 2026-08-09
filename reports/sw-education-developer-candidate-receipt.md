# Swahili Education + Developer candidate receipt

## Outcome

- Baseline: `6edacda8437e1fa9b9e5a512138cbdd3169e38be`
- Assigned denominator: **58** (Education 32; Developer Tools 26)
- Candidate accepted: **58**
- Blocked: **0**
- Exact accepted IDs: waec-calculator, jamb-aggregate, matric-points, gpa-calculator, exam-countdown, flashcard-maker, citation-generator, word-counter, periodic-table, algebra-solver, binary-converter, statistics-calc, fraction-calc, percentage-calc, scientific-calc, education-hub, scholarship-finder, university-ranking, study-planner, ielts-calculator, degree-checker, nysc-allowance, kcse-calculator, national-service-gh, university-admission, coding-bootcamp, boarding-school, cert-roi, classroom-size, exam-timetable, interview-prep, plagiarism-pct, json-formatter, regex-tester, cron-builder, jwt-decoder, uuid-generator, diff-checker, color-contrast, ussd-simulator, api-tester, sql-playground, css-gradient, meta-tag-gen, htaccess-gen, robots-txt, sitemap-gen, password-gen, sql-formatter, meta-tag-generator, african-api-directory, african-domains, commit-message-gen, dev-tools, docker-compose-gen, hosting-compare, pwa-manifest, ussd-flow-builder

## Product and source-owner decisions

- Education: 31 assigned routes are owned by `scripts/build-sw-education-parity.js` and `assets/js/pages/sw-education-parity.js`; `education-hub` retains its existing native planner owner. Each generated route invokes the exact English DOM-free owner, and the browser oracle replays the same input directly through that owner and compares the result deeply. Dynamic output is practical Kiswahili; changing admissions, fees, rankings, scholarships, dates, eligibility, and regulatory facts remain explicitly outside the calculator's authority.
- Developer Tools: 23 existing native controllers were retained; `meta-tag-gen` gained `assets/js/engines/meta-tag-engine.js` and a native Swahili owner; `ussd-simulator` and `meta-tag-generator` had explicit fallback shells removed and dynamic preset output localized. The test suite parses or reopens every advertised structured output instead of accepting a download event.
- Correctness repair shared with English: `.htaccess` downloads use `afrotools.htaccess`, avoiding Windows cancellation while preserving exact generated directives.
- Metadata-only reciprocal hreflang edits were made only for assigned physical pairs under `tools/` and `fr/tools/`. No sitemap, redirect, service-worker, AI route-map, central acceptance ledger, or locale coverage output was edited.
- Missing reference: `.claude/rules/i18n.md` does not exist at the verified baseline; the repository strategy and coordinator skill governed this lane.

## Browser and export proof

- Installed Chrome/Chromium, one Playwright worker, isolated static-server port.
- 320 px, 375 px, and 200% reflow; light/dark rendering; keyboard focus; labels/live regions; canonical, OG, schema, reciprocal hreflang, discovery, console/page/404 errors, and no iframe/bridge behavior were exercised.
- Education: valid owner replay, invalid and reset paths, plus JSON, CSV, TXT, and PDF downloads reopened/parsed; copy, local save, and print actions exercised.
- Developer: JSON, CSV, XML, SQL, SQLite, HTML, plain text, PWA/Docker/USSD structures, JWT payloads, UUIDs, regex/diff/contrast output, and generated metadata were semantically parsed or reopened. SQLite was queried after reopening with sql.js.
- Privacy: synthetic fixtures only; analytics declined; no raw-input network writes. API Tester performed its network request only after an explicit click, against an intercepted synthetic endpoint.

## Artwork

- Dedicated artwork present: **58/58**.
- Missing-artwork queue: **0** (`reports/sw-education-developer-missing-artwork.json`).

## Focused tests and validation

- PASS `node tests/swahili-education-owner-oracles.test.js`
- PASS `node tests/swahili-developer-owner-oracles.test.js`
- PASS Education workflow Playwright: 62/62
- PASS Developer Playwright: 27/27
- PASS final Education category Playwright: 34/34 after reflow/artwork fixes
- PASS `node scripts/build-i18n.js --validate`
- PASS `npm run validate:hreflang`
- PASS `npm run check-links`
- PASS `npm run audit`, with carried baseline missing-page debt for `job-offer-evaluator` and `zana-tathmini-ya-ofa-ya-kazi-sw-wave8`; neither is assigned or modified here.
- FAIL-CLOSED `npm run build:i18n:validate`: its localization coverage precheck requires coordinator-owned generated files (`data/registry/locale-page-coverage.json`, `reports/localization-coverage.json`, `reports/localization-coverage.md`) to be regenerated. Those files are prohibited in this lane; the direct i18n validation passed.
- CARRIED BASELINE `npm run lint`: the repository CI lint inventory reports only existing `assets/js/ai/**`, AI function/script/test, and `widgets/ai/**` files; none is changed by this lane.
- PASS `npm run type-check`.
- PASS `npm run test:privacy-ai-consent`: server unit plus 3/3 browser tests.
- PASS `git diff --check`; `git diff --diff-filter=D --summary` reports no deletions.

## Changed source families

- Education owner, translation data, shared browser adapter, 31 assigned generated/native routes, assigned discovery directory, and focused oracle/browser tests.
- Developer pure meta-tag engine and native route, two fallback-to-native repairs, USSD dynamic localization, hosting reflow, cross-platform htaccess export repair, exact manifest owner, and focused oracle/browser tests.
- Playwright config accepts an optional explicit Chromium executable path for deterministic local browser proof.
