# Hreflang Root Cause V2

## Before

Command: `npm run validate:hreflang`

- Pages scanned: 7,889
- Warnings: 836
- Errors: 0
- Warning type: non-bidirectional hreflang links

Grouped by language family:

| Family | Warnings | Cause |
|---|---:|---|
| Swahili | 743 | Swahili pages linked alternates that did not reciprocate from the paired page. |
| Hausa | 93 | Hausa pages had the same reciprocity gap. |

## Fix

Command: `node scripts/fix-hreflang-reciprocity.js`

Result:

- 836 reciprocal tags added.
- 0 required tags added.
- 1 duplicate tag removed.
- 791 files changed.

## After

Command: `npm run validate:hreflang`

- Pages scanned: 7,889
- Pages with hreflang tags: 7,887
- Hreflang pairs: 20,495
- Warnings: 0
- Errors: 0

## Release Note

The SEO issue was real, not just expected missing translation coverage. The fix is broad generated/localized HTML churn, so it should be reviewed and regenerated in the normal release workflow rather than hand-curated file by file.
