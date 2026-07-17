# AfroTools Product Wrap Audit - Public Product Excluding Pro Files

Date: 2026-05-12
Scope: `C:\Users\Oza\Documents\afrotools`, excluding `pro/**` and Pro app files for product assessment. `dist/**` was excluded from source inventory, then checked separately with `npm run audit:dist`.

## Executive Verdict

AfroTools is structurally close to a shippable public product: registry-backed tools have pages, internal links pass, SEO report mode is clean, API docs are consistent, PDF/document gates pass, and the deploy artifact audit passes.

It is not yet fully wrapped as a polished public product. The remaining gaps are productization gaps rather than basic routing gaps: language coverage and hreflang reciprocity, mojibake/encoding cleanup, open public write endpoints that need abuse and cost review, thin category/country hubs, underbuilt cars data, creator app refresh work, live source review queues, and uneven cross-device user functionality.

## Proof Run

- `npm run audit` passed: 2,194 registry entries, 2,121 live, 68 new, 5 queued, 0 missing live/new pages.
- `npm run seo:report` passed.
- `npm run check-links` passed after a longer rerun: 8,349 HTML files scanned, 2,980 redirect rules loaded, 0 broken internal links.
- `npm run build:i18n:validate` passed for `fr`, `sw`, `yo`, and `ha` JSON keys.
- `npm run validate:hreflang` completed with 502 warnings, mostly non-bidirectional hreflang pairs.
- `npm run blog:feed:check` passed: feed has 40 items, latest `kenya-shif-deduction-2026`.
- `npm run blog:verify` passed: 176 publishable articles, 177 hub cards, 40 RSS items.
- `npm run government:sources:check`: 58 sources, 13 changed, 23 blocked/manual, 0 broken.
- `npm run transport:sources:check`: 41 sources, 1 changed, 10 blocked/manual, 0 broken.
- `npm run cars:catalog:validate` passed, but the active catalog is only 25 rows.
- `npm run pdf:verify` passed: 31 registry tools, 34 HTML/app surfaces, gate coverage OK.
- `npm run category-workflow:verify` passed.
- `npm run salary-tax:verify` passed.
- `npm run vat-business-tax:verify` passed.
- `npm run security:scan` passed.
- `npm run audit:dist` passed.
- `npm run test:api-docs` passed across 31 API doc files.
- Netlify scheduled functions check passed: 32 configured, 32 matching function files.

## Current Repo Reality

- The checkout is already very dirty. Do not deploy from this working tree until unrelated edits and generated churn are separated.
- Public source inventory excluding `pro/**`, `dist/**`, `node_modules/**`, and `.git/**`: about 11,692 files.
- Public HTML inventory excluding Pro paths: about 8,318 pages.
- Public Netlify functions excluding Pro paths: 159 function files.
- Script inventory excluding Pro paths: 188 files.

## Product Gaps

### P0 - Fix Before Product Wrap

1. Encoding and mojibake are visible in public pages.
   - 43 files contain the replacement character `�`.
   - 184 files contain mojibake patterns such as `â€”`, `â†`, `Ã`, or `Â`.
   - Examples include Zambia/Zimbabwe VAT and hub pages with broken symbols, broken loading text, and placeholder labels like `??? Tax Authority`.

2. Hreflang reciprocity is not product-grade.
   - `validate:hreflang` reports 502 warnings.
   - The French ledger reports 499 missing reciprocal hreflang pairs involving French pages.
   - SEO report mode is clean, but language discoverability is still carrying structural debt.

3. Public write endpoints need a focused abuse, cost, and auth review.
   - `_redirects` exposes 113 `/api/*` or `/supabase-proxy/*` style routes mapped to 70 function targets.
   - Scanner found public write-like endpoints for lead capture, search capture, creator tools, PDF TTS, JAMB attempts, Afrowork key generation, AfroPrices submission, crypto tools, lifecycle email, and alerts.
   - Some endpoints are intentionally public, but the product wrap should document rate limits, origin rules, payload limits, storage writes, and cost exposure for each.

4. Live Supabase security lints need closure or explicit acceptance.
   - Security advisor flags RLS disabled on `public.spatial_ref_sys`.
   - PostGIS is installed in `public`.
   - Several public `SECURITY DEFINER` functions are executable by public/authenticated roles.
   - Leaked password protection is disabled.

5. Some public copy still says or implies unfinished product.
   - `afrowork/index.html` has multiple "Coming soon" feature blocks.
   - Many country hubs still say more tools are coming soon.
   - Some creator app/function code still uses placeholder language such as "In production" or "For now".

### P1 - Product Completeness

1. Cars is underfilled for a public product lane.
   - Active catalog rows: 25.
   - Targets in the catalog summary are far higher: old 2/300, fairly recent 19/450, very recent 4/250.
   - Body coverage is thin: hatchback 2/150, MPV 2/140, pickup 3/170, sedan 10/280, SUV 8/260.
   - Toyota is 12 of 25 rows, so market diversity is weak.

2. Language coverage is uneven.
   - French: 1,651 pages, raw completion 28.79%, mapped completion 26.77%, registry coverage 55.6%.
   - Swahili: 852 public HTML pages, stronger than Hausa but still carrying hreflang and search/discovery debt.
   - Hausa: 36 public HTML pages; existing Hausa ledger reports 60 visible-English blocker findings across 9 routes.
   - Yoruba: JSON exists and validates, but public HTML count is 0.
   - `node scripts/build-i18n.js --lang ha --dry-run` discovered 5,735 pages but built 0 Hausa pages, so generator readiness and page ownership need review.

3. Creator and full-app surfaces need a refresh pass.
   - `npm run audit` reports 41 full app tools; a file scan found 48 `app.html` surfaces including French wrappers.
   - Weak or unfinished app copy appears in `tools/creator-canvas/app.html`, `tools/creator-kit/app.html`, `tools/creator-page/app.html`, and `tools/creator-stock/app.html`.
   - `netlify/functions/creator-pricing.js` still reads like a placeholder backend path.
   - Several apps appear local-first with weak save/workspace/account affordances.

4. Live source workflows need a review queue closeout.
   - Government sources: 13 changed, 23 blocked/manual.
   - Transport sources: 1 changed, 10 blocked/manual.
   - These are not broken, but they are open editorial/data verification work.

5. Account-backed user behavior is present but underused.
   - Supabase live tables show `profiles` 54, `favorites` 7, `calculation_history` 19, `workspace_items` 25.
   - Many public tools still feel local-only even when the product has account/workspace concepts.
   - Wrap should add consistent save, export, history, favorite, and resume affordances to high-value public tools.

### P2 - Product Polish And Growth

1. Thin hubs need stronger workflow design.
   - Most urgent: `data-productivity/`, `business/`, `property/`, `cars/`, `hr-payroll/`, `career/`, `ecommerce/`, and `language/`.
   - These need real search/filtering, task lanes, saved workflows, stronger internal links, and clearer "next action" surfaces.

2. Many category hubs lack search or workflow affordances.
   - Missing search patterns were found on hubs such as `energy/`, `telecom/`, `transport/`, `legal/`, `sports/`, `travel/`, `fintech/`, `insurance/`, `hr-payroll/`, `property/`, `climate/`, `security/`, and `diaspora/`.
   - Missing workflow patterns were found on `language/`, `data-productivity/`, `business/`, `hr-payroll/`, `ecommerce/`, `property/`, `career/`, and `countries/`.

3. Country hubs are structurally present but often shallow.
   - Many country roots have only 3 to 4 public pages.
   - The next country pass should enrich top markets with actual country-specific calculators, live source cards, local currency UX, and linked tool collections rather than only generic hub cards.

4. Registry queued entries should be cleaned before final positioning.
   - Five queued tools remain, all in engineering.
   - One queued entry has mixed-language naming: `site-clearance` is named `Site Utoaji wa freight Cost Estimator`.

## Open Endpoint Review List

These are not automatically vulnerabilities. They are product-wrap review targets because they accept public traffic, write data, trigger email, use external services, or expose costly workflows.

- Lead and analytics capture: `capture-lead`, `capture-b2b-lead`, `capture-search`.
- User/auth surface: `auth-session`.
- Email: `send-lifecycle-email`, `email-unsubscribe`, `minimum-wage-alerts`.
- Creator tools: `creator-calendar`, `creator-canvas`, `creator-carousel`, `creator-hooks`, `creator-page`, `creator-pricing`, `creator-thumb`, `creator-split`.
- API key and usage: `afrowork-api-keygen`, `afrowork-api-usage`.
- Public education/JAMB flows: `jamb-attempt`, `jamb-daily-signup`.
- Data contribution/search: `afroprices-search`, `afroprices-submit`, `afrokitchen-community`.
- Costly media/AI-like surfaces: `pdf-tts`, creator generation endpoints.
- Crypto public tools: `crypto-portfolio`, `crypto-scam`, `crypto-image`.

Endpoints with wildcard CORS should be reviewed first where they also write data or generate output: `afrowork-api-keygen`, `afrowork-api-usage`, `api-v1`, several creator endpoints, and JAMB endpoints.

## Hubs That Need Improvement First

1. `cars/`
   - The UX promises a market/product lane, but the data inventory is too thin.
   - Refresh with expanded catalog coverage, local-currency-first price intelligence, marketplace source notes, and saved comparisons.

2. `data-productivity/`, `business/`, `property/`
   - These are thin public hubs and should get workflow-first redesigns before being treated as product-grade sections.

3. `hr-payroll/`, `career/`, `ecommerce/`, `language/`
   - These have enough strategic value to justify richer onboarding, filtering, saved workflows, and stronger internal routing.

4. `energy/`, `telecom/`, `transport/`, `fintech/`, `insurance/`, `climate/`, `sports/`, `security/`, `diaspora/`
   - Add hub search/filtering, trust/source modules, and repeat-use actions.

5. Country hubs
   - Prioritize Nigeria, Kenya, Ghana, South Africa, Uganda, Tanzania, Rwanda, Zambia, Zimbabwe, and francophone top markets.
   - Each should get country-specific tool collections, live/source badges, tax or salary anchors, and localized internal links.

## Apps That Need Refresh

1. Creator suite
   - Refresh `creator-canvas`, `creator-kit`, `creator-page`, `creator-stock`, and `creator-pricing`.
   - Remove placeholder language, align backend/function behavior, and make save/export/share states consistent.

2. AfroWork
   - Public page still has "coming soon" modules.
   - Decide whether to ship as a lean focused product or hide unfinished modules.

3. JAMB flows
   - Public write endpoints are useful but should have durable rate limiting, abuse controls, and clearer account/resume behavior.

4. PDF TTS
   - Public GET/POST behavior is rate-limited in memory.
   - If voice generation has real cost, move to durable limits or account gating.

5. French app wrappers
   - Several French `app.html` wrappers exist for apps like Ajo, BOQ, business plan, contract, cover letter, meeting minutes, and school fees.
   - Confirm they are intentionally wrapped, discoverable, and not stale copies of English flows.

## User Functionality To Add Or Standardize

- One consistent public account prompt: save result, favorite tool, continue later, export.
- Cross-device calculation history on high-value calculators, not only localStorage.
- Workspace cards for repeated workflows: salary, VAT, cars, PDF, business, school, JAMB, creator.
- Clear guest vs signed-in behavior on every advanced app.
- Durable server-side rate limits for public write/cost endpoints.
- Better "source freshness" UI where live data is used.
- A unified feedback/report-bad-data action across data-backed tools.
- Save/share/export patterns on category hubs, not only individual tools.
- Language switcher that only links to real, useful localized routes.
- Per-language QA ledgers for visible English, mojibake, hreflang, registry discovery, and route ownership.

## Recommended Wrap Plan

### Phase 1 - Stabilize Before Marketing

- Freeze deploy source and separate unrelated dirty-tree changes.
- Fix replacement-character and mojibake files.
- Close or document Supabase security advisor findings.
- Review public write endpoints for auth, origin, payload, rate limit, cost, and abuse exposure.
- Fix hreflang reciprocity, especially French.

### Phase 2 - Productize Core Public Workflows

- Refresh creator apps and AfroWork unfinished surfaces.
- Expand the cars catalog and country-local pricing coverage.
- Close government and transport manual source review queues.
- Standardize save/history/export/favorite affordances on top public tools.

### Phase 3 - Upgrade Discovery Surfaces

- Rebuild thin hubs into workflow-first sections.
- Add hub-level search/filtering where missing.
- Improve country hubs with real local modules and source-backed data.
- Make language availability honest and useful.

### Phase 4 - Language Finish

- French: move from about 29% raw coverage and 56% registry coverage toward complete discovery for top tools/hubs.
- Swahili: repair carried hreflang/search/discovery issues.
- Hausa: fix visible-English blockers and decide generator ownership before scaling.
- Yoruba: decide whether to launch real pages or remove the appearance of readiness from product positioning.

## Ship Readiness Call

Do not call AfroTools fully wrapped yet.

Call it: "public-site technically stable, product wrap still in progress."

The main blocker is not missing pages or broken links. The blocker is coherence: open endpoint hardening, language honesty, app finish, data depth, and user workflow consistency.
