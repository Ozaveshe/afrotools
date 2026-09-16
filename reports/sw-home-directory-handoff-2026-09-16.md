# Swahili homepage catalogue handoff

Scope: country/category search handoff only, not whole-app or catalogue acceptance.

The optimized baseline at 46c857a3 submitted Kenya, financial category and official-source preference but left results hidden with zero rendered results. The directory read only the text query.

Changes: apply country and category filters to registry-backed results, resolve country codes/slugs/native names, preserve choices when searching, and provide a reset link. Unknown countries match nothing. Canonical native registry metadata now takes precedence over historical localization overrides. This avoids an observed stale retirement-tool category mapping.

The source-type preference had no backing catalogue classification. It is removed from the generated homepage; legacy URLs explicitly disclose that it was not applied. Individual tool source review remains necessary. No new official-source certification is implied.

Validation: Swahili product owner check passed; git diff --check passed; three Chromium cases passed at 390px, including actual homepage submission, registry match inspection, country aliases, unknown values, legacy source preference, query preservation/reset and ordinary text search. The first run identified the stale retirement mapping, which was repaired before the final pass.

Not yet verified: full deployment build, production behavior, desktop/theme/a11y completeness, all search queries and the wider homepage experience. Generated homepage changes belong to scripts/build-swahili-product-surface.js; the existing directory search runtime is maintained in sw/zana-zote/index.html.
