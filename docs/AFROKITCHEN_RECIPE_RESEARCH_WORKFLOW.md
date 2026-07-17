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

## Recipe Images

Recipe pages support one hero image plus optional gallery images. Store persistent production image metadata in `public.recipe_media` with `role` set to `hero`, `gallery`, `step`, or `source`. The generator also accepts `recipes.image_url`, manifest gallery fields, step image URLs, and local generated assets named after the recipe slug.

For local generated images, use:

- `/assets/img/kitchen/<recipe-slug>.webp`
- `/assets/img/kitchen/<recipe-slug>-2.webp`
- `/assets/img/kitchen/<recipe-slug>-3.webp`
- `/assets/img/kitchen/<recipe-slug>-4.webp`
- `/assets/img/kitchen/<recipe-slug>-5.webp`

Do not insert placeholder image URLs. If a recipe has no image yet, leave the image fields empty so the page falls back cleanly and does not ship broken media.
