# Car price freshness audit

Run the static evidence check in strict mode during the daily car audit:

```sh
node scripts/audit-car-market-observations.js --json --strict-freshness
```

The JSON report records its actual audit time, configured `price-intelligence.json` freshness window, validation problems, stale keys and source dates, and starter profiles without Nigeria samples. Exit code 1 means a validation failure or, with `--strict-freshness`, an expired local or source-market sample. The default command retains its validation-only exit behavior and reports stale inputs as diagnostics.

For reproducible incident evidence, add `--as-of=2026-10-02T12:00:00Z`. That explicit clock is recorded in the report; do not describe it as the current audit time. Invalid clocks, calendar dates or missing evidence arrays fail the check.

Local sample freshness uses `reviewedAt`. Source-market freshness uses the original `sourceSnapshotAt`; a recent review cannot make an older source sample current. The window is measured in UTC, and a sample older than the configured number of days is stale.

This check reads the existing 27 starter price profiles and their separate static observation files. It does not count the full catalog, private browser research, accepted listing observations or published Supabase snapshots. Audit those layers separately through the verified AfroTools MCP. Empty evidence is a coverage gap, not a fabricated price or a freshness failure.

When the strict check fails, record the exact keys, basis dates and source-access blocker. Recheck real listing facts and source rights before proposing replacement observations. Do not change dates to clear the failure or publish private research as a replacement range. The publisher owns integration and deployment; this audit changes no price, public claim, route or image.
