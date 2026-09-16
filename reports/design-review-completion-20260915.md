# AfroTools design, mobile and usability review

## Outcome

Completed the requested audit and improvement work across the homepage, shared navigation, tool discovery, country hubs, PDF hub, image-compression workflow and localized surfaces. Changes are preserved on `codex/design-mobile-review-20260915` in an isolated worktree. No merge, push, production deployment or live database mutation occurred.

## Requirement and evidence review

| Requested area | Implemented changes and verified evidence |
| --- | --- |
| Homepage and shared design | Repaired homepage dark text, controls, recommendation actions and mobile signup notice. Browser checked homepage and PDF hub at 320, 390, 768 and 1440 pixels. Final packaged homepage also checked at 320 and 390 pixels. See wave 1 and release-check reports. |
| Unwanted margin accents | Removed the homepage trust-grid side rail and PDF quote rail from their source CSS. Reviewed shared accent patterns with a static scan and rendered pages. Semantic borders and control outlines remain. |
| Mobile compatibility | Fixed the directory search SVG stretching, allowed long expansion buttons to wrap, and repaired Yoruba language-notice/menu overlap across 23 generated pages. Tested representative English, French, Swahili and Yoruba surfaces, including 320px country/directory checks. Measured no document overflow in the recorded observations. |
| Night mode | Repaired shared navbar controls, homepage content, PDF surfaces, country-hub heroes, image-compressor hero labels and Yoruba invoice hero. Explicit theme switching and menu close behavior verified in the browser. |
| Usability and accessibility | Directory renders manageable batches while searching the complete registry, exposes result counts and focuses newly revealed cards. Added Hausa/Yoruba filters. Country picker now supports Escape, arrows, Home/End and restored trigger focus. Browser verified search, expansion, selection and focus behavior; regression tests cover the changes. |
| Images | Rechecked 11,780 tracked HTML pages: 5,046 image tags and 27,146 local image references; no missing static image path and no missing alt attribute in the inspected attributes. CSS scan: 439 files, 18 local references, none missing. Of 14 remote references, 13 are tracking pixels intentionally not requested; the visible QR image returned HTTP 200, image/png. Representative rendered images and image-compressor previews loaded. |
| Tool workflows and localized pages | PDF planner and catalog filtering work; directory full-list search and expansion work; image compressor processes a public synthetic-use image in English and Swahili, reports increased size honestly and supports the slider's zero endpoint. Yoruba invoice add-line control works; 20 unavailable-route links now reach the proper directory instead of literal undefined. |
| Repeatability and release validation | Source-owned generators and cache versions regenerated; no tracked deletions. Full build, final artifact packaging/audit, security scan, targeted behavior checks, localization/hreflang and calculation checks passed. The final service-worker precache matches current assets. |

## Validation details

- Full `npm run build:deploy` passed twice during the work. After the final small keyboard change, its asset references were regenerated through the scoped cache owner and the artifact was repackaged using `build-dist.js`.
- Final `npm run audit:dist` and `npm run security:scan`: passed. Artifact includes 18,074 files; 1,788 JS and 620 CSS files optimized.
- `build:checks` initially exposed 45 stylesheet-cache-only formula digest mismatches. Comparing every affected page against the verified base and replacing only that CSS cache key restored all recorded digests. A narrow presentation normalization fixed the false positives without refreshing formula values or fixtures. Every stage before the failure passed; calculation-quality and the entire remaining command chain then passed.
- Calculation check: 789 artifacts and 307/307 golden fixtures; one stale dataset warning retained. Search snippets: 9,874 indexable pages, zero error pages and 653 review candidates. Automation run-evidence warnings are recorded separately from product correctness.
- Targeted directory, image-result, Yoruba fallback and country-picker tests passed. Country-picker tests first reproduced the absent keyboard behavior. Calculation tests ensure rate, asset-path and query changes remain detectable.
- Hreflang: 11,555 pages, 32,514 relationships, 5,286 groups. PDF verification: 31 tools. Lint and type checks passed for their configured scopes.
- Initial large generated diff: all 10,507 changed HTML files were verified to contain asset-version changes only. Final incremental diff: six country-picker references and the service-worker stamp; reviewed and committed.

## Practical limits

This is broad static auditing plus representative browser verification, not a claim that every tool was exercised or that every browser engine behaves identically. Browser evidence is from in-app Chromium; Safari/Firefox and physical-device behavior are not verified. Empty alt attributes are permitted, so the attribute audit does not establish image-description quality. Dynamic media and live providers are covered only where specifically exercised.

Image processing and download initiation were observed, but the in-app browser cancelled the download with zero received bytes. A successfully saved and reopened export is not claimed. No production-state or live-data freshness claim follows from these local checks.

Detailed evidence lives in the wave 1–5, build, release-check and country-keyboard reports. Reproducible local audit scripts, raw JSON and command logs are in ignored `artifacts/design-tool-review-20260915/`.

## Recommended next release step

Integrate the reviewed branch through the normal release workflow, then verify the deployed homepage and shared navigation on physical iOS/Android devices. Keep the static quality report's remaining candidates as an audit backlog, rather than interpreting static grades as proof of runtime correctness.
