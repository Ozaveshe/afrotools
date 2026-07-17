# Swahili Source-Layer PAYE Metadata Pilot - 2026-05-16

## Prompt 110 Decision

No Swahili page pack was created.

Prompt 109 added a dry-run-only route planner that can show the intended canonical Swahili output path for a PAYE source page. That is useful proof, but it does not make the actual writer safe. Real i18n writes still call `buildOutputPath(pagePath, lang)`, which would use the English source path unless the writer is changed in a later, dedicated prompt.

## Target Checked

Candidate: Ghana PAYE metadata-only page pack.

Dry-run proof:

```powershell
node scripts/build-i18n.js --lang sw --page ghana/gh-paye --dry-run
```

Observed plan:

```text
ghana/gh-paye.html -> sw/ghana/kikokotoo-kodi-mshahara/index.html (route-alias-aware, no page pack)
```

The route plan is correct, but it is a dry-run report only. Because the real output path is still not alias-aware, creating `lang/pages/ghana/gh-paye/sw.json` would be premature.

## Files Not Created

- `lang/pages/ghana/gh-paye/sw.json`

## Status

Source-layer migration remains blocked for real PAYE output until the build writer can safely target canonical Swahili aliases without overwriting curated hand-authored pages.
