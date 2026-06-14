# AI Tool Manifest

`assets/js/ai/tool-manifest.js` normalizes the existing AfroTools directory into a router-safe manifest for Ask AfroTools AI. It does not replace `assets/js/components/tool-registry.js`, change public routes, or generate SEO pages.

## Sources

- Primary source: `data/tool-directory.json`, generated from `assets/js/components/tool-registry.js`.
- Curated AI-routing overrides: `MAJOR_TOOL_OVERRIDES` inside `assets/js/ai/tool-manifest.js`.
- Validation: `tests/ai-tool-manifest.test.js`.

The manifest builder collapses duplicate public routes into one router entry and keeps alternate ids in `aliases`. Current public URLs remain unchanged.

## Required Fields

Each manifest entry includes:

- `id`, `slug`, `route`, `title`, `shortDescription`, `category`, `subcategory`
- `countriesSupported`, `languagesSupported`, `currencySupport`
- `userIntents`, `exampleQueries`, `requiredInputs`, `optionalInputs`
- `privacyMode`: `browser_local`, `server_required`, `ai_optional`, or `account_optional`
- `aiCapabilities`: `route_only`, `prefill`, `explain`, `generate_document`, `compare`, or `export`
- `outputTypes`: `number`, `table`, `shortlist`, `cv`, `pdf`, `checklist`, `json`, `report`, `image`, or `map`
- `sourcePolicy`: `official`, `reviewed`, `estimated`, `user_input`, or `mixed`
- `highStakesDomain`: `tax`, `immigration`, `legal`, `health`, `finance`, `employment`, `education`, `energy`, or `none`
- `monetizationSurfaces`: `sponsored_slot`, `pro_export`, `api`, `widget`, or `lead_opt_in`

## Router Helper

Use `getToolManifestForRouter()` when building AI routing logic. It returns only router-safe fields and omits monetization internals, status, and priority.

```js
const manifestApi = require("../assets/js/ai/tool-manifest.js");
const routerManifest = manifestApi.getToolManifestForRouter();
```

In the browser, load the module after the existing registry and use `window.AfroToolsAIToolManifest`.

## Adding An AI-Routable Tool

1. Add or update the public tool in `assets/js/components/tool-registry.js`.
2. Run `npm run tools:directory` or the relevant build command so `data/tool-directory.json` reflects the registry.
3. Add a focused override in `MAJOR_TOOL_OVERRIDES` only when the default inference is not enough.
4. Define required and optional inputs with sensitivity flags. Keep browser-local tools browser-local.
5. Set source and high-stakes labels honestly. Use planning-estimate language where the tool touches tax, immigration, legal, health, finance, employment, education, or energy decisions.
6. Run `node tests/ai-tool-manifest.test.js`.

For release or route/SEO changes, also run the relevant registry, link, SEO, and build checks from `AGENTS.md`.
