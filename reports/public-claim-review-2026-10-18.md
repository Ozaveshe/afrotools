# Qualified public claim review — 18 October 2026

This review renews only `performance.measured-support`, `account.optional-sync` and `vault.explicit-cloud-upload` after a current evidence check. Their approved meanings, permitted wording, five translations, exceptions and prohibited-pattern rules are unchanged. Verification records this qualified evidence review, not production end-to-end acceptance. The existing seven-day cadence is retained: verified 18 October, review after 25 October 2026.

## Current named-route measurement

An off-tree safety adaptation of `scripts/mobile-network-smoke.js` measured the exact source artifact for `853cfcd88d1c9ad36cffe31b34a8fe28c22c51be`. It retained the original six routes, 390×844 viewport, 900 Kbps download, 350 Kbps upload, 220ms RTT and 4× CPU profile. Chrome 155.0.8059.80 and Playwright 1.59.1 ran locally. Other origins were blocked and service workers disabled before navigation. Outputs were kept outside the repository.

| Route | HTTP | Load | LCP | Result |
| --- | ---: | ---: | ---: | --- |
| `/` | 200 | 14,354ms | 6,860ms | WARN |
| `/search/` | 200 | 7,625ms | 3,872ms | WARN |
| `/salary-tax/` | 200 | 3,997ms | 3,240ms | PASS |
| `/nigeria/ng-salary-tax` | 200 | 8,784ms | 5,124ms | WARN |
| `/tools/mobile-money-fees/` | 200 | 6,577ms | 2,468ms | WARN |
| `/telecom/airtime-value/` | 200 | 8,373ms | 4,548ms | WARN |

All six documents loaded without timeouts; one PASS and five WARN results remain. Overflow was 0px and no measured controls were below 16px. Search, Nigerian PAYE, mobile money and airtime retained CLS warnings (0.158, 0.109, 0.184 and 0.128). The two telecom/freshness Functions were unavailable on this static server. The run took 60.872 seconds; 226 served reads totaling 5,511,209 bytes matched the frozen artifact manifest by length and SHA-256, with post-run physical rechecks. All 66 other-origin requests were blocked. Owned browser/server processes, profile and listener were closed and independently checked.

This is a current first-party local measurement with an explicitly adapted transport, not an unchanged-original-script pass, production benchmark, carrier measurement, 2G guarantee, offline-navigation test or all-device compatibility claim. The slow-load and layout-shift warnings remain actionable. A separate current pure offline-stamp fixture passed one test; it proves cache-version invalidation only. Other named offline fixtures were read as source, not newly executed.

The first adapter attempt returned six 404 responses because of a Windows path-separator guard error. It is retained as a failed setup attempt and excluded from the above measurement. The corrected adapter preflighted all six document hashes before browser launch and latched artifact errors as fatal.

### Historical report correction

The committed `reports/mobile-network-smoke.json` and `.md` are dated **2 October 2026**, with home load 16,708ms and LCP 6,292ms. The 10 October review cites different off-tree metrics (17,643ms and 6,896ms) while pointing to those committed reports. Those committed metrics must not be described as 10 October or current measurements. The old reports and their evidence are preserved; the current measurement above is separately dated and pinned.

## Optional account synchronization

Current source review covered `assets/js/lib/workspace-sync.js`, `netlify/functions/api-workspace.js` and `netlify/functions/_shared/browser-session-auth.js` at the same source base. An isolated VM executed their actual source with synthetic users, tokens, local storage and fetch responses. No real account, token, credential or network request was used.

The current synthetic contract set passed 18 checks across account and vault behavior. Workspace checks establish that local writes do not implicitly send cloud requests; signed-out requests are rejected; permission withdrawal before or during token lookup prevents sending; an explicit upsert sends the selected supported payload; and a service failure retains the local draft without a success change event. The actual authentication verifier rejected an invalid synthetic token response. API GET, POST and DELETE scoped operations to the verified synthetic user despite a forged caller `user_id`; missing selectors and oversized payloads were rejected, and service errors remained failures.

The workspace API uses a service role after authentication, so its explicit verified-user scoping remains material alongside RLS. These checks do not establish real token validity, complete account UI behavior, cross-device synchronization or every supported item adapter.

## Explicit private vault upload and current metadata

Actual `assets/js/afro-vault.js` executed against a synthetic Supabase client. Signed-out, unavailable-service and reached-limit cases did not initiate an upload. An explicit synthetic PDF upload used the signed-in user's folder and matching metadata identity. Storage and metadata failures returned failure; metadata failure attempted compensating removal. These are source-contract checks, not a real cloud transaction or a guarantee that compensation, quota enforcement or deletion succeeds.

On 18 October at 02:44:30 UTC, the configured `supabase_afrotools` MCP first verified the exact AfroTools project URL. A metadata-only query established:

- `workspace_items` and `vault_documents` have RLS enabled, with authenticated own-user SELECT, INSERT, UPDATE and DELETE policies.
- The `vault` bucket is private, with a 10,485,760-byte limit and PDF, PNG and JPEG MIME types.
- Vault storage SELECT and INSERT policies require the `vault` bucket and the signed-in user's first path folder. The current policy set also includes authenticated own-folder SELECT and DELETE policies across buckets. The 10 October statement that no DELETE policy was established is historical, not evidence of current absence.

No customer rows, tokens, files or credentials were read; no live writes occurred. Real upload, signed download, deletion, cleanup, retention, quota atomicity and cross-device behavior remain unverified. The client does not turn local downloads into implicit uploads. Its service-error paths and conditional availability support the existing bounded wording, not permanent storage, unlimited capacity or blanket security guarantees.

Current metadata references are `live-read:afrotools-2026-10-18-workspace-rls` and `live-read:afrotools-2026-10-18-vault-bucket-and-rls`.

## Reproducibility and evidence identity

The producer review packet retains scripts, exact source inputs, all observations, failed attempts and cleanup proofs. Stable SHA-256 evidence identities:

- Current measurement JSON: `43e19d856bdcde7a4b20acec391dbdd189c9a0f4413a14215afe01c74df42353`.
- Safety adapter source: `dba7490d3b52f0b0d09486186698b48894ebf973d2aff68954b96f9bf37d1097`.
- Current performance packet: `b05f63549e1b5b42fcfcda4e31e464e7c37479de58af8fa9fb27e02626cd2ffc`.
- Current aggregate metadata: `615a6cda6ad94421b0c1a7ea859e1ee6f574782004f6af4e12eea49a10adb724`.

The source-contract script and its 18-check result are pinned in the producer packet. Full build, final generated claim audit, exact-head CI, public access and publisher deployment acceptance remain separate gates. This review changes no customer-facing wording, service implementation, rates, counts or other claim review dates.
