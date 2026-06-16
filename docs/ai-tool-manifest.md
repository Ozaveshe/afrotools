# AfroTools AI Tool Manifest

Status: implementation reference. The AI tool manifest makes existing AfroTools tools routable by Ask AfroTools AI. It does not replace the public tool registry, change canonical routes, or create new public claims.

## Purpose

`assets/js/ai/tool-manifest.js` converts the generated AfroTools directory into a router-safe manifest. The router uses the manifest to decide:

- which tool can answer a user task;
- which public route is allowed;
- what inputs are required or optional;
- whether prefill is supported;
- how sensitive the workflow is;
- what source and high-stakes warnings apply;
- what outputs and monetization surfaces are allowed.

## Sources

- Source registry for public tools: `assets/js/components/tool-registry.js`
- Generated directory: `data/tool-directory.json`
- Manifest module: `assets/js/ai/tool-manifest.js`
- Focused tests: `tests/ai-tool-manifest.test.js`
- Prompt examples that reference expected tools: `assets/js/ai/example-registry.js`

The manifest builder collapses duplicate public routes into one router entry and keeps alternate ids in `aliases`. Current public URLs remain unchanged.

## Manifest Fields

Each entry includes:

- `id`: stable tool id used by routing and tests.
- `slug`: route slug derived from the public URL.
- `route`: root-relative public route.
- `title`: user-facing tool name.
- `shortDescription`: short workflow description.
- `category` and `subcategory`: directory and router grouping fields.
- `countriesSupported`: country codes or `ALL`.
- `languagesSupported`: current language support.
- `currencySupport`: `local`, `USD`, or other known currency support.
- `userIntents`: phrases the router can match.
- `exampleQueries`: safe synthetic examples.
- `requiredInputs`: structured fields needed before a confident prefill/result.
- `optionalInputs`: useful but non-blocking fields.
- `privacyMode`: how the workflow treats user data.
- `aiCapabilities`: allowed AI-adjacent actions.
- `outputTypes`: expected result/export types.
- `sourcePolicy`: source basis for the workflow.
- `highStakesDomain`: warning domain.
- `monetizationSurfaces`: sponsor/Pro/API/widget possibilities.

## Enum Values

`privacyMode`:

- `browser_local`
- `server_required`
- `ai_optional`
- `account_optional`

`aiCapabilities`:

- `route_only`
- `prefill`
- `explain`
- `generate_document`
- `compare`
- `export`

`outputTypes`:

- `number`
- `table`
- `shortlist`
- `cv`
- `pdf`
- `checklist`
- `json`
- `report`
- `image`
- `map`

`sourcePolicy`:

- `official`
- `reviewed`
- `estimated`
- `user_input`
- `mixed`

`highStakesDomain`:

- `tax`
- `immigration`
- `legal`
- `health`
- `finance`
- `employment`
- `education`
- `energy`
- `none`

`monetizationSurfaces`:

- `sponsored_slot`
- `pro_export`
- `api`
- `widget`
- `lead_opt_in`

## Router Helper

Use `getToolManifestForRouter()` in AI routing code. It returns only router-safe fields and omits status, priority, and monetization internals.

```js
const manifestApi = require("../assets/js/ai/tool-manifest.js");
const manifest = manifestApi.getToolManifestForRouter();
```

In the browser, load the module after the existing registry and use `window.AfroToolsAIToolManifest`.

## Default Inference

The manifest infers many fields from existing directory text:

- tax/PAYE/VAT terms infer `highStakesDomain: "tax"`;
- PDF/CV/document terms infer local-first or user-input behavior;
- calculator/cost/ROI terms infer number/report outputs;
- route and title terms create basic user intents and example queries.

This inference is intentionally conservative. For flagship workflows, use explicit overrides.

## Curated Overrides

`MAJOR_TOOL_OVERRIDES` should be used when default inference is not enough. Current overrides cover high-value workflows such as:

- `cv-builder`
- `cover-letter`
- `scholarship-finder`
- `study-abroad-cost`
- `import-duty`
- `solar-roi`
- `fuel-tracker`
- `invoice-generator`
- `paye-calculator`
- `pdf-workspace`
- business planning, construction, agriculture, AfroAtlas, and related workflow tools.

Overrides should be small and evidence-based. Do not add an override that claims AI generation, official source verification, Pro behavior, or API support unless the implementation exists.

## Required Input Shape

Inputs are objects with:

```js
{
  name: "country",
  label: "Country",
  type: "country",
  required: true,
  sensitive: false
}
```

Mark fields sensitive when they may contain salary, purchase price, document content, profile details, client information, identity data, or private financial details. Sensitive fields should not be placed in URLs or analytics.

## How A Tool Becomes AI-Routable

1. Add or update the public tool in `assets/js/components/tool-registry.js`.
2. Run `npm run tools:directory` or the relevant build command so `data/tool-directory.json` reflects the registry.
3. Run `node tests/ai-tool-manifest.test.js` to see the inferred manifest entry.
4. Add a focused `MAJOR_TOOL_OVERRIDES` entry if inference gives the wrong required inputs, privacy mode, source policy, or high-stakes domain.
5. If the workflow supports prefill, add or update an adapter in `assets/js/ai/prefill-adapters.js`.
6. If it appears as an example prompt, add a prompt in `assets/js/ai/example-registry.js` and set `expectedToolId`.
7. If it depends on changing rates, rules, fees, or statistics, add source metadata in `data/source-registry.json`.
8. Add or update workflow tests.

## Do Not Do This

- Do not route to external URLs from model output.
- Do not invent a tool id to make a prompt pass.
- Do not mark a tool `official` or `official_verified` without source metadata.
- Do not mark sensitive workflows as `browser_local` if they silently call a server.
- Do not add Pro or sponsor gates to existing free calculators through the manifest.
- Do not expose raw prompt text, provider payloads, internal IDs, or monetization internals through router responses.

## Validation

```bash
node tests/ai-tool-manifest.test.js
node tests/ai-prompt-examples.test.js
node tests/ai-intent-router.test.js
```

For route, SEO, or generated output changes, also run the relevant link, audit, sitemap, and build checks from `AGENTS.md`.
