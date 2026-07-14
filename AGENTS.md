# AfroTools Agent Guide

## Mission

AfroTools is a practical African utility platform for local decisions, calculators, documents, exports, country hubs, widgets, Pro apps, and data-driven pages. It is evolving into AfroTools AI: a central AI front door that helps users find the right workflow, prefill existing tools, understand results, and export useful outputs without breaking the static-first product that already works.

Prefer safe, repeatable source changes with clear validation over clever one-off edits.

Future agents should inspect first, keep diffs scoped, preserve unrelated dirty work, and report exactly what was verified.

## First Read Order

1. `package.json`
2. `docs/ARCHITECTURE.md`
3. `docs/TECHNICAL-RISK-REGISTER.md`
4. `docs/CLOSE-OUT-2026-05.md`
5. `docs/PRO-APP-READINESS.md`
6. `docs/PRO-FENCE.md`
7. `docs/ADDING-A-TOOL.md`
8. `docs/ADDING-A-COUNTRY.md`
9. `docs/design-doctrine.md`
10. `docs/codex-playbook.md`
11. `docs/known-traps.md`
12. `docs/afrotools-ai-transformation-map.md` when touching AI routing, assistant behavior, prefill handoff, source labels, or exports
13. Relevant workflow docs such as `docs/PDF-CATEGORY-WORKFLOW.md`, `docs/CONTENT-PUBLISHING-WORKFLOW.md`, `docs/MOBILE-AUDIT-WORKFLOW.md`, or `docs/release-checklist.md`
14. `docs/DEPLOYMENT-WORKFLOW.md` when touching Git worktrees, MCP, Netlify, CI, environments, or release automation

## Repo Layout

- `index.html`, root category/country folders, and `tools/**/index.html` are mostly hand-authored public pages.
- `tools/{tool-slug}/index.html` is the normal pan-African tool route. App subroutes commonly use `tools/{tool-slug}/app.html` with canonical `/tools/{tool-slug}/app`.
- Country tools often live at `{country-slug}/{tool-id}.html`; category pages live at folders like `document-pdf/`, `salary-tax/`, `legal/`, `trade/`, and `career/`.
- `assets/css/` contains the design system and shared CSS. Start with `assets/css/design-system.css` and `docs/design-doctrine.md`.
- `assets/js/components/tool-registry.js` is the routing/discovery backbone. Registry edits require link and audit validation.
- `assets/js/lib/` contains shared browser utilities for storage, export, PDF, analytics, a11y, SEO, dark mode, and workspace sync.
- `assets/js/engines/` contains pure calculation/data engines. Keep engines DOM-free and testable.
- `scripts/` contains generated-output, SEO, audit, build, inventory, and data maintenance scripts.
- `tests/` contains node tests and Playwright specs. `playwright.config.js` starts `tests/support/static-server.js` on port `4173`.
- `netlify/functions/` contains serverless functions. Treat API/auth/storage changes as high risk.
- `supabase/` contains migrations and project support files. Live project actions require the correct Supabase target.
- `fr/`, `sw/`, `ha/`, and `yo/` contain localized surfaces; many translated pages are generated outputs.
- `dist/`, `sitemap*.xml`, `_redirects`, `_headers`, `assets/js/bundles/`, and `*.min.js` may be generated or post-processed. Prefer source files and scripts.
- `audit-results/`, `reports/`, `artifacts/`, and `test-results/` are evidence/output areas, not product source unless a task explicitly says otherwise.

## Sources Of Truth And Generated Files

- Tool discovery and tool/category availability start in `assets/js/components/tool-registry.js`. Distinguish registry rows, expanded public tool instances, crawlable directory rows, and unique AI router entries; they are different measures.
- Country selector metadata starts in `assets/js/components/country-selector.js`. `scripts/build-tool-directory.js` has a second country-name list for indexing, so country changes must keep both aligned.
- Widget availability starts in the generated `widgets/WIDGET-REGISTRY.js`; change widget sources or `widgets/lite/widget-pack.js`, then run `npm run widgets:build`.
- Public locale launch truth starts in `data/registry/locale-manifest.json`; page-state overrides start in `data/registry/locale-coverage-policy.json`. English, French, Swahili, Yoruba, and Hausa are public; Igbo is planned until its route/catalog/coverage contract is complete. `data/registry/locale-page-coverage.json` and `reports/localization-coverage.*` are generated. AI locale hints are a separate capability and do not prove public route coverage.
- Pro app readiness starts in `assets/js/lib/pro-app-registry.js` and `assets/js/lib/pro-daily-os-registry.js`. Pro subscription prices start in `assets/js/lib/pro-plan.js`; API plan limits start in `netlify/functions/_shared/api-plans.js`.
- Browser engine sources start in `engines/src/*.js`. The matching `engines/*.js` files are generated minified outputs owned by `scripts/minify.js`; edit and review the readable source, never the output directly.
- Measurable public claims are governed by `data/audits/public-claim-registry.json` and `npm run audit:public-claims`; public page copy is not a truth source by itself.
- Committed generated output includes localized routes, JSON indexes, bundles, minified assets, related-tool data, the blog feed, sitemaps, `_redirects`, and the service-worker stamp. Regenerate these through their owners and review source diffs separately from output churn.
- `dist/` is ignored and disposable. It is the Netlify publish artifact, not editable source; rebuild it with `npm run build:deploy` and validate it with `npm run audit:dist`.

## Commands

There is no `npm run dev` script in the current `package.json`. Use `npm run lint` and `npm run type-check` for the focused CI lint and type/import checks they provide.

First-time setup:

- Install Node.js/npm, then run `npm ci` from the repository root.
- Run `npx playwright install chromium` only when the local Playwright browser is missing.
- Do not copy a production `.env` into the repo. Use explicitly scoped local environment variables for Netlify Function work.

Local serving:

- `node tests/support/static-server.js` - static test server on `http://127.0.0.1:4173`, used by Playwright.
- `node _serve.js` - simple local server on `http://localhost:3000`.

Core validation:

- `npm test` - broad link, blog, audit, public-claims, automation, CV-template, and focused data tests.
- `npm run check-links` - route and link smoke.
- `npm run audit` - tool registry/tool metadata audit.
- `npm run tools:quality` - product-quality scorecard.
- `npm run tools:quality:browser` - browser-backed tool quality smoke.
- `npm run lint` - focused CI lint checks.
- `npm run type-check` - focused CI type/import checks.
- `git diff --check` - substitute whitespace/format check when no formatter/linter exists.
- `node -c path/to/file.js` - syntax check changed CommonJS/server scripts.

Build and release:

- `npm run build` - full source rebuild and post-processing.
- `npm run build:deploy` - full rebuild plus publishable `dist/` artifact.
- `npm run audit:dist` - verify deploy artifact contents.
- `npm run security:scan` - scan publish surfaces for leaked internals and risky files.

SEO, routes, and generated metadata:

- `npm run sitemap`
- `npm run seo:report`
- `npm run seo`
- `npm run seo:og`
- `npm run seo:widgets`
- `npm run counts:sync`
- `npm run inventory:site`

Specialized validation:

- PDF/document tools: `npm run pdf:verify`, `npm run document-pdf:verify`
- i18n: `npm run localization:check`, `npm run test:localization`, `npm run build:i18n:validate`, `npm run validate:hreflang`, or `npm run build:i18n:full`
- Pro apps: `npm run pro:verify`
- Category workflows: `npm run category-workflow:verify`
- Widgets: `npm run widgets:build`, then `npm run seo:widgets` when iframe/widget SEO metadata changes
- Blog/content publishing: `npm run blog:feed`, `npm run blog:feed:check`, `npm run blog:verify`
- Legal, tax, and VAT workflows: `npm run legal-workflow:verify`, `npm run salary-tax:verify`, `npm run vat-business-tax:verify`
- Cars: `npm run cars:catalog:refresh`
- Study abroad and scholarships: `npm run study-abroad:source-gaps`, `npm run scholarships:source-recon`
- Energy/live data: `npm run fuel:sources:check`, `npm run solar-roi:data:check`, `npm run test:live-data-status`
- AfroStream: `npm run afrostream:media:audit`
- Government and transport source ledgers: `npm run government:sources:check`, `npm run transport:sources:check`
- Privacy/AI consent: `npm run test:privacy-ai-consent`

Run the narrowest meaningful checks for the files you touched. For release, Netlify, redirects, functions, or publish-surface changes, run `npm run security:scan`, `npm run build:deploy`, and `npm run audit:dist`.

## Coding Conventions

- Prefer existing static HTML/CSS/JS patterns over new frameworks.
- Use IIFE/global module style for browser JS unless the page already uses ES modules.
- Put reusable browser helpers under `assets/js/lib/`; put tool-specific logic near the tool or under `assets/js/pages/`.
- Keep calculation and matching logic in pure functions where possible, then wire DOM separately.
- Use kebab-case for route slugs and file/folder names.
- Use `window.AfroTools.*` for shared browser APIs when adding reusable modules.
- Use structured parsers or existing repo utilities instead of ad hoc string manipulation when practical.
- Do not hand-edit generated files unless the source is missing or the task explicitly calls for a direct patch.
- Do not invent AI, live-data, compliance, official-source, filing, delivery, or integration claims unless the backing implementation and validation exist.
- Preserve existing analytics event names unless the task explicitly changes measurement behavior.

## Engineering Discipline

- Preserve current public routes, canonicals, redirects, and SEO metadata unless the task explicitly changes routing.
- Keep tools mobile-first and check small-width layouts for overflow, clipped controls, sticky CTA collisions, and tap target size.
- Avoid unrelated refactors. Keep PRs small, reversible, and tied to the requested workflow.
- Prefer source files, registries, and scripts over generated output. Do not hand-edit `dist/`, generated localized pages, minified bundles, or sitemap files unless the task explicitly requires it.
- When adding a new tool or AI handoff, keep the existing tool route as the canonical calculator/workflow route; AI should route into tools, not replace them.
- Run the narrowest meaningful tests for touched files. For release, Netlify, redirects, functions, or publish-surface changes, run the broader build/audit/security stack.

## Frontend And Accessibility

- Reuse `assets/css/design-system.css`, `style-guide.html`, and `docs/design-doctrine.md` before adding new visual language.
- Keep interfaces calm, dense, and task-focused. Avoid unnecessary cards, decorative gradients, and text that explains obvious UI.
- Do not ship a giant generic chatbot that buries the tool catalog. AI should be quiet, workflow-driven, and designed to route, prefill, clarify, explain, and export.
- Reuse existing components such as `tool-registry.js`, `tool-search.js`, `country-selector.js`, `related-tools.js`, `business-cta.js`, `save-result-button.js`, `save-to-vault-button.js`, and `pdf-export.js` before adding new UI primitives.
- Every input must have a real visible label or accessible name that describes the field, not example content.
- Buttons and links must be keyboard reachable, visible on focus, and have stable labels.
- Modals/drawers need focus management, Escape/close behavior, and `aria-modal`/labeling where appropriate.
- Use live regions for async status, save, export, upload, and validation feedback.
- Check small mobile widths for overflow, clipped controls, sticky CTA collisions, and tap target size.
- Respect `prefers-reduced-motion`; do not make motion essential to understanding.

## Sensitive User Data Tools

This section applies to tools that process CVs, resumes, job descriptions, cover letters, recruiter emails, phone numbers, email addresses, LinkedIn or portfolio URLs, achievements, career gaps, salary details, identity details, health data, legal facts, or financial records.

- Keep local-first behavior unless a task explicitly adds opt-in server functionality.
- Never log raw resume, job description, email, phone, LinkedIn, portfolio, cover-letter, salary, identity, health, legal, or financial content.
- Do not store sensitive content in analytics, reports, console output, URL query strings, screenshots, test artifacts, server logs, or Supabase unless the feature explicitly requires it and consent is implemented.
- Analytics may record non-PII metadata only, such as tool id, export format, consent state, score band, template id, country code, or count buckets.
- Any AI or network call that sends user-entered sensitive content must require explicit user consent, must show what will be sent, and must provide a local-only alternative.
- Never silently send CVs, PDFs, uploaded documents, pasted document text, invoices, financial data, profile data, workspace data, or personal identifiers to AI endpoints.
- Do not claim "AI-powered" unless actual AI functionality exists and the consent boundary is verified.
- Prefer `localStorage` or IndexedDB only for local drafts. Provide JSON/TXT export and import backup for portability.
- For share links, avoid embedding raw sensitive text by default. If a task requires shareable state, make the sensitivity obvious and minimize the payload.
- For exports from local-first sensitive tools, do not put account gates or lead-capture gates in the primary download path unless the user explicitly asks for that product change.
- Use deterministic offline parsing/scoring first for resume/CV and JD matching. Treat server AI as optional assist, never the default.
- Test with synthetic fixtures, not real user data. Redact or avoid screenshots that reveal full sensitive fixture content unless needed for proof.

### Cover Letter Generator

The Cover Letter Generator at `tools/cover-letter-generator/` and `tools/cover-letter-generator/app.html` handles sensitive career data and must remain private/local-first by default.

- Preserve pasted/uploaded CV, resume, JD, and letter text in the browser unless a later task explicitly adds opt-in server assist.
- Keep PDF, Word/DOC or DOCX, TXT, JSON, copy, print, and local saved-letter behavior working.
- Do not route its primary exports through registration, email capture, or account gates unless the task explicitly changes the product contract.
- If adding AI Assist, require explicit consent, show the exact content or fields to be sent, and keep deterministic local generation available.
- When testing ATS-safe PDF or document exports, verify parser compatibility separately; a browser download alone is not enough.

## Source, Freshness, And Confidence

- Data-driven tools must show source, freshness, assumptions, and confidence where the workflow depends on changing rates, fees, rules, deadlines, or external availability.
- Use "planning estimate" or equivalent disclaimers for calculations that are not official filings, quotes, legal advice, immigration advice, medical advice, financial advice, or guaranteed outcomes.
- Prefer existing source ledgers and metadata in `data/_meta.json`, `data/government/`, `data/transport/`, `data/scholarships/`, `data/fuel/`, `data/rates/`, and related workflow docs.
- Treat changed source hashes or scraper output as review signals, not automatic proof that public copy should change.
- If live Supabase truth, logs, schema, SQL, or generated types are required, use the configured AfroTools Supabase MCP first and report live-state actions separately from repo edits.

## AI Architecture Rules

- Start from deterministic routing and existing tools. AI should select, clarify, prefill, explain, and export around existing engines rather than inventing new calculation logic.
- Use structured JSON schemas for intent routing, clarification questions, tool-prefill outputs, source labels, and export plans.
- Validate model output server-side before trusting tool ids, route paths, source labels, export formats, account actions, or user-visible claims.
- Keep model output constrained to known route ids from `assets/js/components/tool-registry.js` and generated/search indexes.
- Prefer repo-native files such as `data/ai/tool-intents.json`, `data/ai/tool-prefill-contracts.json`, `assets/js/ai/`, and `assets/js/pages/` if implementing the Ask AfroTools AI architecture.
- Add tests for routing matches, unknown-intent fallbacks, missing-field clarification, consent boundaries, sensitive-data blocking, stale-source labels, and export safety labels.
- Do not add a new AI provider, package, or external service unless the task explicitly calls for it and the consent, cost, and failure modes are documented.

## Monetization And Partner Rules

- Sponsor, partner, affiliate, and business lead placements must be clearly labeled.
- Calculation logic, rankings, eligibility checks, estimates, and source labels must remain independent of sponsorship.
- Lead handoff, partner contact, quote requests, email capture, and account follow-up must require an explicit user action or opt-in.
- Do not put registration, lead capture, or sponsor gates in the primary export path for local-first sensitive tools unless the task explicitly asks for that product change.

## Supabase Work

Use the configured Supabase MCP server first whenever a task needs live project access, schema inspection, SQL execution, logs, storage, auth, or generated types.

- AfroTools project ref: `zpclagtgczsygrgztlts`
- Preferred target in this repo: repo-local `supabase`
- Named global fallback: `supabase_afrotools`
- LATMtools project ref: `obtgxgbcoychelycvrfj`

Do not use the AfroTools Supabase project for LATMtools work, and do not use the LATMtools Supabase project for AfroTools work. Keep repo edits and live project actions separate in notes and summaries.

## Workflow Expectations

- Inspect `git status --short` before editing when the tree may be dirty.
- For deploy, worktree, MCP, or environment changes, read
  `docs/DEPLOYMENT-WORKFLOW.md` and run `npm run deploy:doctor` first.
- Treat Netlify's Git-linked build from `main` as the normal production path.
  Do not add a second CLI production upload after a healthy Git deploy.
- Keep one active agent per branch/worktree. Never reset, clean, remove, or
  overwrite another Claude/Codex worktree; a missing worktree marked
  `locked initializing` is active setup, not stale metadata.
- Keep unrelated dirty files untouched.
- Prefer source files over generated output.
- Prefer scripts for bulk edits across many pages.
- If changing a tool, review `docs/ADDING-A-TOOL.md`.
- If changing a country surface, review `docs/ADDING-A-COUNTRY.md`.
- If changing PDF/document workflows, review `docs/PDF-CATEGORY-WORKFLOW.md`.
- If changing SEO, canonical, OG, sitemap, internal links, or aliases, run the relevant SEO scripts and do not manually patch sitemap files first.
- If changing translated output, validate hreflang and avoid manually editing generated translations except for targeted fixes.
- If changing Netlify, redirects, headers, functions, or publish-surface behavior, validate `dist/` directly.
- Add or update docs, `.claude/rules/`, or `.agents/skills/` only when a new recurring workflow or file-specific rule is introduced.

## PR Acceptance Criteria

Every PR or handoff should state:

- What changed, with key file paths.
- Why the change is safe for the affected route or workflow.
- Which commands were run, with pass/fail status.
- Which checks were not run and why.
- Any privacy, accessibility, SEO, analytics, or generated-output impact.

Use this PR summary template:

```md
## Changed Files
- TBD

## User-Facing Changes
- TBD

## Tests Run
- [ ] `git diff --check`
- [ ] Relevant targeted tests:
- [ ] Build/release checks, if needed:

## Screenshots Needed
- TBD

## Risk Notes
- Privacy:
- Accessibility:
- SEO/routes:
- Analytics:
- Source freshness/confidence:
- Generated output:

## Rollout Flag
- Flag/config:
- Rollback path:
```

Done means:

- Frontend: the target route renders, core controls work, mobile layout is checked for overflow, and console errors are addressed.
- Privacy: sensitive content stays local by default, no raw PII is logged or sent, analytics contain metadata only, and any AI/network send has explicit consent.
- Accessibility: labels, keyboard flow, focus states, status messages, contrast, and modal behavior are checked for touched UI.
- Tests: the narrowest relevant automated checks pass; for broad/release changes, run the broader build/audit stack.
- Copy consistency: user-facing claims match actual functionality, no unsupported AI/server/compliance claims are added, and local-first wording matches behavior.
- SEO/routes: canonicals match served routes, intended `noindex` surfaces stay out of search-facing sitemap output, and hreflang is validated when i18n changes.
