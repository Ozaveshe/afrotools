# AfroTools Widgets Workflow

Updated: 2026-05-10

## Source Model

- `/widgets/` is the public widget library landing page.
- `/widgets/demo/` is the searchable public widget library.
- `widgets/WIDGET-REGISTRY.js` is the shared public registry used by the library and the embed loader.
- `widgets/embed.js` loads `widgets/WIDGET-REGISTRY.js` before resolving a `data-afrotools` widget ID.
- `widgets/lite/widget-pack.js` contains data-driven calculator widgets that share one renderer.
- `widgets/iframe/*.html` are generated utility embed pages and should stay `noindex, follow`.

## Adding Or Changing Widgets

1. Add a fully custom widget only when it needs bespoke UI or logic.
2. Add a lite widget in `widgets/lite/widget-pack.js` when the widget can use the shared calculator renderer.
3. Run `npm run widgets:build` to rebuild `WIDGET-REGISTRY.js`, the lite iframe pages, and `widgets/MANIFEST.md`.
4. If iframe SEO metadata changed, run `npm run seo:widgets`.
5. Smoke `/widgets/`, `/widgets/demo/`, one core iframe, and one lite iframe.

## Copy Rules

- Keep `/widgets/` front-facing for people who want to browse, preview, copy, and embed calculators.
- Avoid sales-funnel language such as "door opener", "move serious partners", "packages to sell", "lead capture", "backlinks", "white-label", or "Widget Pro".
- Explain the simple user path: choose a widget, preview it, copy the script or iframe, and place it on a public page.
- Keep public claims honest. Do not invent traffic, customer logos, compliance guarantees, or analytics numbers.
- If a custom request is mentioned, frame it as suggesting a missing calculator, not as a pricing ladder.
