# Fresh French transport, telecom and personal-finance regression

Base: isolated `45d2539063ae7753e57d4b997754afc94f2c2887` plus consent-ordering candidate `6aa45a59`; no acceptance ledger edits. Catalog `data/audits/french-free-app-category-acceptance.json` is dated 2026-09-13 and names Telecom14, Transport18 and Personal Finance5. These historical declarations were not used as current browser proof.

## Repairs

- `scripts/build-french-transport-parity.js` now translates current shared English bridge advice for fleet fuel, truck capacity/utilization and vehicle operating cost. Three generated page dictionaries updated through that owner; only dictionary deltas retained to preserve unrelated build postprocessing. Engines, arithmetic, rates and regulatory assumptions are untouched.
- Car-import browser assertion now checks a clear recalculation instruction and explicit result-not-ready state, retaining disabled TXT/PDF and removed-output checks. Old literal 'Saisies modifiées...' was stale after the explicit-country gate; actual 'Pays sélectionné. Lancez le calcul...' is correct and safe.
- Added full French advice checks and matching reopened TXT/parsed PDF assertions for all three repaired tools.

## Findings and validation

Node suites passed: `tests/french-telecom-parity.test.js` (14/14), `tests/french-transport-parity.test.js` (18/18), `tests/french-personal-finance-parity.test.js` (9 tests for five apps).

Initial Chromium run on4196 with real analytics: 3passed,17failed,7skipped. Personal-finance and telecom rejected disclosed denied-state measurement pings in obsolete no-network arrays. Transport stopped on old car-country literal. These are distinct from product failures.

Existing test server seam `AFROTOOLS_TEST_DISABLE_ANALYTICS=1`, port4197:
- Personal-finance:6/6 PASS, all five app workflows and hub, themes, keyboard, 320/375/200%, exports and invalidation.
- Telecom:6/16 PASS;10 failures only at final `unexpectedNetwork` assertion721 for GET of `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js`. Functional checks, contrast, reflow, invalidation and genuinely fresh-context JSON/TXT reopen preceded that final assertion. The guard87 permits only Twemoji static assets and rejects auth SDK bootstrap. Transport's guard already explicitly permits that exact SDK GET. No network guard was relaxed here; this remains a test-infrastructure contract mismatch, not proof of tool payload transmission. Raw request records were not added to committed reports.
- Transport car-import subset:5/5 PASS (hub, core workflow, both dark-theme checks, all advertised actions including reopened exports).
- Transport newly repaired fleet and last-three subsets passed. Full final18 workflow run recorded below.

Browser outputs are outside the repository under the isolated worktree parent in `fr-*-output/`; fresh personal-finance screenshots were preserved in `../fr-personal-finance-screenshots/` and incidental tracked screenshots restored. Tests used Playwright through explicit NODE_PATH from the existing installed worktree. No deployment or public acceptance update was performed.

Final uninterrupted transport run: all18 workflows PASS in2.6minutes with no FR_TRANSPORT_PATTERN filter, including full French advice in reopened TXT/parsed PDF for fleet, truck and vehicle costs. Command: PORT=4197 AFROTOOLS_TEST_DISABLE_ANALYTICS=1 playwright test tests/e2e/french-transport-parity.spec.js --grep 'all 18' --project=chromium --workers=1. Separate car-import5/5 also passed. Syntax and git diff --check passed.
