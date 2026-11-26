# Qualified public claim review — 26 November 2026

This review covers only `performance.measured-support`, `account.optional-sync` and `vault.explicit-cloud-upload`. Their meanings, permitted wording, five translations, prohibited absolutes and implementation are unchanged. The review remains qualified; it is not a certification of live cloud availability, bucket privacy, RLS, deletion, universal performance, offline access or 2G support. Seven-day review cadence is retained: next review 3 December.

## Current named-route measurement

Fresh Edge contexts measured the six named production routes at 390×844, 900/350 kbit/s download/upload, 220 ms latency and 4× CPU throttle. Each route returned HTTP 200 and displayed its heading. One sample per route measured DOMContentLoaded only:

| Route | DOMContentLoaded ms |
| --- | ---: |
| `/` | 3786 |
| `/search/` | 1609 |
| `/salary-tax/` | 1816 |
| `/nigeria/ng-salary-tax` | 2715 |
| `/tools/mobile-money-fees/` | 2226 |
| `/telecom/airtime-value/` | 2504 |

This is limited compatibility evidence for those named routes on the currently published site. It does not measure LCP, CLS, interactions, offline behavior, carrier performance or every device. It does not replace or turn the November 18 LCP/CLS warnings into passes. The new assembled artifact still requires its own browser acceptance.

## Conditional synchronization and explicit upload

The actual workspace client, workspace API, browser-session authentication helper, vault client and migration source match the November 18 reviewed bytes. The current 16-test synthetic CV cloud-consent suite passes, including no startup/focus transmission before a choice, permission withdrawal during token lookup, failed-service handling and diagnostic privacy boundaries.

Current actual-source client harnesses establish only these refusal/failure behaviors:

- Vault upload while signed out returns `not_logged_in`; a signed-in missing-client case returns `supabase_unavailable`. Both make zero network requests.
- Workspace reads while signed out or after permission withdrawal make zero requests. A simulated unavailable service makes one stubbed request and surfaces its failure.
- These fixtures make no real cloud upload, storage mutation, account transaction or customer-data read. Local exports remain a separate workflow.

Correct-project live metadata remains unavailable. The current configured Supabase MCP read failed after checking project identity. Earlier management evidence reports the project inactive with a billing-blocked restore. November 18 RLS/bucket observations remain historical and are not relabeled as current evidence. No new `live-read` marker is added.

The existing published wording is conditional on sign-in, explicit choice and actual service success/availability. This review supports those conditions and refusal paths only. Real upload, bucket privacy/RLS, quotas, cross-device transactions, signed downloads, deletion and retention remain unverified. A separate simulated deletion finding reports that the current client can return success after a storage-removal error; this review makes no deletion guarantee and does not include or duplicate that separate repair.

## Evidence and limits

Run: `daily-5pm-publish-deploy-gate/runs/20261126-source-recovery-01a1f9d0`.

Current independent evidence under the coordinator's November 26 visualization packet:

- `six-route-mobile-dom-20261126.json`: SHA256 `a7ef19e4467ea1afbf79e146d214cf5ff0f7fc7d973a77a8b279a7734b37c787`.
- `vault-unavailable-client-20261126.json`: SHA256 `64ab4c088613392bf87f6d59e2dda899b5d679d1ab55c99244720adc42e9fc21`.
- `workspace-conditional-read-20261126.json`: SHA256 `374fded23977c83aa089299be22cbef48d0a1dd3b539fc8f4cea693c6769c61d`.

Publisher evidence records the exact source hashes and passing `node --test tests/cv-cloud-consent.test.js` output. No live cloud-policy assertion is inferred from source identity or synthetic tests. No other claim's review date is changed, and no gate, prohibited pattern or data-flow contract is relaxed.
