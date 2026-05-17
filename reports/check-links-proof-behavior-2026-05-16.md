# Check Links Proof Behavior - 2026-05-16

## Scope

Prompt 102 investigated why `npm run check-links` was reported as ending after redirect loading during the Prompt 100 Swahili gate, even though an equivalent all-site resolver found 0 broken internal links.

No route content, Swahili page copy, registry data, French pages, Hausa pages, cars pages, `dist/`, sitemap files, or generated output were edited.

## Findings

- `package.json` maps `npm run check-links` directly to `node scripts/check-links.js`.
- The checker scans the full source tree, excluding `.claude`, `node_modules`, `afrotools-deploy`, `.git`, and `dist`.
- The Prompt 100 behavior was reproducible as a proof-tooling gap: the checker could remain quiet for a long time after `Loaded 3013 redirect rules.` while resolving internal links.
- A long-timeout run before the script patch completed successfully:
  - HTML files scanned: 8473
  - Redirect rules loaded: 3013
  - Broken internal links: 0
  - Runtime: 860.3 seconds

## Patch

Updated `scripts/check-links.js` so route proof is explicit and faster:

- Precomputes the source-tree file set once instead of repeatedly walking path segments for each href target.
- Keeps case-sensitive path matching by comparing normalized resolved file paths as strings.
- Retains the existing redirect-rule fallback.
- Prints the number of checked internal links in the final success or failure summary.

## After Patch

`npm run check-links`:

- Status: passed
- HTML files scanned: 8473
- Redirect rules loaded: 3013
- Internal links checked: 80761
- Broken internal links: 0
- Runtime: 21.8 seconds

`node --max-old-space-size=4096 scripts/check-links.js`:

- Status: passed
- HTML files scanned: 8473
- Redirect rules loaded: 3013
- Internal links checked: 80761
- Broken internal links: 0
- Runtime: 15.6 seconds

## Verdict

Fixed. The npm wrapper was not pointing at the wrong command, but the checker behavior was too quiet and too slow for a proof gate on the current tree. It now exits with a clear success summary and no broken internal links.
