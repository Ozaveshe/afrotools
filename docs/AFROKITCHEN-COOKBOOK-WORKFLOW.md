# AfroKitchen cookbook presentation

The homepage is maintained in `tools/afrokitchen/index.html`. Recipe, country, and collection templates are owned by `scripts/generate-afrokitchen-static-pages.js`; do not edit their generated HTML individually.

For a presentation-only refresh from the saved published catalog:

```sh
node scripts/generate-afrokitchen-static-pages.js --refresh-cookbook
node scripts/validate-afrokitchen-recipe-jsonld.js --all
```

Use `--refresh-cookbook --recipes-only` for a recipe-only presentation refresh.

For an image-attribution correction in structured data only, use
`node scripts/generate-afrokitchen-static-pages.js --refresh-recipe-schema`.
This reads the saved catalog and updates only Recipe image fields, preparation-step
image fields and the head-only schema blocker marker. It preserves page content,
robots, canonicals, route aliases, social previews and release-owned asset URLs.
Generic category banners are social previews, not photos of a particular dish.
A missing dish image defers Recipe rich markup while the complete recipe remains
indexable; other missing content retains the existing noindex safeguard. Optional
step images require an explicit step image source and never reuse a plated-dish
photo. Run `tests/afrokitchen-schema-images.test.js` and the complete JSON-LD
validator. These checks do not certify image provenance or actual Google results.

The recipe canvas is owned by `visual-recipe.css` and `visual-recipe.js`.
`visual-assets.js` supplies the same decorative ingredient SVGs to the generator
and the browser. Unknown ingredients use a neutral bowl, with the stored name
and quantity remaining authoritative. Equipment is explicitly labelled as
suggested and derived from the method, not added to the recipe data.

The visual layer preserves the existing ingredient inputs, checklist storage,
serving engine, export controls and timers. Ingredient illustrations reattach
after serving changes. Inline cooking shows one step at a time with a full-method
toggle; active timers remain discoverable across steps. Without JavaScript all
steps and ingredients stay visible. Printing restores every step. The optional
dialog continues to move the same nodes and restores the inline view on close.
Keep export actions in the accessible `Copy, print & more` disclosure.

Run `node --test tests/afrokitchen-visual-assets.test.js` and the browser specs
`afrokitchen-visual-recipe`, `afrokitchen-cookbook`, `afrokitchen-cooking-timers`,
and `afrokitchen-recipe-copy` when changing this layer. Audit the generated
recipe payload diff to ensure presentation refreshes do not change ingredients
or steps. Do not reconcile inconsistent cooking times as part of a visual edit.

This refresh reads `seo-manifest.json`, existing research metadata, and local image files. It makes no live database reads, does not refresh source dates or recipe values, and does not prune routes. It applies the existing analytics bootstrap, route metadata, content normalization, and structured-data owners to the affected pages, and derives social image dimensions from local files. The publisher's normal deployment build supplies final cache hashes and publish artifacts.

`cookbook.js` stores saved recipe slugs locally under `ak_cookbook_v1`. Favorites are separate from planner picks. Invalid or unavailable storage produces explicit feedback without replacing existing data. Cook mode moves and restores the existing ingredients and method nodes, preserving checklist state and timer listeners. Mobile shows the current step above a collapsible ingredient checklist; desktop shows both together. Native dialog behavior handles focus containment and Escape.

Verify `tests/e2e/afrokitchen-cookbook.spec.js` across Chromium, Firefox, and WebKit. Check mobile light/dark screenshots as well as functional assertions. Existing gallery tests open the optional notes/photos section through its visible disclosure before checking image geometry. Recipe copy/TXT, timers, and parsed-PDF planner print tests cover neighboring workflows.
