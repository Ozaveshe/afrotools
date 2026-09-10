# Operator command centre

The private command centre at `/mc-7a2f9x.html` combines a dated repository snapshot with an hourly, read-only operational summary. It ranks review directions deterministically; it does not merge, deploy, repair apps, or infer quality from an app name.

## Hourly observer

Run `node scripts/sync-operator-engine.mjs --repo <AfroTools checkout> --publish` from a checkout containing this script. The default run without `--publish` only writes ignored `artifacts/operator-engine/latest.json`. The configured Codex heartbeat runs while this PC and Codex are available. It is an observer, not a producer or publisher, and does not create producer handoff receipts.

The collector verifies the Git remote, fetches `origin/main`, inspects registered local worktrees, reconciles schema-v1 receipts using the existing handoff validator, and reads GitHub checks and open PRs through the authenticated `gh` CLI. Git file changes are counted without exporting file paths or contents. Pending commit IDs are capped at eight per workspace; branch counts can overlap. A commit older than seven days is a review signal, not proof of workspace inactivity. Old or missing receipts cannot establish current scheduler success.

For uploads, the collector uses the existing Netlify CLI login, verifies the fixed AfroTools site ID, and writes a site-scoped Netlify Blobs store named `operator-command-centre`, key `latest`, using strong consistency. It verifies the written timestamp and project identity. `NETLIFY_CLI_ROOT` can identify a nonstandard CLI installation. Tokens are never written into summaries, logs, or the browser. A failed collection does not overwrite the published record with an all-unavailable summary; partial source failures remain explicit. A failed upload must not be reported as a successful refresh.

## Feed-run evidence

Use the configured `supabase_afrotools` MCP first. Verify `get_project_url` equals `https://zpclagtgczsygrgztlts.supabase.co`, then execute this read-only aggregate:

```sql
select scraper_id, max(fetched_at) as latest_at,
  (array_agg(status order by fetched_at desc))[1] as latest_status,
  count(*) filter (where fetched_at >= now() - interval '24 hours')::int as runs_24h,
  count(*) filter (where fetched_at >= now() - interval '24 hours'
    and lower(status) in ('error','failed','failure'))::int as failures_24h
from public.scraper_runs
where fetched_at >= now() - interval '7 days'
group by scraper_id order by max(fetched_at) desc limit 80;
```

Write only `{schema_version:1, project_ref:"zpclagtgczsygrgztlts", checked_at:<actual successful read time>, rows:<query result>}` to ignored `artifacts/operator-engine/runtime.json` in the collector checkout. Never include raw logs, errors, prompts, or user records. If MCP is unavailable, preserve the previous timestamp and data; the collector marks evidence older than two hours stale. Observed feed jobs do not prove all scheduled functions ran. This query does not evaluate per-feed source freshness.

## Web boundary and evidence

`/api/operator-dashboard/operations.json` is GET/HEAD only and uses the existing signed operator cookie. Missing or invalid store data returns 503; unauthenticated access returns 401. The API applies an allowlisted projection and all private responses have browser/CDN `no-store` headers. No write endpoint is exposed. Refresh summary rereads the last uploaded summary; it cannot scan the PC remotely.

The repository snapshot remains separately dated. Pro readiness, low quality grades, image review signals and source cadence are authored/audited evidence, not live acceptance scores. Refresh the owning reports and rebuild `scripts/build-operator-dashboard.js` when those definitions change. Focus tasks and image task progress stay in this browser's local storage.

Validation: `node --test tests/operator-engine.test.mjs tests/operator-dashboard-auth.test.mjs tests/operator-dashboard.test.js`; `npx playwright test --config=playwright.operator.config.js`; release security/build/dist checks. The local browser harness uses synthetic operational data. The live verifier separately checks login, authenticated summary, navigation, overflow and logout without printing credentials. Pause the hourly heartbeat to stop uploads; roll back the command-centre commit to restore the previous UI and endpoint. The Blobs summary is independent of deploy history.
