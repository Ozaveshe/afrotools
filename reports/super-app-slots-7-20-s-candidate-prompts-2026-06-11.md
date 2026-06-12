# Super App Slots 7-20 S-Candidate Prompt Pack

Date: 2026-06-11

Scope: slots 7 through 20 from `data/strategy/super-apps-100.json` and `docs/SUPER-APPS-DIRECTORY.md`.

Goal: produce copy-paste-ready implementation prompts that can move every app in this cohort toward "Approved S-class candidate" without skipping any route.

## S-Candidate Bar

An app can be approved only when it has:

- A complete workflow for one real user job.
- A strong first-screen action, not only marketing copy.
- Mobile width proof with no horizontal overflow.
- Visible trust language: source-backed, local-only, estimate-only, or account-backed.
- Export, copy, save, share, packet, or handoff output where useful.
- Honest data and integration claims.
- No console errors or local static preview 404s on the promoted route.
- A clear YouTube/ad angle tied to the actual workflow.
- Targeted validation plus `npm run audit` and `npm run check-links` before promotion.

## Online And Local Evidence Snapshot

Production was checked at `https://afrotools.com` on 2026-06-11 with a 390px mobile viewport. Local checkout was checked at `http://127.0.0.1:4173` with the same viewport.

| Slot | App | Route | Production | Local | Immediate technical note |
| --- | --- | --- | --- | --- | --- |
| 7 | AfroPlan Floor Planner | `/engineering/floor-planner/` | 200, overflow 0, console clean | 200, overflow 0, console clean | Strong interaction surface, still beta-positioned. |
| 8 | AfroStream | `/tools/afrostream/` | 200, overflow 0, console clean | 200, overflow 0, console clean | Local has the new source rail; production has no export path. |
| 9 | CV Builder | `/tools/cv-builder/` | 200, overflow 0, 2 preload warnings | 200, overflow 0, console clean | Needs parser/export proof and sample-safe path. |
| 10 | African Car Price Directory | `/cars/` | 200, overflow 0, console clean | 200, overflow 0, console clean | Needs buyer-decision output beyond search. |
| 11 | Remittance Comparator Pro | `/tools/remittance-v2/` | 200, overflow 0, console clean | 200, overflow 0, console clean | Needs provider freshness and corridor evidence. |
| 12 | Solar Panel ROI Calculator | `/tools/solar-roi/` | 200, overflow 0, console clean | 200, overflow 0, console clean | Current route is mostly a country gateway, not the flagship calculator. |
| 13 | AfroPayroll OS | `/tools/afropayroll-os/` | 200, overflow 0, console clean | 200, overflow 0, console clean | Needs statutory freshness and account-vs-device truth. |
| 14 | Invoice Generator | `/tools/invoice-generator/` | 200, overflow 0, console clean | 200, overflow 0, console clean | Strong tool, needs saved-client/recent-invoice activation and VAT proof. |
| 15 | AfroDraft 2D CAD | `/engineering/afrodraft/` | 200, overflow 0, console clean | 200, overflow 0, console clean | Landing is strong, app needs template and export proof pass. |
| 16 | AfroKitchen | `/tools/afrokitchen/` | 200, overflow 0, console clean | 200, overflow 0, console clean | Needs meal plan and shopping-list workflow depth. |
| 17 | AfroFX Currency Rates | `/tools/currency-converter/` | 200, overflow 317, console clean | 200, overflow 0, console clean | Local fix exists for overflow and presets; production still needs deployment. |
| 18 | AfroRates Central Bank Tracker | `/tools/afrorates/` | 200, overflow 440, static fallback warning | 200, overflow 442, `/api/rates` 404 locally | Needs runtime repair before S approval. |
| 19 | AfroFuel Price Tracker | `/tools/fuel-tracker/` | 200, overflow 770, console clean | 200, overflow 770, `/api/fuel` 404 locally | Needs runtime repair before S approval. |
| 20 | AfroConflict Intelligence | `/tools/africa-conflict/` | 200, overflow 0, console clean | 200, overflow 0, console clean | Strong base, needs source-bound what-changed workflow. |

## Competitor And Reference Signals Used

- Floor planning: [Floorplanner](https://floorplanner.com/), [Planner 5D](https://planner5d.com/use/floor-plan-software), [Canva floor plans](https://www.canva.com/create/floor-plans/), [Floorplanner export API](https://floorplanner.readme.io/reference/exportproject).
- Creator and streaming intelligence: [YouTube live creator guide](https://www.youtube.com/intl/en_us/creators/live-streaming-on-youtube/), [Social Blade](https://socialblade.com/), [Social Blade creator lists](https://socialblade.com/youtube/lists/top/100/views/all/global).
- Career documents: [Canva AI Resume Builder](https://www.canva.com/ai-resume-builder/), [Canva cover letters](https://www.canva.com/create/cover-letters/), [Resume.io templates](https://resume.io/cover-letter-templates), [Resume.io generator](https://resume.io/cover-letter-generator).
- Car marketplace: [AutoTrader South Africa](https://www.autotrader.co.za/), [Autotrader US](https://www.autotrader.com/), [Autochek app listing](https://play.google.com/store/apps/details?hl=en_US&id=com.autochek.buysalefixcars), [Autochek App Store](https://apps.apple.com/ng/app/autochek/id1535055075).
- Remittance: [Wise pricing](https://wise.com/us/pricing/send-money), [Wise send-money comparison](https://wise.com/us/send-money/), [World Bank Remittance Prices Worldwide](https://remittanceprices.worldbank.org/), [World Bank remittance cost indicator](https://data.worldbank.org/indicator/SI.RMT.COST.IB.ZS).
- Solar: [EnergySage solar calculator](https://www.energysage.com/solar/calculator/), [EnergySage payback method](https://www.energysage.com/solar/understanding-your-solar-panel-payback-period/), [PVWatts](https://pvwatts.nlr.gov/), [EPA PVWatts note](https://www.epa.gov/statelocalenergy/local-renewable-energy-solar).
- Payroll: [Deel](https://www.deel.com/), [Deel payroll countries](https://www.deel.com/blog/where-you-can-run-payroll-for-international-employees/), [Gusto](https://gusto.com/), [Gusto time tools](https://gusto.com/product/time-tools).
- Invoicing: [Zoho Invoice](https://www.zoho.com/us/invoice/), [Zoho Invoice features](https://www.zoho.com/us/invoice/features/), [Zoho pricing/features](https://www.zoho.com/us/invoice/pricing/), [Invoice Simple](https://play.google.com/store/apps/details?hl=en_US&id=com.aadhk.woinvoice).
- CAD: [AutoCAD Web](https://www.autodesk.com/products/autocad-web/overview), [AutoCAD Web details](https://www.autodesk.com/products/autocad-web/product-details), [LibreCAD](https://librecad.org/), [LibreCAD layers docs](https://docs.librecad.org/en/latest/ref/fundamentals.html).
- Recipes and meal planning: [Tasty app](https://play.google.com/store/apps/details?hl=en_US&id=com.buzzfeed.tasty), [Tasty App Store](https://apps.apple.com/us/app/tasty-recipes-cooking-videos/id1217456898), [Allrecipes meal planning](https://www.allrecipes.com/kitchen-tips/how-to/meal-planning/), [Nutrition.gov meal planning](https://www.nutrition.gov/topics/shopping-cooking-and-meal-planning/food-shopping-and-meal-planning).
- FX and rates: [Xe currency converter](https://www.xe.com/en-us/currencyconverter/), [Xe charts and alerts](https://www.xe.com/en-us/currencycharts/), [OANDA converter](https://www.oanda.com/currency-converter/en/), [OANDA FX API](https://www.oanda.com/foreign-exchange-data-services/en/exchange-rates-api/), [Trading Economics](https://tradingeconomics.com/), [Central Bank News](https://www.centralbanknews.info/).
- Fuel: [GlobalPetrolPrices API](https://www.globalpetrolprices.com/data_access.php), [GlobalPetrolPrices source statement](https://www.globalpetrolprices.com/), [World Bank Global Fuel Prices Database](https://datacatalog.worldbank.org/search/dataset/0066829/global-fuel-prices-database).
- Conflict intelligence: [ACLED](https://acleddata.com/), [ACLED conflict data](https://acleddata.com/conflict-data), [ACLED data export](https://acleddata.com/conflict-data/data-export-tool), [UNHCR Operational Data Portal](https://data.unhcr.org/), [UNHCR data](https://www.unhcr.org/what-we-do/data-and-publications/unhcr-data), [ReliefWeb Labs](https://reliefweb.int/labs).

## Slot 7 - AfroPlan Floor Planner

Route: `/engineering/floor-planner/`

Research signal: Floorplanner and Planner 5D lead with 2D planning, 3D/visual output, furniture libraries, templates, and exports. Canva adds quick visual templates and unlimited canvas style positioning. AfroPlan already has canvas tools, templates, save, estimate, PDF/PNG/BOQ export, but the first user job still feels beta and needs a clearer starter workflow.

Prompt 7.1 - First-screen starter templates:

```text
Work in C:\Users\Oza\Documents\afrotools. Inspect git status first and preserve unrelated dirty work. Upgrade only AfroPlan Floor Planner at engineering/floor-planner/index.html and any existing floor-planner JS/CSS files it already uses. Add a first-screen starter template strip for real African use cases: single room, kiosk/shop, salon/barber, classroom, small office, and 2-bedroom starter home. Each template must load a local deterministic draft into the existing canvas, not call AI. Keep the beta honesty around AI generation. Add a visible "what this template includes" note and a "customize after loading" hint. Do not invent cloud sync or professional approval claims. Validate with a 390px Playwright smoke on /engineering/floor-planner/ checking route 200, no overflow, no console errors, template click changes the canvas or saved plan state, and existing Save/PDF/PNG/BOQ controls remain reachable. Run git diff --check for touched files.
```

Prompt 7.2 - Export proof and local save confidence:

```text
Inspect engineering/floor-planner/index.html and its app runtime. Add a compact "Save and export proof" panel near the toolbar or export controls that tells the user what is saved locally and what each export produces: PDF, PNG, and BOQ-style notes. Implement an export confirmation status live region that updates after each export attempt and after local save. If exports are already implemented, wire the status to existing handlers instead of adding a duplicate export system. Do not upload drawings or add account gates. Validate Save, PDF, PNG, and BOQ paths with synthetic use only, then run a mobile browser smoke and git diff --check.
```

Prompt 7.3 - Measurement and BOQ credibility:

```text
Upgrade AfroPlan as a practical planning workflow, not a decorative canvas. Review existing measurement, units, cost estimate, and BOQ logic. Add clear unit labels, room-area summary, wall-length summary, and a cautious material estimate note that says estimates are planning aids, not contractor quotes. If cost data is static, label assumptions and let the user edit unit cost values before export. Add one testable fixture template whose wall lengths and area can be checked deterministically. Validate the fixture result in browser and keep all calculations local.
```

Prompt 7.4 - Mobile drawing QA and accessibility:

```text
Run a focused UX QA pass on AfroPlan at 360px, 390px, and desktop. Fix only issues that block touch drawing, toolbar access, modal close behavior, focus visibility, or text overflow. Add accessible labels for any icon-only buttons that are missing them. Ensure the canvas cannot push the page horizontally and that modals fit small screens. Do not redesign the whole app. Return before/after evidence with screenshots or measured Playwright metrics.
```

## Slot 8 - AfroStream

Route: `/tools/afrostream/`

Research signal: YouTube Studio and YouTube Live emphasize stream health and live analytics. Social Blade emphasizes cross-platform creator ranks, grades, top lists, and favorites. AfroStream already has rankings, live streams, news, calendar, and a local source rail, but needs stronger source health, media-kit and sponsor paths, and exportable creator intelligence.

Prompt 8.1 - Source health rail across live, rankings, news, and calendar:

```text
Work only on AfroStream public surfaces: tools/afrostream/index.html plus directly related AfroStream JS/data files. Inspect tools/afrostream/HANDOFF.md and docs/AFROSTREAM-TRACKING.md first if present. Check production /tools/afrostream/ and local route. Add or complete a visible source-health rail that covers live streams, creator rankings, news, and calendar separately: live, preview, stale, blocked, or unavailable. On localhost static preview, avoid Netlify-only API 404s and show preview/static state honestly. On production, do not hide failed/partial data behind "live" copy. Validate with Playwright on local and production route: 200, no overflow, no console errors, source rail present, and no local /api 404s.
```

Prompt 8.2 - Creator card to media-kit export:

```text
Turn AfroStream from a discovery page into a creator-intelligence workflow. Add a "Save creator brief" or "Copy media kit note" action to ranking/live creator cards using existing displayed fields only. The output should include creator name, platform/category/country if available, current rank or live status, source date/status, and a neutral sponsor-note template. Do not invent follower counts, revenue, or verification. Add copy feedback via a live region. Validate by copying from at least one visible card in browser and checking no raw internal scraper fields are exposed.
```

Prompt 8.3 - Watchlist and YouTube-content queue:

```text
Add a local-only AfroStream watchlist for creators and streams. Store only minimal non-sensitive public metadata in localStorage. Add a "YouTube video angle" queue panel for saved creators: creator spotlight, weekly trend, platform comparison, or event calendar. Keep this as a planning aid, not analytics truth. Include export to TXT/JSON. Validate save, remove, export, reload persistence, and no console errors.
```

Prompt 8.4 - Freshness pipeline QA prompt:

```text
Audit AfroStream freshness end to end without changing unrelated content. Check local route files, netlify/functions/afrostream-news-monitor.js, netlify/functions/afrostream-sync.js, and any public health/status endpoint used by the page. If live Supabase truth is needed, use the configured AfroTools Supabase MCP first. Report whether the public route exposes only safe public summaries, not internal scraper errors or raw run details. Patch only narrow defects that affect the public source-health UI or unsafe payload exposure. Validate route smoke, function syntax, and any existing AfroStream audit command available in package.json.
```

Prompt 8.5 - Creator search and filters:

```text
Improve AfroStream's search/filter workflow. Make search visibly filter live, rankings, streamers, news, and calendar or clearly show which lane it filters. Add empty states that help users recover. Add country/platform/category chips where data exists. Do not create fake data to fill filters. Validate using three searches: a creator with a result, a country/category query, and a no-result query.
```

## Slot 9 - CV Builder

Route: `/tools/cv-builder/`

Research signal: Canva and Resume.io compete through templates, resume plus cover letter handoff, AI help, Word/PDF export, and job-specific presentation. AfroTools has a strong local-first CV surface, but approval needs parser-compatible proof, sample-safe demos, and privacy clarity.

Prompt 9.1 - Parser-compatible export proof:

```text
Inspect docs/ADDING-A-TOOL.md and the CV Builder files under tools/cv-builder/ before editing. Keep sensitive user content local-first. Add an ATS/parser proof panel that explains what has actually been verified: text-based PDF path, print path, import limitations, and no guarantee language. Add a synthetic fixture export test or documented manual proof route that never uses real user data. Fix the production preload warnings if they come from incorrect preload attributes or unused eager loads. Validate route 200, no overflow, no console warnings, template switch, PDF/print/export path, and git diff --check.
```

Prompt 9.2 - Sample-safe demo mode:

```text
Add a "Try sample CV" mode to /tools/cv-builder/ that fills the builder with clearly synthetic African job-seeker data. The sample must be obviously fake and must not be logged, sent, or stored in analytics as raw content. Add a reset-to-blank action. The demo should let users see preview, template switching, ATS simulator, and export without pasting private data. Validate sample load, reset, local save boundaries, and no PII in analytics calls or console output.
```

Prompt 9.3 - Role and country template pack:

```text
Upgrade the CV Builder template flow with role/country starter paths: graduate/no experience, professional, tech/developer, government/NGO, diaspora/international, and trade/apprenticeship. Each starter should adjust section emphasis and guidance, not create fake career claims. Preserve existing templates and saved CV behavior. Add a concise "best for" note per starter. Validate starter selection, preview content structure, mobile layout, and keyboard access.
```

Prompt 9.4 - Cover letter and job-match handoff:

```text
Connect CV Builder to /tools/cover-letter-generator/ and any job-offer or scholarship tools with a privacy-preserving handoff. Do not put raw CV text into URLs. Offer copy-to-clipboard or local JSON export/import instead. Add a CTA after CV completion: "Create matching cover letter", "Evaluate job offer", and "Estimate salary/tax" only where those routes exist. Validate links, no sensitive query strings, and local-only wording.
```

## Slot 10 - African Car Price Directory

Route: `/cars/`

Research signal: AutoTrader and Autochek compete with inventory search, valuation, finance, inspection, seller contact, and buyer decision support. AfroTools has African import-vs-local framing and source links, but needs a stronger buyer packet and freshness/confidence around prices.

Prompt 10.1 - Local vs import decision packet:

```text
Upgrade /cars/ and its existing JS, especially assets/js/cars-directory.js and assets/js/cars-super-app-focus.js if present. Add a "Local vs import decision packet" action on each result. The packet should summarize local asking range, landed-cost range, import recommendation, confidence, assumptions, and next action links to /tools/car-import-cost/ and /tools/import-duty/. Use only existing data fields. Do not imply live inventory or dealer availability unless backed. Validate copy/export packet, mobile no-overflow, and console clean.
```

Prompt 10.2 - Price freshness and confidence labels:

```text
Add visible source confidence and freshness labels to the car directory first screen and each result. Label data as estimate/static/snapshot unless a verified live source exists. Include official customs source links already present on the page and explain what they cover. Do not invent dealer feeds. Validate that every result card has a confidence state and that the methodology section is reachable from the first screen.
```

Prompt 10.3 - Buyer scenario presets:

```text
Expand car buyer presets around real purchase jobs: reliable family sedan, low-maintenance taxi/ride-hailing, fuel-saving commuter, pickup for trade work, and import candidate. Each preset should set existing filters and scroll to results. Add a visible "why this preset" note after click. Validate each preset changes form state and produces a buyer summary.
```

Prompt 10.4 - Finance and inspection next steps:

```text
Add honest next-step cards after the car results: estimate finance, check insurance, compare import duty, prepare inspection checklist, and contact business enquiry. Do not add fake loan approval, dealer booking, or inspection certification. If a route does not exist, do not link it. Validate all links with npm run check-links or focused link checks.
```

## Slot 11 - Remittance Comparator Pro

Route: `/tools/remittance-v2/`

Research signal: Wise leads with upfront fees and exchange-rate transparency. The World Bank Remittance Prices Worldwide database provides corridor cost benchmarks and update dates. AfroTools needs provider freshness and no-live-quote boundaries unless quotes are verified.

Prompt 11.1 - Provider freshness and estimate boundary:

```text
Review tools/remittance-v2/index.html and any related provider data. Add a visible provider freshness panel near results that states whether provider fees/rates are static estimates, manually maintained, or live verified. If no live provider API is used, say "Not a live quote" near the compare button and results. Do not claim cheapest live provider. Validate corridor compare, no overflow, no console errors, and copy/export still works.
```

Prompt 11.2 - Corridor benchmark research integration:

```text
Add a World Bank benchmark reference section for remittance corridors without hardcoding unsupported current rates. Link to Remittance Prices Worldwide and explain that AfroTools compares user-entered/provider-estimate scenarios against transparent assumptions. Add fields for sending country, receiving country, amount, fee, FX margin, payout method, and annual transfer count. Validate at least four corridors: UK to Nigeria, US to Kenya, Canada to Ghana, South Africa to Malawi.
```

Prompt 11.3 - Recipient value and annual savings output:

```text
Make the primary result "recipient gets" and "annual savings" instead of only fee ranking. Add a copyable transfer plan that includes provider, fee, FX margin, payout method, speed, total cost, recipient value, and caveat. Keep all provider claims editable if static. Validate result sorting by cost and by speed/recipient access.
```

Prompt 11.4 - Affiliate-safe and compliance-safe CTA:

```text
Add a post-result CTA area for affiliate/provider links or business enquiry, but keep it disabled or generic unless real partner links exist. Add compliance-safe copy: AfroTools does not move money, hold funds, or guarantee availability. Validate that no CTA implies regulated money transfer service status.
```

## Slot 12 - Solar Panel ROI Calculator

Route: `/tools/solar-roi/`

Research signal: EnergySage estimates savings from address, bill, and offers; PVWatts estimates PV energy production globally. AfroTools currently reads like a country gateway, so S-candidate approval needs an actual first-screen calculator experience and generator comparison.

Prompt 12.1 - Gateway to calculator first screen:

```text
Inspect /tools/solar-roi/ and country subroutes under tools/solar-roi/. Convert the top route from mostly country links into a usable calculator first screen: country, monthly electricity spend, generator fuel spend, outage hours, system size, battery option, and financing toggle. Keep country links below as deeper routes. Do not remove existing country pages. Validate first-screen calculation at 390px and desktop.
```

Prompt 12.2 - Payback method and assumption transparency:

```text
Add a source and assumptions panel based on a simple payback formula: total system cost divided by annual savings. Let users edit tariff, fuel price, install cost per kW, battery cost, maintenance, and financing assumptions. Label all default values with source/freshness state. Do not claim installer quotes or PVWatts accuracy unless integrated and verified. Validate output changes when assumptions change.
```

Prompt 12.3 - Solar vs generator result card:

```text
Create a headline result that compares solar monthly savings, generator monthly cost, payback period, battery resilience, and affordability risk. Add copy/export summary for WhatsApp or PDF/TXT. Link to /tools/generator-fuel/ if it exists. Validate the output for Nigeria, Kenya, South Africa, and Ghana scenarios.
```

Prompt 12.4 - Country subroute consistency:

```text
Audit all promoted /tools/solar-roi/{country}/ pages. Ensure each country page has the same calculator controls or a clear route back to the main calculator, a source/freshness note, no unsupported tariff claims, no overflow, and no console errors. Patch only shared templates or scripts where possible. Run a route smoke for the top 10 country pages.
```

## Slot 13 - AfroPayroll OS

Route: `/tools/afropayroll-os/`

Research signal: Deel sells global payroll breadth and compliance operations; Gusto connects payroll, HR, time tracking, onboarding, and benefits. AfroPayroll can win on Africa-first depth, but must be honest about account-backed vs local-only behavior and source freshness.

Prompt 13.1 - Account-vs-device truth and workflow resume:

```text
Inspect tools/afropayroll-os/index.html, workspace.html, flow.html, and related payroll JS. Add a clear account-vs-device save status on the public route and workspace. Explain what persists locally, what requires account-backed Pro, and what is not filing with authorities. Ensure the dominant CTA starts a payroll run and secondary CTAs route to plan/compare workflows. Validate route 200, no overflow, resume card behavior, and links.
```

Prompt 13.2 - Statutory source freshness by country:

```text
Add a payroll source freshness panel for country-specific PAYE, minimum wage, pension, leave, social security, and payslip assumptions. Use existing source ledgers if present. If live Supabase or official source verification is needed, use the configured AfroTools Supabase MCP first and official government/statutory sources before changing rates. Do not invent rates. Validate with focused payroll/source tests available in package.json.
```

Prompt 13.3 - Payroll run packet:

```text
Implement or improve a payroll run packet export from AfroPayroll OS. It should include employee count bucket, gross pay total, deductions summary, employer cost, payslip links, checklist state, assumptions, and source date. Avoid raw sensitive data in analytics. Provide TXT/CSV/JSON export where possible and keep PDF optional if already supported. Validate export with synthetic fixtures only.
```

Prompt 13.4 - Pro bridge without overclaims:

```text
Review all Pro/paid CTAs from AfroPayroll OS. Replace any vague "compliance" or "file payroll" copy with precise language: prepare, calculate, review, export, or account-backed workspace only where verified. Add a Pro readiness note that says what Pro unlocks and what remains manual. Validate with npm run pro:verify and check-links if routes or copy change.
```

## Slot 14 - Invoice Generator

Route: `/tools/invoice-generator/`

Research signal: Zoho Invoice competes with payment reminders, recurring invoices, customer portal, expense/project billing, and reports. Invoice Simple competes on fast mobile invoice, estimate, receipt, logo, signature, discounts, tax, and sending. AfroTools has a deep invoice tool but needs faster activation and country tax proof.

Prompt 14.1 - Saved client and recent invoice activation:

```text
Inspect tools/invoice-generator/index.html and its storage/export logic. Add first-screen starter cards for "Use saved client", "Recent invoice", "New invoice", "Receipt", and "Quote/estimate" if the underlying fields can support them. Do not add cloud customer portal claims. Ensure localStorage data is clearly local to this browser. Validate saved client quick add, recent invoice restore, blank start, and mobile layout.
```

Prompt 14.2 - Country VAT and tax source proof:

```text
Add a country/tax assumptions panel to the invoice generator. Let users choose country and tax type, but only prefill VAT/rate values that already exist in trusted repo data or verified official sources. Label values with source date or "manual entry". Do not invent tax rates. Link to VAT calculators where existing. Validate that manual tax entry still works and export includes the tax assumption.
```

Prompt 14.3 - Reminder, receipt, and quote workflow:

```text
Extend the existing invoice actions into a small receivables workflow: copy payment reminder, mark paid/part-paid, generate receipt view, and convert quote/estimate to invoice if supported by fields. Keep it local-first. Add export or print proof for invoice and receipt. Validate PDF, print, JSON import/export, share link behavior, and no console errors.
```

Prompt 14.4 - Mobile business owner QA:

```text
Run a mobile-first QA on Invoice Generator at 360px and 390px. Fix clipped controls, overflowing template buttons, sticky action collisions, focus states, and labels. Ensure every input has a visible or accessible label. Do not redesign the whole page. Validate by creating one invoice with two line items, tax, partial payment, PDF export, JSON export, and print.
```

## Slot 15 - AfroDraft 2D CAD

Route: `/engineering/afrodraft/`

Research signal: AutoCAD Web emphasizes browser/mobile editing, viewing, sharing, DWG access, and cloud/local file access. LibreCAD emphasizes open-source 2D CAD, layers, dimensions, and DXF-style drafting. AfroDraft has a strong landing page, but S approval needs app-level template proof and export/compatibility evidence.

Prompt 15.1 - Template starter pack:

```text
Inspect engineering/afrodraft/index.html, engineering/afrodraft/app.html, and the CAD runtime files. Add templates for room, shop, fence, simple site plan, classroom, and kiosk. Templates must be local deterministic drawings with layers and dimensions, not AI output. Add a landing-page preview and an in-app template launcher. Validate each template loads and can be edited.
```

Prompt 15.2 - Export and compatibility proof:

```text
Audit AfroDraft export paths for SVG, DXF, PNG, PDF, and any saved drawing format. Add an export proof panel that explains what each format is useful for and any limitations. Do not claim DWG compatibility unless actually implemented. Add a deterministic fixture export and check that files are non-empty and contain expected layer/dimension markers where possible. Validate with browser and node syntax checks for changed scripts.
```

Prompt 15.3 - CAD command workflow QA:

```text
Run a focused command workflow smoke inside AfroDraft app.html: draw line, rectangle, dimension, annotate, trim/offset/fillet if present, switch layer, undo/redo, save, reload, export. Fix only broken handlers, missing labels, and mobile/tablet blockers. Keep canvas layout stable and no horizontal overflow. Return exact controls tested.
```

Prompt 15.4 - Student and builder tutorial mode:

```text
Add a lightweight guided tutorial mode for first-time AfroDraft users: "draw a room", "dimension a wall", "add a door", "export for review". The tutorial should highlight existing controls and not block expert use. Add a reset/tutorial replay action. Validate keyboard focus and reduced-motion preference.
```

## Slot 16 - AfroKitchen

Route: `/tools/afrokitchen/`

Research signal: Tasty competes with large recipe library, step-by-step cooking mode, personalized recommendations, save/likes, filters, and shopping. Allrecipes and Nutrition.gov emphasize meal planning and shopping lists. AfroKitchen has search, filters, planner controls, recipes, timers, and recipe pages, but needs meal-plan and image/source depth.

Prompt 16.1 - Cook-this-week meal plan and shopping list:

```text
Inspect tools/afrokitchen/index.html, AfroKitchen engine/runtime files, and recipe data sources. Upgrade the cook-this-week section into a complete weekly plan workflow: choose max time, servings, diet, country, occasion, then generate 3-day or 7-day recipe picks from existing recipes. Produce a grouped shopping list and copy/export action. Do not invent recipes. Validate plan generation, shopping list copy/export, empty states, mobile layout, and no console errors.
```

Prompt 16.2 - Recipe image and data quality audit:

```text
For AfroKitchen image/data truth, use configured AfroTools Supabase MCP first if live recipe inventory is needed, then cross-check local assets under assets/img/kitchen. Produce a ranked list of missing or weak recipe images and patch only safe route/image references if needed. Do not generate images in this prompt unless explicitly requested. Validate broken image count and recipe card fallback behavior.
```

Prompt 16.3 - Recipe detail cooking workflow:

```text
Audit a sample of AfroKitchen recipe pages plus tools/afrokitchen/static-recipe-runtime.js. Improve the cooking workflow with ingredient checkoff, serving scaling, timer status, nutrition display, substitution notes, print/copy recipe, and "add to meal plan" where supported. Keep all recipe content grounded in existing data. Validate at least five static recipe pages across different countries.
```

Prompt 16.4 - Community submission and moderation boundary:

```text
Review AfroKitchen submit/community paths. Add clear submission guidance, required fields, image/license expectations, and moderation state. Do not imply user submissions go live instantly unless backend moderation exists. Add a copyable recipe contribution checklist. Validate submit route links and no unsupported account claims.
```

## Slot 17 - AfroFX Currency Rates

Route: `/tools/currency-converter/`

Research signal: Xe and Wise provide converters, historical charts, rate alerts, transfer handoff, and clear mid-market/rate disclaimers. OANDA competes on API depth, historical FX, and broad currency coverage. Local checkout already fixes the production overflow and preset click bug, but production still overflows.

Prompt 17.1 - Deploy-ready overflow and preset proof:

```text
Review tools/currency-converter/index.html and the current local diff. Ensure the popular-pairs table cannot create mobile horizontal overflow, all data-fx-preset buttons call a top-level handler, and local static preview uses /data/forex/latest.json without 404s. Validate on 390px: route 200, overflow 0, USD:NGN preset sets from/to/amount and calculates, no console errors. If production still overflows after deployment, compare deployed CSS/scripts against local source.
```

Prompt 17.2 - Source confidence per rate:

```text
Add source/freshness badges beside the converter, popular pairs, heatmap, CBN snapshot, crypto, and matrix sections. Use live-data-status helpers where available. Distinguish live API, static snapshot, stale snapshot, and unavailable rates. Do not claim central-bank official rates for non-official data. Validate by simulating API failure and confirming fallback UI is honest.
```

Prompt 17.3 - Watchlist and rate alert planning:

```text
Add a local-only currency watchlist and rate-alert planning feature. Users can save pairs and target rates in localStorage, see whether the latest available rate is above/below target, and export the watchlist. Do not send notifications or emails unless real notification infrastructure exists. Validate save, update, remove, reload persistence, and export.
```

Prompt 17.4 - Widget/API conversion path:

```text
Create an honest business CTA for AfroFX: embeddable widget, API interest, and sponsor enquiry. Link only to existing widget/API/business routes. Add sample request/response only if backed by real endpoint docs. Do not expose private keys or internal URLs. Validate links and security scan if publish-surface files change.
```

## Slot 18 - AfroRates Central Bank Tracker

Route: `/tools/afrorates/`

Research signal: Trading Economics offers broad indicators, historical data, charts, news, forecasts, and API access. Central Bank News aggregates central bank decisions. AfroRates has rich controls, CSV export, MPC calendar, inflation and real-rate sections, but currently fails S bar because of mobile overflow and local `/api/rates` 404/fallback warning.

Prompt 18.1 - Mobile overflow repair:

```text
Fix AfroRates mobile horizontal overflow at tools/afrorates/index.html and any related CSS. The production/local overflow is around 440px at 390px viewport. Inspect tables, ticker tracks, comparison bars, map, and charts for fixed widths. Use responsive wrappers, min-width only inside scroll containers, and overflow containment. Validate 360px and 390px: overflow 0, table scrolls intentionally inside wrapper, no clipped filter buttons.
```

Prompt 18.2 - Local API fallback without 404 noise:

```text
Patch AfroRates data loading so localhost/static preview does not request Netlify-only /api/rates unless the server can serve it. Use the existing static snapshot first on localhost and live API first on production. Show a visible state when production live API returns partial coverage. Do not suppress real errors silently. Validate local route has no /api/rates 404 and production still shows partial/fallback status honestly.
```

Prompt 18.3 - Country watchlist and latest-update card:

```text
Add a local-only country watchlist to AfroRates. Users should save countries, see policy rate, inflation, real rate, latest update date/source state, and next MPC date if present. Add a latest-update card above the dashboard. Use existing data only and avoid fabricating MPC dates. Validate save/remove/reload and CSV export includes watchlist or a separate watchlist export.
```

Prompt 18.4 - Official-source methodology pass:

```text
Audit AfroRates source and methodology copy. Add links to central bank or reputable aggregator sources where already stored; otherwise label values as snapshot/estimate and add a source-needed marker. Do not invent official URLs. If live Supabase/source ledgers are involved, use the AfroTools Supabase MCP first. Validate visible source status on at least 10 country rows.
```

Prompt 18.5 - Brief/export workflow:

```text
Turn AfroRates into a decision brief tool. Add copy/export actions for "Africa rates weekly brief", "selected country brief", and "real-rate leaders". Include data date, source state, and caveat. Existing CSV export must keep working. Validate export output content and no raw internal error details.
```

## Slot 19 - AfroFuel Price Tracker

Route: `/tools/fuel-tracker/`

Research signal: GlobalPetrolPrices tracks and cross-checks retail fuel data across many countries and offers API/historical data. The World Bank Global Fuel Prices Database provides monthly retail fuel types and publicly sourced methodology. AfroFuel has strong UI and generator calculator, but fails S bar because mobile overflow is large and local `/api/fuel` 404s.

Prompt 19.1 - Mobile overflow repair:

```text
Fix AfroFuel mobile horizontal overflow at tools/fuel-tracker/index.html and related styles/scripts. Current 390px overflow is about 770px locally and in production. Inspect fuel map, tables, trend chart, tabs, generator calculator, FAQ, and share/download controls. Keep wide data tables inside horizontal scroll wrappers and prevent charts/maps from setting page-wide widths. Validate 360px and 390px overflow 0, console clean, and all main controls reachable.
```

Prompt 19.2 - Local static fallback and API state:

```text
Patch AfroFuel data loading so local static preview does not request Netlify-only /api/fuel and create 404 noise. Use existing static data first on localhost and live API first on production. Add a visible source state for live, static snapshot, stale, or unavailable. Do not claim live fuel prices when fallback data is shown. Validate local no /api/fuel 404 and production source state remains honest.
```

Prompt 19.3 - Generator-cost shortcut:

```text
Complete the super-app ten-minute improvement: from selected country/fuel row, add a "Calculate generator cost" shortcut that preloads the generator calculator with that country, fuel type, local price, hours, and days. Show monthly litres, monthly cost, annual cost, and copy/share result. Validate for Nigeria, Kenya, Ghana, South Africa, and one low-data country.
```

Prompt 19.4 - Fuel source proof and contribution quality:

```text
Add source/freshness labels per country or fuel row where data supports it. Add a contribution CTA to AfroPoints/crowdsource path with clear moderation language: user-submitted prices are not live until reviewed. Do not imply official regulator data unless linked. Validate that the methodology section explains price type, currency, unit, and date.
```

Prompt 19.5 - Energy business packaging:

```text
Add an API/widget/sponsor interest block for AfroFuel only after source states are visible. Link to existing business enquiry or widgets routes. Include sample use cases: logistics, generator budgeting, fare estimation, and procurement. Do not expose internal APIs or promise commercial data feeds before product readiness. Validate links and no unsupported claims.
```

## Slot 20 - AfroConflict Intelligence

Route: `/tools/africa-conflict/`

Research signal: ACLED is a near-real-time political violence and protest data source with export tools. UNHCR ODP covers displacement coordination data. ReliefWeb provides humanitarian data and layers. AfroConflict has dashboard, map, watchlist, events, and brief builder, but needs a clearer what-changed workflow and non-advisory source boundaries.

Prompt 20.1 - What-changed panel per country or region:

```text
Inspect tools/africa-conflict/index.html and related conflict data/runtime files. Add a "What changed" panel that updates when the user filters by country/region/risk. It should summarize changed risk, events, displacement, fatalities, spillover, and source date only from existing data. If no comparison baseline exists, label it "current snapshot" and do not imply trend. Validate filters update the panel and no overflow/console errors.
```

Prompt 20.2 - Source boundaries and non-advisory copy:

```text
Audit AfroConflict copy for safety and source boundaries. Add visible language that the tool is an information dashboard, not security advice, travel advice, or tactical guidance. Add source labels for ACLED-style event data, UNHCR displacement data, World Bank/economic data, and any static snapshot. Do not add live claims unless verified. Validate that every brief/export includes source and caveat.
```

Prompt 20.3 - Situation brief export:

```text
Upgrade the existing situation brief builder. Add audience presets: journalist, NGO analyst, business risk, student/researcher, diaspora family update. Add output lengths: SMS, one-page, detailed. Include copy/export to TXT/JSON and a "review before sharing" note. Do not create advice on routes, evasion, weapons, or tactical action. Validate each audience preset and copy action.
```

Prompt 20.4 - Map, events, and watchlist QA:

```text
Run a focused QA on AfroConflict map, watchlist, events feed, risk filters, African-only toggle, fatality-only toggle, search, and reset. Fix broken filters, empty states, focus behavior, and mobile layout only. Validate at 390px and desktop with three cases: Sudan, Sahel, and a no-result search.
```

Prompt 20.5 - Methodology and ethical design:

```text
Review /tools/africa-conflict/methodology/ and linked subroutes. Add a concise methodology card on the main route that explains data types, update cadence, limitations, and why AfroTools avoids sensational framing. Ensure language supports "understand risk without doomscrolling" without graphic or inflammatory copy. Validate links to methodology and subroutes.
```

## Execution Order Recommendation

1. Repair blockers first: Slot 18 AfroRates overflow/API fallback, Slot 19 AfroFuel overflow/API fallback, Slot 17 production deployment parity.
2. Upgrade high-ad routes next: Slot 9 CV Builder, Slot 14 Invoice Generator, Slot 11 Remittance, Slot 10 Cars.
3. Build workflow depth: Slot 12 Solar ROI, Slot 16 AfroKitchen, Slot 7 AfroPlan, Slot 15 AfroDraft.
4. Add trust and export depth to strategic surfaces: Slot 8 AfroStream, Slot 13 AfroPayroll OS, Slot 20 AfroConflict.

## Minimum Closeout For Each Prompt

Each implementation session should report:

- Files changed.
- Production evidence checked before work.
- Local evidence checked after work.
- Browser proof at 390px or narrower.
- Console and HTTP errors.
- Export/copy/save behavior tested.
- Source, privacy, accessibility, SEO, analytics, and unsupported-claim impact.
- Checks run and checks not run.
