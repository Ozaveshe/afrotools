# Swahili Financial remaining candidate receipt

Reviewed: 2026-08-03
Programme base: `0f6990118d9ac8b9dcde446a6ede10a017b9a2db`

## Exact reconciliation

- Authoritative Financial rows: **132**
- Accepted in the coordinator checkpoint before this lane: **37**
- Remaining at lane start: **95**
- Net-new candidates implemented here: **2**
- Still fail-closed: **93**

The two candidates are:

1. `inflation-calc` -> `/sw/zana/kikokotoo-cha-mfumuko-wa-bei/`
2. `forex-profit` -> `/sw/zana/kikokotoo-faida-forex/`

Investment Return was deliberately excluded after the current coordinator ledger showed it was already accepted. No accepted Financial route is part of this candidate diff.

## Product proof

Both candidates are native Swahili owners that consume the existing deterministic English calculation engines. Each provides route-specific valid and invalid behaviour, stale-result clearing, local clipboard/CSV/JSON/PDF outputs, reciprocal EN/FR/SW metadata, source and planning boundaries, responsive styling, keyboard focus, accessible status feedback, local-first privacy, and reviewed artwork references.

Static proof passed:

- `tests/swahili-inflation-scenario-contract.test.js`: 11/11
- `tests/inflation-scenario.test.js`: passed
- `tests/swahili-forex-profit-contract.test.js`: 11/11
- `tests/forex-profit-statement-engine.test.js`: passed

Browser proof passed 16/16 effective Playwright cases on isolated port 43151 with one worker: 12 named workflows plus four parameterized 320/375px reflow cases. The final run reopened CSV, JSON and PDF exports; checked clipboard output; exercised valid, stale and invalid states; denied analytics consent; verified no sensitive network or storage leakage; checked explicit and system light/dark modes, keyboard focus, labels, contrast, canonicals, reciprocal hreflang, schema and artwork.

The browser run found and repaired one real product issue: the Inflation primary action did not meet 4.5:1 text contrast in dark mode. It also exposed an OS-clipboard test isolation assumption; invalid actions now prove the clipboard remains unchanged from its baseline. A two-frame theme stabilization keeps the serial media-query proof deterministic. The exact worktree root was verified, and port cleanup ended with zero listeners and zero owned processes.

These two rows are accepted by this scoped candidate receipt, but they are not yet recorded in the central coordinator ledger.

## Guardrails

This lane did not edit the central acceptance ledger, the central Swahili AI route map, the master inventory, sitemaps, `dist/`, service-worker output, or deployment files. The 93 blocked ids are recorded in the machine receipt. The five missing bespoke images are recorded separately in the artwork queue.
