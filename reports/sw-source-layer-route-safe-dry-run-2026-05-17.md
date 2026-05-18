# Swahili Source-Layer Route-Safe Dry Run - 2026-05-17

Prompt 134 verified the existing dry-run route-safety layer. No page packs were created and `scripts/build-i18n.js` was not edited.

## Dry-Run Proof

Command:

```bash
node scripts/build-i18n.js --lang sw --page ghana/gh-paye --dry-run
```

Result:

```text
[dry-run] sw ghana/gh-paye: ghana/gh-paye.html -> sw/ghana/kikokotoo-kodi-mshahara/index.html (route-alias-aware, no page pack)
[sw] Built 0 pages
Total: 0 pages built, 1 skipped, 0 errors
```

The dry-run correctly reports the canonical Swahili output path for Ghana PAYE without writing files.

## Verdict

Dry-run route safety is verified for PAYE metadata planning, but route-safe page packs are not yet feasible for real builds. The real writer is still not alias-aware, so a real `lang/pages/**/sw.json` PAYE pack must wait for writer routing and curated-page overwrite protection.

Validation:

- `npm run build:i18n:validate`: pass
- `npm run validate:hreflang`: exit 0 with carried reciprocal warnings
