# Image library audit

Generated 2026-09-08T07:27:18.011Z. Repository proof only; no deployment.

- images: 2531
- placed: 1855
- unassigned: 0
- duplicates: 8
- held: 3
- text_free_reviewed: 70
- shared_across_locales: 1188
- bytes: 128423561
- missing_reference_candidates: 0
- placement_review_resolved: 792
- lifecycle_counts: [object Object]

## Review boundaries

All product image files are inventoried and hashed. Existing raster artwork is not labelled text-free without visual review. Shared references across languages do not prove text-free content. Unassigned files and duplicates have explicit review assignments; none are deleted or forced onto unrelated pages. Reference candidates are not verified live 404s. The 60 accepted new food images were visually checked; three are held with reasons in the import receipt.

## Reuse

Use one canonical asset path for the same subject in every locale; translate HTML alt text/captions instead of burning text into pixels. The shared tool registry and AfroKitchen cuisine image data already support canonical paths. Do not reuse an English social card with embedded text as translated artwork. Do not conflate related but distinct regional dishes.

## Daily batch

Run node scripts/build-image-library.js --batch=YYYY-MM-DD after reviewed deliveries are imported. The next-200 outputs are the current work queue; pending prompts remain pending until their files exist and pass review. CSV includes exact destination, route, priority and complete prompt.
