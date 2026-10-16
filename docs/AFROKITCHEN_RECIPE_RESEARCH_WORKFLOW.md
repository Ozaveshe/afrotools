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

A named cook's adaptation may include a short, accurate attribution in the recipe
story. AI serving artwork must have a visible illustration label beside its use;
it is not a cooking photograph, endorsement or kitchen-test result. Keep detailed
source comparisons in the audit. Publication flags are eligibility, not proof of
a kitchen test or dietary, religious, allergen or nutrition assurance.

## Measured And Unknown Time

Missing, null or blank durations stay unknown. They are diagnostic advisories,
not publication or indexing blockers by themselves. Do not replace them with
zero or count a known cooking duration as the whole preparation and cooking
time. An explicitly measured zero remains valid. Boolean, negative, nonfinite or
malformed measurements are invalid and remain source-quality blockers.

Recipe markup emits prepTime and cookTime together only when both are valid;
an independently recorded valid totalTime may be emitted instead or alongside
that pair. Omit unknown properties. A visible approximate cooking checkpoint
may still be useful when total time is unknown; explain doneness in the method.
No duration policy waives method, ingredient, identity, canonical, publication,
image, nutrition-basis or payload-equality checks or guarantees rich results.
Reference: https://developers.google.com/search/docs/appearance/structured-data/recipe

Curated corrections use an identity-checked single-recipe audit patch, not a
batch importer. Keep canonical record correction separate and compare it with
the saved source projection; an HTML-only override cannot establish API or
database correctness. Record an actual source review date separately from the
later database operation date; do not invent a future modified timestamp.

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

## Kapenta saved-art successor (private source)

The exact `kapenta-stew-zm` UUID `76572d95-eb8e-4c78-bbb6-ea754f61c758`
uses one paraphrased adaptation of [Zambian Kitchen's dry-kapenta recipe](https://zambiankitchen.com/cook-dry-kapenta/),
not a universal Zambian method or a kitchen-tested result. The legacy route stays;
the display title identifies the pan-fried tomato/onion version. Two pre-existing
AI illustration files are selected by their saved byte hashes and actual pixels.
No generation transcript or documentary photograph is claimed.

Its source states no person-yield or overall preparation/cooking time. These
fields and unsupported nutrition stay null; unsupported diet tags stay empty.
The two approximate five-minute method checkpoints are not a total cooking time.
The explicit `yield_status: not-recorded` hides serving scaling, disables
meal-plan portions and per-serving costing, and keeps original quantities in
static/dynamic controls, schema, TXT and print. Recipe metadata omits unknown
yield/time/nutrition; it does not infer serves1/4/6. Oleleh retains known-yield
controls and its existing attributed method.

The existing public recipe index may project full display content for only this
exact UUID/slug/method revision. The browser joins that source content only after
ordinary public eligibility and an exact identity/revision match; publication,
verification and counters are never overwritten. Missing/malformed target source
content fails closed. The saved image family also requires that identity/revision;
raw legacy methods and slug-only image lookup cannot silently adopt the artwork.
No canonical database content, flags or SQL are changed by this source work.

Legacy saved/picked/locked planner choices remain stored but cannot produce
portion claims for this method, including old online summaries without the marker.
Community ratings, photos and contribution forms are marked unavailable for this
source adaptation until canonical community records are linked to its method;
old-method counters are preserved, not presented as adaptation evidence.

Focused owner HTML fixtures and mocked Node contracts are separate from native
visitor, real provider, full build, image-inventory and publisher release proof.
The shared engine must still be composed with the unit-nine submission child;
this successor remains unit ten, not a twelfth accepted unit.
