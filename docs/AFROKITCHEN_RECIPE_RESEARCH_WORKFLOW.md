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

`npm run afrokitchen:import-expansion -- --batch data/afrokitchen/recipe-expansion-batches/YYYY-MM-DD-wave-N.json`

The importer writes to live Supabase and merges matching entries into `data/afrokitchen/recipe-research-audit.json`. After import, regenerate:

`node scripts/export-afrokitchen-seo-manifest.js`

`node scripts/generate-afrokitchen-static-pages.js`

`npm run afrokitchen:research-queue`

## Dietary Label Corrections

Review the listed ingredients and optional variants before keeping an unconditional
dietary label. Distinguish a confirmed ingredient conflict from an unspecified
variant. Withdrawing a label does not certify the remaining labels or recipes.

Use the correct-project Supabase MCP first. For existing recipes, apply only the
reviewed tag fields with exact recipe/tag/ingredient guards in one transaction;
do not run a full seed or expansion importer to change tags. Preserve media,
ingredients, editorial content and unrelated tags. Maintain the corresponding
seed, generator or authored batch, and check `static_recipe_patch` in the research
audit so it cannot restore a withdrawn label.

After the live correction, refresh only the reviewed slugs through the native
manifest owner:

```sh
node scripts/export-afrokitchen-seo-manifest.js --refresh-diet-tags --slugs slug-one,slug-two
node scripts/build-afrokitchen-recipe-index.js
node scripts/generate-afrokitchen-static-pages.js --refresh-diet-labels
```

The scoped exporter accepts ordered tag removals only, checks recipe identities
and ingredients, and updates recipe summaries in country and collection data.
It preserves unrelated live image changes, other fields and generation dates.
Native curated collection membership and counts are recomputed from the saved
recipes and existing editorial rules. The page refresh also updates public menu
tags, collection references, collection cards/counts and collection structured
data. Retained cards keep their accepted image markup. Recipe refreshes preserve
image markup, head ordering and other content while changing keywords and labels.
Review a rejected guard instead of bypassing it. A method correction such as a
new plant-only variant needs its own content review and regeneration.

Run `node --test tests/afrokitchen-diet*.test.js`, the existing index
and schema checks, and browser checks for filters, recipe metadata and country
cards on the actual artifact. Verify a fresh browser after deployment: an already
open page can retain its loaded recipe index. Keep source/build, live mutation
and publisher deployment proof separate.

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
