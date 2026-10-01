# AfroKitchen cookbook presentation

The homepage is maintained in `tools/afrokitchen/index.html`. Recipe, country, and collection templates are owned by `scripts/generate-afrokitchen-static-pages.js`; do not edit their generated HTML individually.

For a presentation-only refresh from the saved published catalog:

```sh
node scripts/generate-afrokitchen-static-pages.js --refresh-cookbook
node scripts/validate-afrokitchen-recipe-jsonld.js --all
```

This refresh reads `seo-manifest.json`, existing research metadata, and local image files. It makes no live database reads, does not refresh source dates or recipe values, and does not prune routes. It applies the existing analytics and structured-data owners to the affected pages. The publisher's normal deployment build supplies final cache hashes and publish artifacts.

`cookbook.js` stores saved recipe slugs locally under `ak_cookbook_v1`. Favorites are separate from planner picks. Invalid or unavailable storage produces explicit feedback without replacing existing data. Cook mode moves and restores the existing ingredients and method nodes, preserving checklist state and timer listeners. Mobile shows the current step above a collapsible ingredient checklist; desktop shows both together. Native dialog behavior handles focus containment and Escape.

Verify `tests/e2e/afrokitchen-cookbook.spec.js` across Chromium, Firefox, and WebKit. Check mobile light/dark screenshots as well as functional assertions. Existing gallery tests open the optional notes/photos section through its visible disclosure before checking image geometry. Recipe copy/TXT, timers, and parsed-PDF planner print tests cover neighboring workflows.
