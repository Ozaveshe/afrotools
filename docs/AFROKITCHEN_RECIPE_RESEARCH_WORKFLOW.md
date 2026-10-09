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

Keep source notes internal. AfroKitchen pages should read like a confident chef's recipe, not a research memo. Use the audit data to fix ingredients, timing, method, substitutions, and cultural context, but do not render citations or source-count cards on public recipe pages.

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

### Temporary preparation withdrawal

The maintained `METHOD_HOLD_SLUGS` and bounded status projection in
`engines/src/afrokitchen-engine.js` withhold eleven unsupported fermentation
methods. This is containment, not a reviewed replacement or a safe duration.
Canonical routes remain available as `noindex, follow` status pages. Held
methods are excluded from cooking discovery, country/collection inventories,
cuisine advice and image-generation prompts. Status pages and API detail omit
ingredients, steps, timings, nutrition, images, exports and Recipe schema.
Native editorial/import records under `data/afrokitchen/` remain in source for
review and restoration but are excluded from the public artifact. Public
consumers use the bounded projections under `tools/afrokitchen/`.

Run `npm run afrokitchen:method-holds:build` to update saved outputs through the
page, index and cuisine owners without live data access. Run
`npm run test:afrokitchen:method-holds` and the method-hold browser suite on source
and the optimized artifact. Keep historical methods and artwork in preserved
review evidence; do not reinstate them through ordinary batch imports.

Restoration requires a complete source-reviewed preparation, explicit review of
any fermentation controls, matching images, and source/browser/artifact checks.
Remove a hold only together with its accepted replacement and consumer tests.
Deploy consumers before any live verification/content withdrawal. Live changes
require a fresh correct-project snapshot, exact row guards and separate proof;
do not replay earlier publication migrations, dietary updates or restorations.

Recipe pages support one hero image plus optional gallery images. Store persistent production image metadata in `public.recipe_media` with `role` set to `hero`, `gallery`, `step`, or `source`. The generator also accepts `recipes.image_url`, manifest gallery fields, step image URLs, and local generated assets named after the recipe slug.

For local generated images, use:

- `/assets/img/kitchen/<recipe-slug>.webp`
- `/assets/img/kitchen/<recipe-slug>-2.webp`
- `/assets/img/kitchen/<recipe-slug>-3.webp`
- `/assets/img/kitchen/<recipe-slug>-4.webp`
- `/assets/img/kitchen/<recipe-slug>-5.webp`

Do not insert placeholder image URLs. If a recipe has no image yet, leave the image fields empty so the page falls back cleanly and does not ship broken media.
