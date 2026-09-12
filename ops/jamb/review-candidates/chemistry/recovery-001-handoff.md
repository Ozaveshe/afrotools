# Chemistry recovery001 handoff

20 previously held records reexamined: 10 recovered candidates, 10 still held. This adds no new unique coverage. Historical first-pass files and inventory remain unchanged at 850 examined, 572 candidates and 278 held. After this exact recovery intake, effective coverage is 850 unique, 582 candidates and 268 held.

## Intake

Use recovery-001.json and its exact integration_allowlist. Each row retains the original record, original fingerprint, full first-pass held row and byte hash of its historical batch. No historical hold is removed. Copy the six SVG files from recovery-001-assets to the corresponding hash-named public target_path in the assets manifest, and carry asset_review into the review ledger. Candidate image paths intentionally refer to those future intake targets; this isolated branch does not publish them.

Do not run historical first-pass held assertions as if they described post-recovery state. Preserve those assertions for historical evidence, and compose the recovery allowlist explicitly when checking the integrated bank. The recovery checker compares published replacements only for its ten exact authorized IDs, and the original pool content for its ten still-held IDs.

## Evidence

The supplied PDF SHA256 is pinned in the batch, source identity and reuse authorization: d70da60adbad7d2c2b972ea2e71d33d9f5f512869f416aa73cbc8594c205bc75. Relevant pages 2, 3, 7, 10, 20, 22, 23, 24, 25, 27, 31, 33, 38, 69 and 70 were inspected. Private per-record evidence contains actual source year/page, reasoning, repair history and references.

Independent checks include the NH3/HCl effusion ratio, equal-charge Cu/Ag electrolysis (2.16 g), reaction energy difference (-20 kJ), constant volume/temperature ratio and ideal-gas PV/RT=1. Graph and phase identification retain neutral source labels, without answer-revealing alt text. Four apparatus questions have complete functional text; six graph/phase questions retain SVGs. SVG curves are schematic reconstructions for the qualitative assessment, not digitized experimental datasets.

Ten still-held records retain exact reasons in recovery-001.json: three require defensible solubility-curve calibration/options; two have missing or blurred labels; one has incomplete energy options; one has uncertain shell-dot counts; one has several reactive indicator options without a distinguishing observation; one has displaced structural bonds; one has a mismatched source illustration. No nearest-option answers or invented structures were released.

## Validation

- check-recovery-001.cjs: passed pre-intake with original PDF bytes.
- Integrated pool simulated in memory: passed with the PDF, and with the private PDF unavailable. Source identity and all content/asset/history fingerprints remain mandatory in both modes. Pre-intake requires source bytes; an available mismatched PDF always fails.
- check-first-pass.cjs: passed unchanged, 850 unique IDs, 572 candidates, 278 held.
- build-review-inventory.cjs --check: passed unchanged.
- Six SVGs rendered and visually inspected in Chromium; 390px layout has no horizontal overflow. This is isolated asset rendering, not a deployed product test.
- Syntax and staged whitespace checks passed.

No shared bank, ledger, public assets, routes, deployment or live data changed. Student-facing content contains explanations only; correction history remains private.
