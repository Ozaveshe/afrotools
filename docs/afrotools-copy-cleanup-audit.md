# AfroTools Public Copy Cleanup Audit

Date: 2026-06-14

Scope: documentation-only audit. No public website text was changed.

## Executive Summary

AfroTools can keep the stronger positioning of "AfroTools AI - Africa's Practical AI Hub," but the public copy needs a source-led cleanup before the next public text pass. The biggest issues are not grammar alone. They are claim control, naming consistency, and generated-output amplification.

Top problems found:

- The homepage and `/ai/` direction is mostly aligned, but `/ask/` still reads like an older shell and exposes "mocked router" and TODO language.
- `assets/js/components/tool-registry.js` is the highest-leverage cleanup source because it feeds tool cards, search, generated directories, and metadata.
- Data/search outputs amplify risky phrases such as "all African countries," "AI advisor + PDF," "verified," "real-time," "complete," "best," and "#1."
- API copy uses "verified key," "live data," "production data," and "go live" in ways that may be valid only if key verification, route freshness, limits, and production access are currently backed.
- Privacy copy is directionally good, but broad words like "securely," "complies," and "highest applicable data protection standard" need legal review before being strengthened or reused.
- Several older assistant and registry strings still use hype or overclaiming, especially `Africa's #1 financial tools platform`, `be accurate`, `real-time rates`, and broad "AI advisor" capability labels.

## Methodology

Read before auditing:

- `package.json`
- `docs/ARCHITECTURE.md`
- `docs/CLOSE-OUT-2026-05.md`
- `docs/PRO-APP-READINESS.md`
- `docs/PRO-FENCE.md`
- `docs/ADDING-A-TOOL.md`
- `docs/ADDING-A-COUNTRY.md`
- `docs/design-doctrine.md`
- `docs/codex-playbook.md`
- `docs/known-traps.md`
- `docs/afrotools-ai-transformation-map.md`
- `docs/source-confidence-model.md` was discovered as relevant source-confidence guidance.

Key public copy sources inspected:

- Homepage: `index.html`
- AI surfaces: `ai/index.html`, `ask/index.html`, `ai/intent-report.html`
- Shared public components: `assets/js/components/navbar.js`, `footer.js`, `site-assistant.js`, `ai-consent.js`, `tool-registry.js`
- AI handoff code: `assets/js/ai/intent-router.js`, `prefill-adapters.js`, `prefill-consumer.js`
- Data that renders public descriptions: `data/tool-directory.json`, `data/search-index.json`, `data/ai/*`, `data/_meta.json`
- API surfaces: `api/index.html`, `api/docs/index.html`, `api/pricing.html`, `docs/api/*.html`
- Widget and sponsor surfaces: `widgets/index.html`, `widgets/demo/index.html`, `sponsored-tools/index.html`, `advertise/index.html`
- Trust/privacy/error surfaces: `privacy/index.html`, `privacy-policy.html`, `404.html`, `offline.html`
- Pilot tools: `tools/cv-builder/index.html`, `tools/scholarship-finder/index.html`, `tools/import-duty/index.html`
- High-risk examples: `tools/fuel-tracker/index.html`, `tools/minimum-wage/index.html`, `tools/leave-calculator/index.html`, `tools/land-title-check/index.html`, `tools/pdf-workspace/index.html`, `tools/afrostream/index.html`, `tools/afrokitchen/index.html`

Scan notes:

- A targeted scan of 35 priority files found the largest visible/public-copy risk concentrations in `data/search-index.json`, `tools/leave-calculator/index.html`, `assets/js/components/tool-registry.js`, `data/tool-directory.json`, `privacy/index.html`, `assets/js/components/site-assistant.js`, `tools/land-title-check/index.html`, and `tools/scholarship-finder/index.html`.
- A wider scan of 3,177 public/source files found many raw hits, but some are CSS colors, code variable names, comments, generated search keywords, or legitimate legal/API terminology. Treat counts as triage, not automatic defects.

## Existing Claim Registry

The repo already has `data/audits/public-claim-registry.json` and `scripts/audit-public-claims.js`.

Registered claim families include:

- Scholarship feed count and live-feed wording.
- Tool-count and broad scale language.
- 54-country and all-African-country coverage.
- Fuel coverage claims.
- Compliance calendar coverage.
- AfroKitchen recipe/media claims.
- Remittance quotes and rates.
- Payroll operational/live-data claims.
- Pro local-only and sync-pending claims.
- AI advisor capability claims.
- Government/transport official-source ledger claims.
- Live data and real-time language.

This should become the guardrail for future implementation. Any later copy change that adds measurable claims should either fit an existing registry rule, add a truth-backed rule, or use safer wording.

## Major Copy Problems

### 1. Brand Architecture Is Still Split

Observed names:

- `AfroTools`
- `AfroTools AI`
- `Ask AfroTools AI`
- `AfroTools AI - Africa's Practical AI Hub`
- `AI Advisor`
- `AfroBot`

Risk:

- Users may not know whether AfroTools AI is the whole product, the command page, the assistant, or an optional model feature.
- `AfroBot` and `AI Advisor` feel older than the new command-positioning layer.

Recommended rule:

- Use `AfroTools` for the platform and established tool pages.
- Use `AfroTools AI` for the AI front door and orchestration layer.
- Use `Ask AfroTools AI` for the action/input label.
- Use `AI assist` for optional model-provider help after consent.
- Phase out `AfroBot` and generic `AI Advisor` on public navigation unless the specific surface calls the existing advisor endpoint with consent.

### 2. Generated Descriptions Amplify Risky Copy

High-leverage files:

- `assets/js/components/tool-registry.js`
- `data/tool-directory.json`
- `data/search-index.json`

Examples found:

- `AI advisor + PDF` repeated across PAYE entries.
- `All 54 African countries` and `all African countries` used as broad category/search language.
- `verified live feed`, `verified contributor reports`, and `official links`.
- `real-time prices`, `live data`, and `complete guide`.

Risk:

- One source phrase spreads into cards, search indexes, directories, category pages, and generated localized output.
- Some "all countries" text may be SEO keyword scaffolding rather than product truth.

Recommended rule:

- Clean source registry strings first, then regenerate indexes.
- For generated files, do not hand-edit unless the source is missing or the task explicitly requires a one-off direct patch.

### 3. AI Copy Is Mostly Safe But Has Legacy Overclaim Pockets

Good current patterns:

- `/ai/` says consent is optional and model routing requires consent.
- `/ai/` keeps deterministic routing and prefill handoff separate from optional model assist.
- `/ai/` warns users not to add CVs, PDFs, financial records, profile data, or personal identifiers unless a workflow explicitly asks.

Risks found:

- `assets/js/components/site-assistant.js` says `Africa's #1 financial tools platform`.
- The same assistant prompt says "be accurate" for country tax/finance rules, which is too strong without source checks in every answer path.
- `/ask/` says it uses a local mocked router adapter and TODOs, which should not appear as polished public copy unless `/ask/` is clearly noindex/dev-only.
- Some public copy may imply deterministic routing is "AI" instead of local workflow matching.

Safer language:

- Replace "AI reasoning" with "workflow matching" unless a model is actually used.
- Replace "AI knows" with "AfroTools can help route your prompt."
- Replace "AI advisor + PDF" with "optional AI explanation and PDF export where available" only when both are wired and tested.
- Replace "accurate advice" with "planning guidance with source notes."

### 4. Source And Freshness Labels Need Tighter Public Rules

Good patterns already present:

- Import Duty uses "planning estimate" and says stored rates are not labeled official.
- Source-confidence language exists in `docs/source-confidence-model.md`.
- `data/_meta.json` includes freshness/official verification nuance.

Risks found:

- `official`, `verified`, `real-time`, `live data`, and `source confidence` appear across pages and registries.
- Some terms are valid in context, but only if the matching source metadata or live endpoint backs them.
- "Verified" is overloaded: verified key, verified feed, verified contributor report, verified recipe, verified tool, verified account.

Recommended vocabulary:

- `official source`: only when the source is a government/regulator/authority page and linked or represented in a maintained source ledger.
- `source-linked`: evidence URL exists, but not necessarily official.
- `reviewed`: human or automation checked as of a dated review.
- `live endpoint`: the API route calls a current backend source.
- `cached data`: served from a stored snapshot with a visible date.
- `planning estimate`: calculated or modelled guidance, not official.
- `user-entered`: values supplied by the user.
- `source needed`: do not promote as factual until reviewed.

### 5. API Copy Needs Product/Legal Validation

Files:

- `api/index.html`
- `api/docs/index.html`
- `api/pricing.html`
- `docs/api/changelog.html`

Examples:

- "create a free verified key"
- "Go live with a verified key"
- "verified live testing"
- "live data"
- "production data"
- "Official SDKs"
- "Real-time exchange rates for 42 African currencies"

Risk:

- These may be valid, but they must match current account/key flows, route auth behavior, SDK availability, and data freshness.
- "Official SDKs" can imply formally maintained packages. Use "planned SDKs," "sample SDKs," or "client examples" unless packages exist and are maintained.

Recommended replacement patterns:

- "Create a free verified key" -> "Create a dashboard key after account verification" if that exact process exists, otherwise "Request a dashboard key."
- "Live data" -> "Production endpoint where available" or "source-backed endpoint with freshness labels."
- "Go live" -> "Move to a reviewed production pilot."
- "Official SDKs" -> "Client examples" unless published SDKs exist.

### 6. Privacy Copy Is Good Directionally But High Stakes

Files:

- `privacy/index.html`
- `privacy-policy.html`
- `assets/js/components/ai-consent.js`

Positive patterns:

- Distinguishes local calculators, AI Advisor, account sync, forms, analytics, and payments.
- Says AI requests only happen after the user continues from the notice.
- Describes localStorage and browser-local behavior.

Risks:

- "stored securely" is broad.
- "complies with POPIA/NDPR" and "highest applicable data protection standard" should be human/legal reviewed.
- "anonymised calculation summaries and your question" is tricky because free-text questions can contain personal data.

Safer language:

- "stored securely" -> "stored by Netlify/Supabase for reply handling, with access limited to site operations."
- "anonymised calculation summaries and your question" -> "the prompt and selected calculation summary you choose to send; avoid personal identifiers."
- "complies with" -> "designed to support" or "we handle requests under" unless legal review confirms compliance.

### 7. CTA Copy Is Mostly Practical But Some Hype Remains

Good CTA direction:

- "Open tool"
- "Calculate"
- "Compare"
- "Create CV"
- "Find scholarships"
- "Browse countries"
- "View API"

Risky/vague CTA patterns to avoid:

- "Unlock"
- "Transform"
- "Supercharge"
- "Start your journey"
- "Get instant approval"
- "Discover the best"
- "Ask AI" when the path is deterministic routing only.

## Risky Claim Patterns Found

Treat these as review triggers:

| Pattern | Risk | Safer replacement |
| --- | --- | --- |
| `official` | Implies government or regulator authority | `source-linked`, `authority source`, `check with the official portal` |
| `verified` | Overloaded and often unsourced | `reviewed`, `source-linked`, `account-verified`, `contributor-reported` |
| `real-time` | Requires live current data | `latest available`, `recent snapshot`, `live endpoint where available` |
| `live data` | Requires route-specific live backing | `source-backed data`, `cached data with date`, `production endpoint where available` |
| `secure` / `fully secure` | Broad privacy/security guarantee | `processed in your browser`, `sent only after consent`, `access limited` |
| `guaranteed` | Outcome promise | `estimated`, `not guaranteed`, `depends on provider/source review` |
| `accurate` | Absolute correctness claim | `based on current source data`, `planning estimate`, `check official source` |
| `best` / `#1` | Unsupported superiority claim | `popular`, `useful`, `recommended for`, `high-intent` |
| `trusted by` | Requires proof | Use only with named, consented proof |
| `millions` | Requires proof and date | Use only with source and scope |
| `complete` | Usually overstates scope | `practical`, `starter`, `step-by-step`, `covers key checks` |
| `all countries` / `54 countries` | Requires route/data coverage | `selected countries`, `supported countries`, or exact count from registry |
| `instant approval` | Regulated/financial risk | `quick eligibility check`, `prepare application details` |
| `AI knows` | Overstates model authority | `AfroTools can route`, `AI assist can help explain` |

## Pages And Files Most In Need Of Cleanup

1. `assets/js/components/tool-registry.js`

Reason: highest leverage source for public cards, search, generated data, tool/category discovery, and metadata. Start here before generated outputs.

Focus:

- `AI advisor + PDF`
- broad country coverage
- `complete guide`
- `verified`
- `real-time`
- `source confidence and official links`
- `Calculate all fees`

2. `assets/js/components/site-assistant.js`

Reason: legacy assistant positioning conflicts with the new brand architecture.

Focus:

- `Africa's #1 financial tools platform`
- `be accurate`
- `real-time rates`
- `AfroBot` naming versus `Ask AfroTools AI`

3. `/ask/`

Reason: old shell copy exposes internal implementation status.

Focus:

- "mocked router adapter"
- "TODOs"
- clarify whether `/ask/` is an old shell, redirect candidate, noindex route, or public companion to `/ai/`.

4. API pages

Files:

- `api/index.html`
- `api/docs/index.html`
- `api/pricing.html`
- `docs/api/changelog.html`

Focus:

- `verified key`
- `live data`
- `production data`
- `Official SDKs`
- `Real-time exchange rates`

5. Privacy pages

Files:

- `privacy/index.html`
- `privacy-policy.html`

Focus:

- legal-compliance claims
- "securely"
- AI data-transfer wording
- localStorage "never leaves browser" caveats where analytics/account sync can coexist.

6. High-stakes tools and categories

Focus routes:

- `tools/scholarship-finder/`
- `tools/import-duty/`
- `tools/fuel-tracker/`
- `tools/minimum-wage/`
- `tools/leave-calculator/`
- `tools/land-title-check/`
- government, transport, legal, tax, immigration, health, finance, Pro shell, and API surfaces.

7. Generated data and localized outputs

Files:

- `data/tool-directory.json`
- `data/search-index.json`
- localized generated pages under `fr/`, `sw/`, `ha/`, `yo/`

Rule:

- Regenerate from source after registry/template cleanup. Do not start with direct edits.

## SEO Terms To Preserve

Do not remove practical search intent while softening claims.

Platform and brand:

- AfroTools
- AfroTools AI
- Ask AfroTools AI
- Africa's Practical AI Hub
- African tools
- Africa tools
- calculators for Africa

Core tools:

- CV Builder
- resume builder
- ATS CV
- Scholarship Finder
- Import Duty Calculator
- landed cost calculator
- Fuel Tracker
- AfroFuel
- PAYE Calculator
- salary tax calculator
- VAT calculator
- PDF tools
- PDF merge
- PDF compress
- PDF workspace
- API
- widgets
- sponsored tools

Country and local intent:

- Nigeria, Kenya, Ghana, South Africa, Egypt, Tanzania, Rwanda, Senegal, Uganda, Zambia, and other country names where the route supports them.
- PAYE, VAT, customs duty, import duty, scholarship, JAMB, WAEC, CV, invoice, receipt, fuel price, solar ROI, work permit, passport, national ID, remittance, mobile money, land title, tenancy, company registration.

Trust/search modifiers:

- source
- source label
- source confidence
- freshness
- estimate
- planning estimate
- official portal
- government source
- reviewed
- updated date
- local
- browser
- export

## Copy Rules For Future Codex Prompts

1. Preserve the product noun and search noun. Rewrite the risky adjective, not the keyword.

Example: keep `Import Duty Calculator`; soften `official rates` to `source-linked rates where available`.

2. Use claim tiers.

- Tier A: official/source-backed. Requires source metadata or source ledger.
- Tier B: reviewed/current snapshot. Requires review date or generated metadata.
- Tier C: estimate/planning. Requires visible caveat.
- Tier D: user-entered. Label as user input.
- Tier E: unknown/source-needed. Do not promote.

3. Keep AI consent explicit.

Do not imply private prompts, CVs, PDFs, salary values, legal facts, health data, financial records, profile data, or identifiers are sent to AI unless the user explicitly consents and the UI shows what may be sent.

4. Do not call local routing model reasoning.

Use "workflow matching," "deterministic routing," "tool matching," or "command routing" unless a model provider is actually used.

5. Keep local-first copy specific.

Use "runs in your browser where possible" or "this PDF action runs in your browser" instead of "fully secure" or "private by default" when the page also has account sync, analytics, forms, or AI options.

6. Use practical CTAs.

Prefer:

- Open tool
- Calculate
- Compare
- Create CV
- Find scholarships
- Browse countries
- View API
- Copy widget code
- Request sponsorship

Avoid:

- Unlock
- Transform
- Supercharge
- Get guaranteed results
- Trust the AI

7. Separate user-facing copy from internal status.

Do not expose TODO, mocked adapter, stub, shell, fake, placeholder, or test language on public routes unless the route is internal/noindex and the wording is intentional.

8. Before changing generated pages, identify the source.

Likely sources:

- `assets/js/components/tool-registry.js`
- generator scripts under `scripts/`
- `data/tool-directory.json` and `data/search-index.json` generated from registry/build scripts
- localized source JSON or generators

## High-Risk Areas Requiring Human Review

- Privacy policy and legal compliance language, especially POPIA, NDPR, GDPR, retention, cookies, analytics, AI processors, and "complies with" claims.
- API production access, verified keys, paid plans, SDK availability, uptime, route limits, and production data claims.
- Tax, PAYE, VAT, customs, import duty, immigration, legal, land, health, scholarships, loans, grants, pensions, and government workflows.
- Sponsor/partner placements where copy could imply endorsement, ranking bias, guaranteed leads, or official partnership.
- Pro app copy where account sync, team features, payments, reminders, legal certification, payroll filing, or operational data is not fully wired.
- AfroStream, creator valuation, market data, remittance, fuel, rates, scholarships, and all Supabase-backed surfaces that may need live truth checks before copy changes.

## Recommended Implementation Order

1. Freeze naming rules in `docs/afrotools-copy-style-guide.md`.

2. Clean the source registry and assistant labels.

- `assets/js/components/tool-registry.js`
- `assets/js/components/site-assistant.js`
- related generated/minified update path only if the build process requires it.

3. Decide `/ask/` public status.

- If `/ai/` is canonical, convert `/ask/` to a clear older/compatibility route, noindex utility route, or redirect plan.
- Remove mocked/TODO public wording.

4. Clean API copy with product confirmation.

- Validate key flow and production endpoint truth first.
- Replace "Official SDKs" unless packages exist.

5. Clean privacy pages with human/legal review.

- Narrow security and compliance claims.
- Align AI wording with the actual consent UI and `ai-consent.js`.

6. Clean high-risk tool copy by category.

Priority:

- Scholarships
- Import duty/customs
- Fuel/rates/live data
- PAYE/VAT/tax
- Government/transport
- Legal/land
- Health
- Pro shells

7. Regenerate indexes and metadata from source.

Likely commands after source copy changes:

```powershell
npm run counts:sync
npm run seo:report
npm run audit:public-claims
npm run check-links
```

Use route-specific checks as needed.

8. Review generated localized output.

Do not directly hand-edit generated translations unless the source is missing or the fix is intentionally one-off.

9. Browser-check the highest-traffic surfaces.

At minimum:

- homepage
- `/ai/`
- `/ask/` or redirect target
- `/api/`
- `/widgets/`
- one high-risk tool page
- one mobile viewport

## Replacement Wording Bank

AI:

- "Ask AfroTools AI to find the right workflow."
- "AfroTools AI routes your prompt to existing tools and asks for missing details."
- "Optional AI assist can retry routing after you consent."
- "The tool opens with a safe prefill. You stay in control before calculating, saving, exporting, or sending anything."

Privacy:

- "Runs in your browser where possible."
- "Sent only after you choose AI assist."
- "Uses account sync only when you sign in and save."
- "Analytics records metadata, not raw prompts or document text."

Sources:

- "Planning estimate based on current source data."
- "Source-linked where available."
- "Last reviewed: YYYY-MM-DD."
- "Confirm filings, payments, legal decisions, immigration decisions, and medical decisions with the relevant authority or professional."

API:

- "Start with sandbox examples."
- "Request or create a dashboard key."
- "Production access depends on endpoint support, limits, and commercial review."
- "Use freshness labels before relying on data in production."

Coverage:

- "Supported countries"
- "Selected African markets"
- "Country coverage varies by workflow"
- "Exact country support is shown on each tool"

## Validation To Run After Copy Changes

For documentation-only changes, no product tests are required beyond markdown/diff checks.

For future public text changes:

```powershell
npm run audit:public-claims
npm run check-links
npm run seo:report
git diff --check
```

For AI consent or routing copy:

```powershell
npm run test:privacy-ai-consent
npm run test:ai-intent-router
npm run test:ai-prefill-adapters
npm run test:ai-command-page
```

For generated tool/search copy:

```powershell
npm run counts:sync
npm run audit
npm run audit:public-claims
```

For API copy:

```powershell
npm run test:api-docs
npm run audit:public-claims
```

For release-facing changes:

```powershell
npm run build:deploy
npm run audit:dist
npm run security:scan
```
