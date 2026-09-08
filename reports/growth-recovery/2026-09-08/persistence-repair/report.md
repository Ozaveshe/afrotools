# Scraper persistence reporting repair

The rates producer and shared scraper runner previously emitted successful completion after `setData` returned false. September 8 Netlify logs confirmed this behavior alongside failed Supabase transport, skipped Blobs writes and retained August 24 payloads. The investigation evidence is preserved separately in commits `19572cf0` and `53962323`; this repair starts from freshly fetched `origin/main` `9b29eab0408eedd9442c98c2cabf567098da80ab`.

Implementation commit: `d7e41d5332d2590c9e4e802337f12b5bf02ac104`; additional thrown-run-logger regression: `41a75abbc5dc85751339ee24c43ef06404b9e244`. Branch: `codex/fix-scraper-persistence-reporting-20260908`. The source repair is separate from the indexing and combined product candidates.

## Behavior and scope

- `netlify/functions/scheduled-fetch-central-bank-rates.js` now checks the persistence result. Failure returns 503, records only failure status/error/last_attempt through best-effort metadata, and skips success freshness and completion claims.
- `netlify/functions/_shared/scraper-base.js` returns 503 before publishing confidence or success metadata when persistence fails. It preserves previous freshness/confidence/source/count fields, attempts a neutral error run record and retains failure even when metadata/logging throws. Successful persistence still follows the original success path.
- `netlify/functions/_shared/storage-diagnostics.js` emits only allowlisted operations, dataset/table labels, transport codes, normalized abort/timeout names and bounded HTTP status codes. Unknown labels/codes become `unlisted`/`UNKNOWN`. Arbitrary error messages, objects, URLs, headers and bodies are never serialized by this helper.
- `netlify/functions/_shared/data-store.js`, the scraper insert logger and `scripts/refresh-static-fallbacks.js` use those diagnostics at storage failures. Failed HTTP responses no longer have their raw bodies read into error logs. Malformed refresh JSON also produces a sanitized diagnostic.
- `tests/storage-persistence-reporting.test.js` exercises real handlers/helpers in isolated VM contexts with synthetic data and mocked network/storage. No real provider or database is called.

No retry policy, timeout budget, schedule, provider, credential, live configuration, data contract or freshness threshold changes. The existing `setData` boolean remains true if either configured backend succeeds; tests explicitly retain both Supabase-success and Blob-success cases. No broad persistence semantics were changed for other data-store callers.

## Consumer review

All 11 direct shared-runner wrappers were inspected and tested for result propagation and both persistence outcomes: agriculture inputs, commodities, crypto, electricity, fuel, insurance, property, salaries, shipping, stocks and telecom. Each returns the shared runner's result and supplies its existing dataset/meta identifiers.

The 24 direct server-side data-store importers were also inventoried: seven public data/API entrypoints; the shared API cache; scheduler/proof and scholarship helpers; forex, rates and other data producers; change detection, gazette scanning and the source-health watchdog. `getData`, `setData` and `updateMeta` signatures, fallback order, payload shapes and success booleans are unchanged. Only the rates/shared-runner failure outcomes change; other importers receive reduced, safer error diagnostics. Existing live-data, scheduled-proof and rates API contract checks cover representative integrations, alongside the broad suite.

## Synthetic regression evidence

The targeted matrix covers 37 cases:

- Each of 11 wrappers propagates failure; the real shared runner is tested for success and failure under each wrapper's IDs/meta mapping.
- Failed persistence cannot advance last_fetch/as_of/confidence/source/count/verification fields. Only failure status/error/last_attempt are attempted; confidence rows are not published.
- A failed metadata write, failed scraper-run insert or thrown run logger cannot convert 503 to success or emit Complete/updated.
- Rates success and failure, including failure-metadata exceptions, preserve their respective contracts.
- ENOTFOUND, certificate failure, abort, timeout and unknown errors use allowlisted diagnostics without exposing synthetic sensitive content. No timeout is introduced.
- HTTP errors do not read response bodies; malformed JSON is sanitized; incompatible data is rejected before any persistence attempt; either backend's success preserves the existing boolean contract.

Final command outcomes and logs are in the accompanying handoff. An initial broad test/hreflang attempt overlapped build generation and was not accepted as settled evidence; it was stopped/replaced with post-build checks. The initial security scan flagged the fake test constant named SECRET; it was renamed SENSITIVE_FIXTURE, without changing scanner rules or weakening test coverage. The final scanner passed.

## Final validation

- PASS: 37 targeted persistence/diagnostic cases; existing live-data, scheduled-proof and rates API contracts; changed JavaScript syntax checks; lint; type-check; dictionary validation; security scan.
- PASS: full `npm run build:deploy`, followed by `npm run audit:dist` (17,907 copied files). Unrelated generated source churn was restored before the settled source checks.
- PASS: settled `npm run validate:hreflang` (11,517 pages; 32,446 relationships) and `npm run seo:report` (no listed metadata, hreflang or broken French homepage-link issues).
- FAIL, baseline-only: settled `npm test` completed all 776 files with 2,046 passing tests and one failing test; all seven audits passed. The carried `ai-tool-context-drift.test.js` failure was reproduced in the clean investigation worktree at `539623239e4775071737ddc79a8851e306d0b251`, whose only changes from base `9b29eab0` are evidence files. The stale committed FX context differs from the builder's current stale-data warning. The generated context is outside this source repair.
- FAIL, independent existing blocker: `npm run data:fallbacks:check`; all four committed snapshots exceed 10,080 minutes. No threshold or timestamp was altered.

The built artifact is local build evidence only. It is not deployed or an exact final integration artifact; the coordinator must rebuild and validate the final integrated revision before any release.

## Release and limitations

These are server-only source/script/test changes. There is no user-facing page, route, SEO, analytics, localization, export, consent or database-schema change. No screenshot is required. Unrelated generated build output must be excluded from the source candidate. No live job invocation, database write, merge or deployment was performed.

This repairs reporting and diagnostics, **not the underlying transport failure or dataset freshness**. Netlify scheduled functions do not expose response bodies as public pages; the 503 is the handler contract and testable failure result, not a claim about platform retries or delivery guarantees. Operational logs and preserved metadata now describe failure instead of claiming updated data. The known four-dataset freshness gate remains an independent release blocker until real source-backed payloads are persisted and refreshed by their owners.

Rollback: revert the source repair commits. There is no migration, feature flag or data transformation to undo. Coordinator integration still requires independent review and an exact final deploy artifact.
