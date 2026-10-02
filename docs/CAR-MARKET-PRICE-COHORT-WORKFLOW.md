# Comparable car asking-price snapshots

The existing snapshot command now emits separate drafts for each reviewed market,
trim label and engine displacement within the requested model/year, country,
condition and currency. The four positional arguments remain unchanged:

```bash
node scripts/car-market-snapshot-sql.js VEHICLE_ID NG foreign-used NGN
```

Use the actual city or local market in observation `market`, a checked variant in
`trim_label` and the listing's verified displacement in `engine_cc`. Do not fill
missing values from a catalog average, country name or another ad. Unknown or
placeholder labels, missing displacement, incomplete groups and repeated listing
URLs cannot produce drafts. Every group needs at least three accepted current
URLs observed within 14 days. A draft remains subject to source permission,
inventory, duplicate, price-outlier and specification review.

Case and spacing normalize for comparison. Trim aliases, facelift years,
drivetrain and transmission are not inferred. Distinguish their actual variants
during review; the ledger does not yet store dedicated transmission/drivetrain
fields. Mileage and equipment can still vary within a group, so the result is an
asking-price sample rather than a sale valuation or a national price index.

The public exporter captures market, trim and engine facts from both the current
accepted observation and its immutable revision. It excludes mixed or incomplete
groups, mismatched snapshot markets and changed historical cohorts. Public output
adds `trimLabel` and `engineCc` alongside `market`; these fields describe the
checked group. Newest-snapshot selection retains different groups for the same
model/year and condition. Legacy captures without these facts must be recaptured;
legacy mixed snapshots must be regenerated and reviewed instead of being assigned
an invented trim or engine.
An older snapshot with no market does not suppress a newly scoped draft with the
same member revisions. The exporter holds back that older unscoped snapshot.

No database migration, source approval, public consumer or price-pack replacement
is introduced by this change. Private browser research remains outside accepted
observations and snapshots. Empty exports remain empty. The publisher owns source
integration and any eventual product connection.

Validation uses synthetic fixtures only:

```bash
node --test tests/car-market-snapshot-sql.test.js tests/car-market-public-export.test.js
node tests/support/car-market-cohort-regression-sql.js
node tests/support/car-market-history-regression-sql.js
```

The latter commands emit rollback-only SQL. Verify the configured AfroTools MCP
project ref `zpclagtgczsygrgztlts` before executing it. Confirm zero remaining
synthetic sources, observations and snapshots afterwards. The cohort regression
checks separate city/trim/engine groups, unknown facts, small samples, duplicate
URLs, correct medians, repeat-generation idempotence and legacy replacement. The history regression
refreshes the entire synthetic group before rebuilding its reviewed snapshot;
one changed variant plus two old variants must not become a three-ad group.
