# Ask AfroTools AI Prompt Examples

Use `assets/js/ai/example-registry.js` as the source of truth for reusable Ask AfroTools AI example prompts. Do not hardcode duplicate prompt lists in the homepage, `/ai`, widgets, generated landing-page data, or tests when a registry entry can be reused.

## Registry Fields

Each prompt example must include:

- `id`: stable kebab-case identifier. Do not rename it casually because pages and tests may reference it.
- `text`: user-facing example prompt.
- `category`: one of `education`, `career`, `sme`, `trade`, `energy`, `local-life`, `documents`, `construction`, `agriculture`, or `country-intelligence`.
- `countryTags`: ISO-style country tags such as `NG`, `GH`, `KE`, `ZA`, or an empty array when the prompt is not country-specific.
- `language`: deterministic UI language for the prompt text, currently `en`.
- `expectedToolId`: AI tool manifest id the prompt should route toward.
- `displaySurface`: array of surfaces where the example is allowed: `homepage_command`, `homepage_legacy`, `ai_hub`, `ai_vertical`, `ai_widget`, or `eval`.
- `priority`: numeric sort order within matching category and surface.

## Where It Is Used

- `index.html` hydrates homepage AI prompt chips from `homepage_command` and legacy hero chips from `homepage_legacy`.
- `ai/index.html` hydrates high-intent example cards from `ai_hub`.
- `scripts/generate-ai-landing-pages.js` resolves `primaryPromptId` and `examplePromptIds` from `data/ai/vertical-landing-pages.json` when generating vertical pages.
- `widgets/ai/mini-router.js` uses `ai_widget` examples for category placeholders when the registry is available.
- `tests/ai-prompt-examples.test.js` validates IDs, schema, category coverage, surface coverage, and expected tool IDs.

## Adding Or Updating Examples

1. Add or update the prompt in `assets/js/ai/example-registry.js`.
2. Reuse the prompt `id` in `data/ai/vertical-landing-pages.json` with `primaryPromptId` or `examplePromptIds` when a vertical landing page needs it.
3. Keep prompts synthetic and non-sensitive. Do not paste real CVs, invoices, immigration facts, private business data, or raw user content.
4. Make sure `expectedToolId` exists in `assets/js/ai/tool-manifest.js` or the generated AI tool manifest.
5. Run `node tests/ai-prompt-examples.test.js` before broader checks.

Generated landing pages will pick up registry prompt text through `npm run build` or `node scripts/generate-ai-landing-pages.js`.
