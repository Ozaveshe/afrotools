# AfroKitchen Cuisine Intelligence

AfroKitchen now has a source-first intelligence layer for recipe presentation, country depth, image planning, quality review, menu building, and contribution triage.

## Source Files

- `data/afrokitchen/cuisine-intelligence-rules.json` defines regional lanes, pantry/technique notes, curated collection rules, menu boards, social showstoppers, image roles, and contribution review steps.
- `scripts/lib/afrokitchen-cuisine-intelligence.js` builds the derived product data.
- `tools/afrokitchen/cuisine-intelligence.json` is the public-safe runtime output.
- `data/afrokitchen/cuisine-intelligence-report.json` is the backstage quality and image readiness report.
- `data/afrokitchen/recipe-image-shot-list.csv` and `tools/afrokitchen/AFROKITCHEN_IMAGE_SHOT_LIST.md` are regenerated shot lists for image production.

## Build Flow

Run:

```bash
npm run afrokitchen:intelligence
npm run afrokitchen:verify-intelligence
```

The static page generator also builds the intelligence layer automatically:

```bash
node scripts/generate-afrokitchen-static-pages.js
npm run afrokitchen:verify-intelligence
```

This keeps recipe pages, country hubs, curated collections, the landing page, image shot lists, and quality reports in sync with the current Supabase-backed manifest.

The verifier checks recipe, country, collection, image, public-payload, social-showcase, collection-page, country-hub, submit-flow, and Kedjenou regression expectations. Run it after generator changes and before broad checks such as `npm test`.

## Product Surfaces

- Recipe pages show chef notes, readiness cues, regional lane context, pantry notes, serving logic, image galleries, and collection paths.
- Country hubs show regional cuisine lanes and pantry/technique guides where enough country data exists.
- Collections include DB-backed collections plus chef-built static collections from the rules file.
- The `Across Africa Showstoppers` collection highlights 20 debate-starting, photo-ready, or festival-worthy dishes, and the matching recipe pages show social hooks, caption starters, hosting moves, and photo angles.
- The landing page exposes regional atlas previews, menu boards, and the showstopper board.
- The submission page collects richer editorial detail without requiring extra database columns.

## Quality Model

The quality score is backstage only. It checks recipe identity, description, story, ingredient shape, step shape, timed steps, serving notes, regional variations, nutrition, research review status, and image coverage.

Public pages must not display raw quality scores. Use the score to prioritize review, image generation, and recipe cleanup.

## Image Convention

Each recipe supports up to five images:

- `<slug>.webp` or `<slug>-1.webp` for the hero image
- `<slug>-2.webp` for serving detail
- `<slug>-3.webp` for ingredients
- `<slug>-4.webp` for process
- `<slug>-5.webp` for table context

Save generated images under `assets/img/kitchen/`. Keep images bright, natural, inspectable, and free of text or logos.
