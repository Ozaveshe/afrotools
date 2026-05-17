# Swahili Source-Layer Route Safety Design - 2026-05-16

## Scope

Prompt 109 reviewed the Swahili page-pack route-safety blocker before any metadata-only PAYE page pack is created.

## Finding

`scripts/build-i18n.js` already knows about canonical Swahili aliases through `SW_SLUG_TO_EN` and `existingSwPages`, and hreflang generation can point English source pages to curated Swahili routes. The build output path, however, still writes translated page packs to `/sw/<English pagePath>/` through `buildOutputPath(pagePath, lang)`.

That means a page pack for `ghana/gh-paye` would still be unsafe for real writes until the output writer itself becomes alias-aware.

## Patch

A dry-run-only route planner was added to `scripts/build-i18n.js`:

- `SW_EN_TO_SLUG` reverses the Swahili alias map.
- `buildDryRunOutputPlan()` resolves Swahili dry-run targets through the alias map.
- `logDryRunOutputPlan()` prints the source file, intended output file, and whether the route is alias-aware.

The patch does not change normal build writes. `buildOutputPath()` remains unchanged for real output.

## Proof

Targeted command:

```powershell
node scripts/build-i18n.js --lang sw --page ghana/gh-paye --dry-run
```

Observed output:

```text
[dry-run] sw ghana/gh-paye: ghana/gh-paye.html -> sw/ghana/kikokotoo-kodi-mshahara/index.html (route-alias-aware, no page pack)
[sw] Built 0 pages

Total: 0 pages built, 1 skipped, 0 errors
```

## Decision

Design patch is safe as a proof aid. It is not sufficient to create the PAYE metadata pilot yet, because real writes still use the legacy output path. Prompt 110 should not create a `lang/pages/**/sw.json` page pack until the actual writer can preserve canonical Swahili output paths.
