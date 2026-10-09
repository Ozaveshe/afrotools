# AfroKitchen Recipe Research Workflow

Use this workflow when checking whether AfroKitchen recipes are culturally and practically sound.

## Source Order

1. Start from live Supabase data for the recipe.
2. Check for official or institutional sources, including tourism boards, ministries, food heritage programs, or recognized cultural references.
3. Check cookbook-derived sources, regional food writers, diaspora cooks, and reputable culinary archives.
4. Compare ingredients, method, serving pairings, origin notes, timing, and common variations.
5. Record what was confirmed, what varies by household, and what should change.

## Audit File

Write human-reviewed findings to:

`data/afrokitchen/recipe-research-audit.json`

Each audited recipe should include:

- `status`
- `confidence`
- `reviewed_at`
- `official_source_status`
- `review_summary`
- `recommended_changes`
- `sources`

## Queue

Run:

`node scripts/build-afrokitchen-recipe-research-queue.js`

Outputs:

- `data/afrokitchen/recipe-research-queue.csv`
- `data/afrokitchen/recipe-research-report.md`

## Publishing Rule

Do not describe a recipe as source-confirmed unless it has an audit entry. Static route eligibility means the page can be generated; it does not mean the culinary facts have been externally checked.

Keep internal research deliberations in the audit. Reviewed adaptations show concise source links, the review date and whether AfroTools has kitchen-tested that version. Keep these disclosures with the recipe and its text export; do not imply that source review proves a kitchen test.

Publication is separate from verification. `recipes.is_published` controls application list, detail and export eligibility; `is_verified` records verification separately. New records default to unpublished and unverified. The importer requires explicit boolean flags to change publication; omitting `is_published` on an existing recipe preserves its current value. Saved manifests without the new field retain the legacy verified-row fallback, but explicit `is_published: false` always excludes a row. Public database read policies are unchanged; this flag is not a confidentiality boundary.

The publication migration `20261009185059_afrokitchen_publication_state.sql` was applied to AfroTools once on 2026-10-09. It backfilled the existing 410 public recipes without changing content or verification. Check the live migration history before any deployment; do not replay it.

## Reviewed Method Corrections

Maintain accepted method/image pairs in `data/afrokitchen/recipe-method-overrides.json`, their audit entries in `recipe-research-audit.json`, and image provenance in the dated image ledger. Run `npm run afrokitchen:reviewed-methods:build` to project the maintained corrections into the saved manifest, nine recipe pages, related cards, country/collection pages and discovery indexes. The normal build also invokes this owner. It does not read or write live data. The live manifest exporter uses the same projection so regeneration cannot silently restore an older method.

Unmeasured quantities remain unmeasured. The existing database numeric contract represents them as zero with an explicit unit/note such as “as needed”; display and export that note without inventing a quantity. Uncalculated nutrition stays null. Timers accompany the documented method and doneness checks; never use the generic 12-minute fermentation placeholder.

The projection also refreshes `page_image` and `social_image`, and records `source_reviewed_at` separately from the live database `updated_at`. The sitemap owner uses that maintained review date for the corrected recipe and its containing hubs; rebuilding alone does not advance it.

Deploy and verify the publication consumers and local image assets before applying any guarded live method/image/verification correction. A source projection, a live update and a production deployment require separate evidence. The sequential expansion importer is not a transactional recipe-repair tool.

Validate with `npm run test:afrokitchen:publication`, the reviewed-method browser suite at 320/390px in both themes, and the release build/security/artifact checks. Browser checks must operate visible step navigation before starting a timer, parse downloaded TXT, retain source/testing disclosures and reject console, accessibility or overflow failures.

## Expansion Batches

Use expansion batch files for new recipes:

`data/afrokitchen/recipe-expansion-batches/YYYY-MM-DD-wave-N.json`

Each new recipe needs at least two external sources, structured ingredients, at least three steps, and at least one timer. The importer validates this before touching Supabase:

`npm run afrokitchen:import-expansion -- --batch data/afrokitchen/recipe-expansion-batches/YYYY-MM-DD-wave-N.json --dry-run`

When the dry run passes, import the batch:

`npm run afrokitchen:import-expansion -- --batch data/afrokitchen/recipe-expansion-batches/YYYY-MM-DD-wave-N.json --apply`

The importer requires an explicit batch and exactly one mode. `--help` and `-h`
show usage without creating a database client. Unknown, repeated, missing or
conflicting arguments stop before database access; there is no default live batch.

The importer writes to live Supabase and merges matching entries into `data/afrokitchen/recipe-research-audit.json`. After import, regenerate:

`node scripts/export-afrokitchen-seo-manifest.js`

`node scripts/generate-afrokitchen-static-pages.js`

`npm run afrokitchen:research-queue`

## Nutrition Meaning

Treat recipe nutrition as unverified unless its maintained record explicitly
documents the portion basis. The engine accepts `nutrition_basis: "per_serving"`
for values for one person and `nutrition_basis: "batch"` for the entire recipe at
`default_servings`. The scaled result exposes that meaning as `nutrition.basis`.
Serving values stay constant when the batch size changes; batch values scale by
the requested servings divided by the recorded default servings.

An absent or unsupported basis stays `unverified`: do not scale those legacy
values or expose them as per-person figures. Missing measurements stay unknown;
a reported zero remains zero. Do not assign a basis from the apparent calorie
value, recipe title, or household serving count. Confirm it through the research
workflow before maintaining the source record. Current repository seed and
manifest values have no documented basis; this is not a claim about live data.

Recipe search metadata must follow the same contract. Google's Recipe
`nutrition.calories` describes one serving: omit nutrition metadata when the
basis is unverified. Normalize a documented batch to one serving, preserve
recorded zero values, and omit missing macros. The static-page nutrition refresh
also updates metadata and runtime nutrition fields from the saved manifest;
it does not fetch or revise recipe records.
Reference: https://developers.google.com/search/docs/appearance/structured-data/recipe

For an engine or nutrition-label change, regenerate the browser engine through
`node scripts/minify.js --only=engines/src/afrokitchen-engine.js`, then use
`node scripts/generate-afrokitchen-static-pages.js --refresh-recipe-nutrition`
to refresh existing recipe nutrition footers from the saved manifest. This
targeted owner operation preserves ingredient content, routes and other page
metadata; it does not fetch live nutrition, establish source correctness or
update the manifest. Run `node --test tests/afrokitchen-nutrition-basis.test.js`
and the relevant serving-adjustment browser checks.

## Recipe Images

Recipe pages support one hero image plus optional gallery images. Store persistent production image metadata in `public.recipe_media` with `role` set to `hero`, `gallery`, `step`, or `source`. The generator also accepts `recipes.image_url`, manifest gallery fields, step image URLs, and local generated assets named after the recipe slug.

For local generated images, use:

- `/assets/img/kitchen/<recipe-slug>.webp`
- `/assets/img/kitchen/<recipe-slug>-2.webp`
- `/assets/img/kitchen/<recipe-slug>-3.webp`
- `/assets/img/kitchen/<recipe-slug>-4.webp`
- `/assets/img/kitchen/<recipe-slug>-5.webp`

Do not insert placeholder image URLs. If a recipe has no image yet, leave the image fields empty so the page falls back cleanly and does not ship broken media.
