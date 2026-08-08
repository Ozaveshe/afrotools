# HA-04 test receipts

Implementation SHA: `ad53c0aa078ef4008162067be7a4bfeabd3dedb4`

Date: 2026-08-08

Fixtures: synthetic only

## Passed

- `node --test tests/ha/ha-04/ha-04-contract.test.js` — 3/3 passed.
- `AFROTOOLS_TEST_DISABLE_ANALYTICS=1 npx playwright test --config=tests/ha/ha-04/playwright.config.js --workers=1` — 12/12 passed in Chromium.
- `node --test tests/planting-calendar-engine.test.js tests/seed-rate-engine.test.js tests/commodity-price-engine.test.js tests/day6-agriculture-family-calculators.test.js` — 4/4 files passed; 14 planting scenarios, 240 commodity scenarios and 16 maintained agriculture workflows were reported green.
- `npm run test:ha-surface` — passed; 105 audited routes.
- `npm run ha:coverage:check` — passed; read-only report returned 105 routes.
- `npm run validate:hreflang` — passed after route-local reciprocal additions; 33,412 relationships and 5,351 equivalence groups.
- `npm run check-links` — passed; 138,218 internal links across 11,509 HTML files, zero broken internal links.
- `npm run lint` — passed; 49 JavaScript files checked.
- `npm run type-check` — passed.
- `git diff --check` and `git diff --cached --check` — passed.

## Baseline debt kept separate

- `npm run ha:surface:check` remains red because 13 unrelated Hausa generated surfaces were stale at the frozen base: `ha/kasashe/index.html`, `ha/shiga/index.html`, `ha/allon-aiki/index.html`, `ha/maajiyar-takardu/index.html`, `ha/farashi/index.html`, `ha/sharuddan-amfani/index.html`, `ha/sirri/index.html`, `ha/tuntube-mu/index.html`, `ha/game-da-mu/index.html`, `ha/masu-habaka/index.html`, `ha/inshora/index.html`, `ha/labarai/index.html`, and `ha/kayan-kasuwanci/index.html`. None is assigned to HA-04; the protected broad Hausa generator was not run with `--write`.
- `npm ci` reported 6 moderate and 8 high dependency advisories already represented by the frozen lockfile. No lockfile or dependency manifest changed in this lane.

No net-new test, browser, console, network, privacy, link, hreflang, lint, type or whitespace defect remains in the assigned denominator.
