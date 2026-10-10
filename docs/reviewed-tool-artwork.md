# Reviewed discovery artwork

`data/image-generation/reviewed-localized-tool-artwork.json` is the source for reviewed discovery bindings. Run `npm run artwork:index:build` after installing reviewed assets, then regenerate the normal localized and SEO outputs. Preserve original assets and all non-image registry fields.

- `reviewed_same_tool_binding` retains the existing Swahili same-tool contract: the source registry ID also identifies its WebP.
- `reviewed_guide_binding` and `reviewed_category_binding` are explicit mappings, not assertions that a category is a calculator. Set the corresponding `binding_kind`, exact target/source routes, `lang`, `asset_id`, reviewed SHA-256, evidence, and review notes.
- `reviewed_localized_tool_binding` uses `binding_kind: localized-tool` for a Swahili tool whose existing registry ID differs from its asset name. Preserve the actual registry ID in `source_id`; never rename the tool to fit an asset slug.
- Explicit mappings record `expected_image_id` and `expected_image_path` from the reviewed base. The builder accepts that prior state or the already-applied reviewed asset; other artwork changes fail closed. A new WebP may supersede an older SVG in discovery while preserving the SVG file.

The build helper checks exact routes, locale, asset identity, file hash, duplicate targets and previous artwork before editing `imageId`. The page resolver only returns artwork for an exact reviewed route. Neither operation adds a hero, changes calculator behavior, or certifies the page's sources, freshness or results.

The localization-wave registry generator reapplies the same guarded bindings after rebuilding its rows. Keep that step: otherwise French coverage rows marked with `image: false` discard their explicit reviewed `imageId` later in a full build.

Before handing off, review generated HTML separately from source. Preserve body controls, canonical/hreflang links and non-image structured data. Check actual cards at narrow/mobile/desktop widths, asset requests and destination metadata. Existing PRs and receipts must be reconciled before creating another binding for the same target.

Native page owners that compare release-processed output must resolve reviewed artwork before their idempotence check. Keep their existing content, controls and runtime guards. If a visible image already exists, regenerate through its owner so it agrees with reviewed metadata.

For protected calculation-page HTML, preserve the existing formula data and digests. The narrowly scoped `data/image-generation/reviewed-discovery-artwork-presentation.json` records five exact, reversible head-only changes. Its normalizer requires every reviewed current fragment exactly once; unfamiliar metadata, body content and executable changes remain digest-sensitive. This internal review record lives with other image audit inputs and is excluded by the existing inventory scan and deploy-artifact rules. Never use it to normalize calculation, rate, source, control or runtime changes.

When an image loses its final live placement, preserve the asset and record its reviewed retirement in the lifecycle ledger. Historical audit markup is not a live placement.
