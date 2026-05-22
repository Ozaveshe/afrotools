# AfroTools Agent Guide

## Mission

AfroTools is a static-first, multi-surface product for African tools, country hubs, blogs, widgets, Pro apps, and data-driven pages. Prefer safe, repeatable source changes with clear validation over clever one-off edits.

Future agents should inspect first, keep diffs scoped, preserve unrelated dirty work, and report exactly what was verified.

## First Read Order

1. `package.json`
2. `docs/ARCHITECTURE.md`
3. `docs/CLOSE-OUT-2026-05.md`
4. `docs/PRO-APP-READINESS.md`
5. `docs/PRO-FENCE.md`
6. `docs/ADDING-A-TOOL.md`
7. `docs/ADDING-A-COUNTRY.md`
8. `docs/design-doctrine.md`
9. `docs/codex-playbook.md`
10. `docs/known-traps.md`
11. Relevant workflow docs such as `docs/PDF-CATEGORY-WORKFLOW.md`, `docs/CONTENT-PUBLISHING-WORKFLOW.md`, `docs/MOBILE-AUDIT-WORKFLOW.md`, or `docs/release-checklist.md`

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

## Commands

There is no `npm run dev` or `npm run lint` script in the current `package.json`.

Local serving:

- `node tests/support/static-server.js` - static test server on `http://127.0.0.1:4173`, used by Playwright.
- `node _serve.js` - simple local server on `http://localhost:3000`.

Core validation:

- `npm test` - broad link, blog, audit, public-claims, automation, CV-template, and focused data tests.
- `npm run check-links` - route and link smoke.
- `npm run audit` - tool registry/tool metadata audit.
- `npm run tools:quality` - product-quality scorecard.
- `npm run tools:quality:browser` - browser-backed tool quality smoke.
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
- i18n: `npm run build:i18n:validate`, `npm run validate:hreflang`, or `npm run build:i18n:full`
- Pro apps: `npm run pro:verify`
- Category workflows: `npm run category-workflow:verify`
- Legal, tax, and VAT workflows: `npm run legal-workflow:verify`, `npm run salary-tax:verify`, `npm run vat-business-tax:verify`
- Cars: `npm run cars:catalog:refresh`
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

## Frontend And Accessibility

- Reuse `assets/css/design-system.css`, `style-guide.html`, and `docs/design-doctrine.md` before adding new visual language.
- Keep interfaces calm, dense, and task-focused. Avoid unnecessary cards, decorative gradients, and text that explains obvious UI.
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

## Supabase Work

Use the configured Supabase MCP server first whenever a task needs live project access, schema inspection, SQL execution, logs, storage, auth, or generated types.

- AfroTools project ref: `zpclagtgczsygrgztlts`
- Preferred target in this repo: repo-local `supabase`
- Named global fallback: `supabase_afrotools`
- LATMtools project ref: `obtgxgbcoychelycvrfj`

Do not use the AfroTools Supabase project for LATMtools work, and do not use the LATMtools Supabase project for AfroTools work. Keep repo edits and live project actions separate in notes and summaries.

## Workflow Expectations

- Inspect `git status --short` before editing when the tree may be dirty.
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

Done means:

- Frontend: the target route renders, core controls work, mobile layout is checked for overflow, and console errors are addressed.
- Privacy: sensitive content stays local by default, no raw PII is logged or sent, analytics contain metadata only, and any AI/network send has explicit consent.
- Accessibility: labels, keyboard flow, focus states, status messages, contrast, and modal behavior are checked for touched UI.
- Tests: the narrowest relevant automated checks pass; for broad/release changes, run the broader build/audit stack.
- Copy consistency: user-facing claims match actual functionality, no unsupported AI/server/compliance claims are added, and local-first wording matches behavior.
- SEO/routes: canonicals match served routes, intended `noindex` surfaces stay out of search-facing sitemap output, and hreflang is validated when i18n changes.
