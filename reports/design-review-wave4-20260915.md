# Design review: image references and unavailable-route navigation

## Image-reference audit

Read-only static scan of 11,780 tracked HTML files, excluding test/build/report areas. Script bodies and comments were removed before inspecting img/source attributes and social-image metadata.

- 5,046 image tags; none missing an alt attribute. Empty alt is allowed and this does not prove descriptive quality.
- 27,146 local image references checked against the worktree.
- 14 remote references identified but not fetched in this scan.
- One missing-file candidate: `/og-image` in `fr/developers/index.html`. `netlify.toml` lines 8-9 configure this as a function endpoint. It is not a missing static file; its live response is not verified by this scan.
- No missing static local image path found in the inspected attributes.

Audit code and JSON are local ignored artifacts in `artifacts/design-tool-review-20260915/audit-image-references.cjs` and `image-reference-audit.json`. This scan does not cover CSS background images, JavaScript-created images, network responses, decoded-image quality, or every possible srcset syntax. Browser checks remain necessary for those areas.

## Confirmed navigation defect

The Yoruba invoice route's availability notice linked to literal `undefined`. The route manifest correctly marked it unavailable with no declared English destination, but the shared generator treated unavailable records as English fallbacks.

- Updated `scripts/sync-yoruba-fallbacks.js` to render an unavailable notice with a link to `/yo/awon-ise/`.
- Preserved existing English-fallback behavior for valid declared local routes, with validation that rejects missing, malformed and protocol-relative destinations.
- Regenerated the 20 affected pages through the owner script. Availability state, canonical and noindex contracts were preserved.
- Browser verified the invoice notice and followed its link successfully to the Yoruba directory at 390px.

## Validation

- PASS: fallback behavior, malformed-route rejection and idempotence tests.
- PASS: `sync-yoruba-fallbacks.js --check` reports zero stale files.
- PASS: Unicode audit across 51 source files.
- PASS: hreflang validator: 11,555 represented pages, 32,514 relationships, 5,286 equivalence groups.
- PASS: all 20 unavailable routes checked for literal undefined hrefs; `git diff --check`.

## Remaining review

The invoice page also has low-contrast hero text in light mode; this was observed but not repaired in this batch. Continue shared and tool-specific contrast review, actual tool/export workflows, CSS/dynamic/remote images, and broader viewport/browser verification. Shared cache regeneration and release build/security/dist checks remain outstanding. No deployment or live database change.
