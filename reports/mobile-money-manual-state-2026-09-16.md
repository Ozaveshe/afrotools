# Manual quote state parity — 16 September 2026

## Scope

Parent copy fix `14bd1f00` was cherry-picked as `d8786123` before this work. Integrate the original only once. This follow-up changes only the manual comparator controller and its tests; no tariff engine, tariff catalog, route or generated page changes.

## Defects and corrections

- Actual baseline: enable quote C, activate Reset, and let the reset callback finish. EN/SW leave C visible and enabled; French hides and disables it. All locales now restore a two-quote form and clear prior errors/results. Keyboard Space/Enter sequence verified.
- EN/SW displayed raw `unknown`, `not-expired` and `expired` enum strings. Visible results and copied/native JSON summaries now use readable localized descriptions. The machine `expiryState` remains unchanged in JSON.
- Validation now clears errors consistently across locales. Required/invalid fields have native field-specific messages. Quote B's future checked date or early expiry focuses B's relevant field, rather than quote A's first field. Each quote is validated independently through the existing deterministic engine before the combined comparison; the same captured time is used throughout.
- EN/SW JSON gains additive `locale` and localized `summary` fields. Existing schemaVersion, methodology and result remain; filename is unchanged. French's existing `resume` contract is retained. Synthetic reserved-word/accented labels (`Total Éwé b`) and free-text markets survive rendering, copy and reopened JSON unchanged. EN/SW free-text market semantics and French country-list validation remain unchanged.
- The reviewed copy success/missing/denied handler and financial arithmetic remain unchanged. No new network request, analytics event or tariff claim.

## Evidence

- Initial 22-case run: 19 passed; three old French recovery assertions failed because they required the former generic error or raw EN/SW enum display and exact old JSON key list. Updated assertions retain machine-code/schema checks and verify the new readable summaries. No network assertions were weakened.
- Final `mobile-money-manual-state.spec.js` + `french-money-recovery.spec.js`: **13 passed in 43.4 seconds**, evidence `../manual-state-final-proof`, own server 4234.
- Parent `mobile-money-copy-feedback.spec.js`: all **9 cases passed** in the initial run, same product source, evidence `../manual-state-proof`. Success, missing API, rejected clipboard and JSON fallback remain working EN/FR/SW.
- New browser coverage: unknown/current/expired states, exact invalid-field focus, negative fees, expiry before observation, keyboard third-quote reset, recovery to two quotes, native copy summary and reopened JSON preserving text.
- Malformed checked-date coverage assigns an invalid value to the native datetime control, which Chromium sanitizes to empty; validation focuses that field. The engine test separately rejects malformed observed/expiry strings. This does not claim a new free-text date parser.
- `node tests/mobile-money-quote-engine.test.js`, runtime syntax and `git diff --check`: passed.

No deployment or acceptance update. Full release and production checks remain with the coordinator. Earlier current-tariff/source limitations are unchanged.
