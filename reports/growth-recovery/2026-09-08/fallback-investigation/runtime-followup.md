# Runtime follow-up: persistence failures confirmed

This read-only follow-up supplements evidence commit `19572cf0`. It establishes that the Netlify schedules are running and identifies failed persistence plus misleading handler success reporting. It does not identify the underlying DNS/TLS/socket cause or unblock data freshness.

## Verified owners and deployment

Configured Netlify project/deploy readers verify site `8aa543db-b4bd-4631-98f8-221440055c41` is AfroTools. Production deploy `6a943bd4d576e90008175f76` is ready, published August 30 at 14:30:41Z, and carries exactly source commit `9b29eab0408eedd9442c98c2cabf567098da80ab` used for this inspection. Deploy metadata confirms both schedules and functions:

- `scheduled-fetch-fuel-prices`: `13 */6 * * *`, Node22.
- `scheduled-fetch-central-bank-rates`: `28 */12 * * *`, Node22.

`netlify.toml:46` and `:49` own those schedules. GitHub's weekly workflow only copies stored payloads into static fallbacks; it does not own fuel/rates collection. `scripts/audit-live-automation-health.js:38` explicitly maps central-bank health to the rates metadata category because that older producer does not use the shared scraper-run logger.

The configured Netlify connector exposes project/deploy readers but no function-log operation. Installed **Netlify CLI27.0.0** does expose read-only historical function logs. It was used with the verified site ID, explicit two-function filters, exact time windows and no `--follow`. No function was invoked and no project link/configuration was written. Evidence is in `runtime-logs-redacted.json` and `runtime-correlation.json`.

## Time correlation

| Window/event | Netlify evidence | Supabase evidence |
|---|---|---|
| September8 00:13 fuel | Started; reports GlobalPetrolPrices/54 records; Supabase fuel read and write both `fetch failed`; Blobs unconfigured in scheduled context; static fallback loaded; metadata writes and scraper-run inserts also fail. Local logger emits an error run with `fetched_at=2026-09-08T00:13:09.227Z`, duration7699ms, reason `Blob write failed`. The handler then prints Complete. | Relevant 00:10–00:40 window contains zero `live_data_store` edge requests. Durable fuel payload and last scraper-run row remain August24. Failure of the logging insert explains why scraper_runs alone did not show the invocation. |
| September8 00:28 rates | Three start-message groups at00:28:02.945,00:28:18.976 and00:28:35.816; each reports seven verified country records and World Bank enrichment, but rates/meta Supabase reads and writes fail. Blobs writes are skipped; static seed is read. Complete is printed despite failure. | Same zero-request edge window and retained August24 rates payload. CLI rows do not include invocation/request IDs; do not infer retry or duplicate-trigger cause from three timestamp groups alone. |
| September8 00:00–04:20 aggregate | Only the two selected functions were inspected. | Shared `live_data_store` traffic includes71GET200,1GET503 and42POST200. This rules out claiming a project-wide outage; it does not attribute those successful writes to fuel/rates because request bodies/dataset values were not fetched. |
| August24 00:00–01:00 | Historical CLI query succeeds but returns zero rows. Retention versus absent historical log data cannot be distinguished. |52GET200 and39POST200 for `live_data_store`; compatible with retained payload/run timestamps, but aggregate requests cannot independently identify the payload key. |

The rates completion lines are collection/verification messages, not proof of persisted fresh data. Fuel's 54-row count also does not prove every row was newly observed: the source function can reuse previous rows. No payload promotion follows from these logs.

## Target and environment verification

- Production deploy commit matches the inspected source: **true**.
- `_shared/data-store.js:17` and `_shared/scraper-base.js:24` hardcode the expected AfroTools Supabase hostname: **true**. Those deployed paths do not select the target from `SUPABASE_URL`.
- Read only the nonsecret `SUPABASE_URL` key via `netlify env:get`, production context/functions scope. Present: **true**; expected project hostname matches: **true**. Only booleans were emitted and saved in `runtime-url-match.json`.
- Both source owners accept `SUPABASE_SERVICE_ROLE_KEY`, then `SUPABASE_DATA_SERVICE_ROLE_KEY`, then `SUPABASE_SERVICE_KEY`. The observed Supabase write-error branches execute only after a truthy key was selected, and the scraper logger attempts DB inserts instead of taking its missing-key early return. Thus at least one accepted key was present at those invocations. This does **not** prove which alias, validity, expiry or effective configuration source.
- Exact secret variable names/contexts remain unverified: the installed documented `getEnvVar/getEnvVars` APIs return values and offer no metadata-only selector. Listing or getting those keys would retrieve service-role values, contrary to scope. No secret key was queried. The needed capability is a provider-side key-name/scope/context-only inventory or an owner-supplied redacted inventory, not the secret values themselves.

## Smallest source proposal for review, not implemented

1. **`netlify/functions/scheduled-fetch-central-bank-rates.js:769`**: capture the boolean returned by `setData('rates-latest', data)`. If false, return a non-success result and emit a persistence-failure message. Do not emit `Rates data refreshed`/Complete or advance `meta.rates.last_fetch`/success verification metadata for unpersisted data. Best-effort failure metadata should use `last_attempt`, preserve last-known-good freshness fields and keep `status: write-failed`. Success behavior remains unchanged when persistence returns true.
2. **`netlify/functions/_shared/scraper-base.js:294–328`**: the shared runner already logs an error when `written` is false, but unconditionally returns200 and an updated/Complete message. Branch the final result and message on `written`; retain a truthful failure result even if metadata or log writes also fail. Do not advance success freshness/confidence metadata on failed persistence. Replace the misleading backend-specific `Blob write failed` reason with storage/persistence wording because both Supabase and Blobs may fail. This helper affects multiple scraper jobs, so it needs separate review and shared regression coverage.
3. **Transport diagnostics, separately scoped**: `_shared/data-store.js` read/write catches, `_shared/scraper-base.js` insert catch, and `scripts/refresh-static-fallbacks.js:51` should expose only dataset/operation plus a whitelisted `error.cause.code` and bounded timeout classification. Never include request headers, credential values, query payloads, raw provider response bodies or arbitrary nested error objects. No new provider, live configuration change or larger freshness threshold is justified by the evidence. These diagnostics distinguish later DNS/TLS/socket/timeout failures; they do not repair the already-observed transport path by themselves.

Proposed regression matrix (synthetic mocks, no network/database writes):

- `setData=false` for rates and shared runner: non-success response; no updated/Complete claim; existing last_fetch preserved; failure status/last_attempt allowed; failed metadata/log persistence cannot turn the result back into success.
- `setData=true`: existing success result and metadata preserved.
- Contract rejection versus network exception: retained last-known-good data and distinct sanitized failure classification.
- Mock `ENOTFOUND`, certificate failure and abort/timeout: allowlisted codes only; synthetic secrets in error strings/headers/body never reach captured output.
- Existing calculation, live-data contract and scraper-owner tests remain passing. Function changes require the normal security/build/dist checks before integration.

No code/config patch was made because the coordinator requested owner paths and regression proposal before changing shared persistence. The immediate data blocker remains: failed runtime persistence plus incomplete/old source payloads. Fixing false success reporting makes failures actionable; restoring the transport path and validating real source observations are still required before running the unchanged four-dataset refresh.
