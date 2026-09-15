# Current Swahili PAYE regression and Kenya native repair

Fresh isolated branch `codex/sw-paye-regression-20260915` starts at coordinator3958284c78df6e1c0dcfb43ac0444c90a8c055fc. Fetch completed first; origin/main was3c35b8fdab0ba04c13800387cdb661d72012c8ef. Source server4198 uses existing analytics-disabled test isolation; no acceptance edits.

## Current regression

19/19 Chromium tests passed across `swahili-paye-local-exports-vip.spec.js` and `sw-tanzania-paye-parity.spec.js`: full VIP popup-report, browser-PDF parsing, AI confirmation and mobile checks for Angola, Burkina Faso, Chad, Cote d’Ivoire, Ethiopia, Gabon, Guinea, Malawi, Mali, Mauritius, Niger, Seychelles, plus Equatorial Guinea and Tanzania. Tanzania dedicated annual/reverse/private-public-sector tests also passed (including EN/FR reverse-helper controls). Twelve annual-key repaired profiles are covered by those full VIP flows. The VIP suite has26 owners but does not contain Kenya; it has PDF/print exports, not TXT. Tanzania’s old VIP flow still passed alongside its dedicated suite.

## Kenya findings and repair

The native Kenya page stored `grossKodi`, while display, PDF and AI read `grossTax`: valid calculations visibly displayed NaN. AI also used undefined `matokeo` and failed before any send. Invalid editing could leave AI controls enabled.

The targeted hand-authored route now uses the stable result key, validates complete finite numeric input, clears stale result/report/chart/AI state on input changes or invalid calculation, and cancels pending AI when its result becomes stale. Tax arithmetic, rates, toggles and source dates remain unchanged.

AI is optional: a native confirmation displays the exact JSON payload before each analysis or follow-up send. It includes monthly period, salary/deduction figures and message history. Declining sends nothing. A new Kiswahili local explanation button needs no network. Accepted requests carry a consent marker/header and retain the existing optional auth header. Pending controls are disabled; aborted or outdated replies cannot repaint a newer result. Error handling offers the local explanation.

## Kenya verification

- `sw-kenya-paye-native-repair.spec.js`: PASS, including finite visible tax; parsed PDF gross-tax/net values; no NaN; local explanation; cancel/accept and exact payload disclosure for initial AI and follow-up; malformed, zero, negative, empty, nonfinite and overflow inputs; pending-response invalidation; API503 fallback;320px overflow; no page errors.
- Three synthetic before/after calculation objects compared through browser route override, normalizing only grossKodi→grossTax: PASS. No claim of current legal accuracy follows from preserving existing arithmetic.
- All inline scripts compiled with Node vm.Script: PASS.
- `git diff --check`: PASS.

Evidence is outside the repo in sibling `sw-regression-output`, `kenya-repair-output`, and `kenya-repair-final-output`. No production deployment, source renewal or acceptance-ledger update.

