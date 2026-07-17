# Swahili Source-Layer Pilot Review Gate - 2026-05-16

## Verdict

Design-only still blocked.

## What Was Reviewed

- `reports/sw-source-layer-route-safety-design.md`
- `reports/sw-source-layer-paye-pilot.md`
- `scripts/build-i18n.js`
- Candidate page: `ghana/gh-paye`
- Candidate Swahili route: `sw/ghana/kikokotoo-kodi-mshahara/index.html`

## Findings

- No `lang/pages/**/sw.json` PAYE pilot was created.
- No Swahili PAYE HTML was regenerated.
- Dry-run output planning now reports the canonical Swahili alias for `ghana/gh-paye`.
- Real build writes still use `buildOutputPath(pagePath, lang)`, so the writer itself is not route-alias-aware.

## Validation

```text
npm run build:i18n:validate: pass
npm run validate:hreflang: pass with 2 carried non-blocking warnings
npm run seo:report: pass with 20 carried French JSON-LD auto-fix candidates
```

Hreflang warnings observed:

- `fr/tools/generateur-nom-entreprise/index.html -> tools/business-name-gen/index.html` not bidirectional
- `sw/blogu/index.html -> fr/blog/index.html` not bidirectional

## Gate Decision

Do not create Swahili page packs yet. The next source-layer implementation prompt should make actual output writes alias-aware and include overwrite protection for curated hand-authored Swahili pages before any metadata-only PAYE pack is added.
