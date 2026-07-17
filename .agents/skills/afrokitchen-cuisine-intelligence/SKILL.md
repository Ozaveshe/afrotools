# AfroKitchen Cuisine Intelligence

Use this skill when changing AfroKitchen recipe pages, country hubs, collections, social-showcase behavior, image planning, menu-builder behavior, or contribution review workflows.

## Workflow

1. Read `docs/AFROKITCHEN-CUISINE-INTELLIGENCE.md`.
2. Change source files first:
   - `data/afrokitchen/cuisine-intelligence-rules.json`
   - `scripts/lib/afrokitchen-cuisine-intelligence.js`
   - `scripts/generate-afrokitchen-static-pages.js`
   - `tools/afrokitchen/cuisine-intelligence.css`
   - `tools/afrokitchen/submit.html` when contribution fields change
3. Do not hand-edit generated recipe, country, collection, manifest, route, report, or shot-list outputs unless the generator cannot produce the required change.
4. Run `node scripts/generate-afrokitchen-static-pages.js`.
5. Run `npm run afrokitchen:research-queue`.
6. Run `npm run afrokitchen:verify-intelligence`.
7. Run a relevant targeted smoke check. Use `npm test` before shipping broad static output changes.

## Rules

- Keep raw quality scores internal in `data/afrokitchen/cuisine-intelligence-report.json`.
- Public pages can show chef notes, readiness cues, regional lanes, pantry notes, menu links, image galleries, curated collections, and social-showcase prompts.
- Image filenames should follow `/assets/img/kitchen/<slug>.webp`, `<slug>-1.webp`, `<slug>-2.webp`, through `<slug>-5.webp`.
- Extra contribution fields must not break the current Supabase `recipe_submissions` insert contract unless a live schema migration is intentionally performed.
