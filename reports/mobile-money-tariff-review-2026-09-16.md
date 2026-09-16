# Mobile Money published tariff review — 16 September 2026

## Scope and evidence

Isolated branch `codex/fr-orange-money-20260916`, originally fetched from `origin/main` at `9a792f300b07352a878e1503f66123e6942666b2`. This follow-up is separate from comparator `b22b7ace` and guide handoff `47d5fc9a`. Parent renderer `7ea1151e` is present locally as `10af0200`; integrate that original commit only once.

No deployment, live transaction, account eligibility certification, acceptance-ledger update or search uplift claim.

### MTN Uganda

- Official tariff page: https://www.mtn.co.ug/tariffs/mobile-money-tariffs/
- Official account and agent cash-in qualifications: https://www.mtn.co.ug/helppersonal/key-facts-document/
- Rechecked all 13 send bands and 13 agent-withdrawal bands; published fees match the existing catalog. Send covers MTN and other mobile networks. ATM and bank-transfer columns are outside the exposed actions.
- Agent cash-in is free; this does not cover transfers from a bank. Account tiers and available balance restrict actual eligibility. The tariff page publishes UGX 500 minimum and UGX 5,000,000 maximum transaction size. The account facts page gives tier-specific limits and contains an ambiguous medium-tier number; no inferred numeric tier rule was added.
- Withdrawal tax is separately deducted. The current tariff page gives tax ranges, including a final maximum of UGX 35,000 that is not consistent with simply extrapolating the historically stated 0.5% rate to UGX 5 million. Exact tax rounding and this discrepancy remain unresolved. No new tax formula was introduced.
- Before: UGX 500 withdrawal displayed **Total debited 830 UGX**, despite excluded tax. After: **Amount + published fee (tax excluded) 830 UGX**; engine `totalDebited` is `null`, `totalIncludesAllCharges` is `false`, and `amountPlusPublishedFee` is 830. Unknown tax is never represented as zero.

### Airtel Tanzania

- Current rendered official navigation: https://www.airtelmoney.tz/tarrifs_tz
- Its linked document: https://cdn-webportal.airtelstream.net/website/airtel-money/tanzania/assets/pdf/Airtel-Money-Tarrif-English-2026.pdf
- Downloaded, parsed with PyMuPDF, and visually inspected the single rendered page. PDF SHA-256: `637d709c1bd921ee5e7aaba707f7e9c56b4626b0a31c4ef818f0d65b178b3bdc`.
- **The PDF explicitly says January–March 2026.** Being linked today does not establish September validity. All locale results and static tables state that current validity is unconfirmed. `lastVerified` records source inspection, displayed as **Source checked**, not a newly effective tariff. `effectiveDate` is unknown; `sourcePeriod` is January–March 2026 and confidence is `official-dated-reference`.
- Transcribed all 24 bands for the already exposed Airtel-to-Airtel send and agent-withdrawal actions, TZS 100–5,000,000. Other-network, bank and merchant columns are deliberately not treated as the same action. Deposit remains unavailable. Actual account-tier limits require confirmation with Airtel.
- Published withdrawal totals already include the government levy. At TZS 3,000 the document has transaction fee 576 + levy 14 = total charge 590. The stored reference previously returned 604. All seven old withdrawal totals differ from this document; all seven send rates agree. The old April 2024 PDF URL now returns an HTML application shell, so the historical reason for the discrepancy is not proven. We do not claim the old PDF itself was miscalculated.
- Historical April 2024 ledger row remains with a superseded-reference note. The overall fintech ledger review date is unchanged; this is only a two-provider review.

## Source owners and bounded regeneration

- Catalog: `data/fintech/mobile-money-tariffs.json`; source ledger: `data/fintech/official-sources.json`.
- Pure arithmetic and null-total contract: `assets/js/engines/mobile-money-quote-engine.js`.
- Native caveats, source labels and static table output: `scripts/build-mobile-money-fee-finder.js`.
- Normal full regeneration semantics remain unchanged. Explicit `--sync-tariff-tables` replaces exactly one owned table heading, identified by its canonical table lead, and the one `data-mobile-money-tables` container. Nested div depth determines its closing boundary. Missing, duplicate or unclosed containers fail. `--sync-runtime-config` remains the separate exact configuration owner.
- These modes preserve all other bytes, including release metadata, analytics loader, cache hashes, structured data and related-tool SSR. Tests check retained release header and SSR text, correction of an old fee, idempotence and malformed owner boundaries. Normal generator check reports zero drift for all three routes.

## Validation

- `node --test tests/mobile-money-tariff-source-review.test.js tests/mobile-money-runtime-config-sync.test.js`: **10 passed**. Independent official fee columns cover each lower/upper boundary of all 74 send/withdrawal bands, adjacent transitions, outside limits, agent cash-in endpoints, government levy components and unknown-tax null semantics.
- `node tests/mobile-money-quote-engine.test.js`: passed.
- `node tests/mobile-money-fee-finder.test.js`: passed.
- `node scripts/update-fintech-source-ledger.js --check`: passed; ledger-wide historical review date retained.
- `node scripts/build-mobile-money-fee-finder.js --check`: 3 routes, zero drift.
- Chromium: `mobile-money-tariff-truth.spec.js` plus existing `mobile-money-fee-finder.spec.js`: **7 passed in 33.0 seconds**, own server 4234, evidence `../tariff-truth-proof`. EN/FR/SW real rendered results, native dated-reference warnings, MTN tax-excluded label, deposit, Airtel components, maximum band, new send band, invalidation outside range, 375/390px layout and existing manual JSON export.
- Syntax and `git diff --check`: passed.

## Remaining limits

Current Airtel validity, account-specific eligibility and MTN exact tax remain unverified. The engine is a published-reference calculator, not a current operator quote or transaction guarantee. No Orange tariff support was added. No new tariff export format, provider API, AI send, analytics event or route change. Full release build, security and production checks remain with the coordinator; this evidence is source and local-browser evidence only.
