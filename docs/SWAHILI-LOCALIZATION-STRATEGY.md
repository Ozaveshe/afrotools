# AfroTools Swahili Localization Strategy

## Purpose

This document is the operating system for AfroTools Swahili expansion.

The goal is not "translate all 2,594+ tools." The goal is to turn Swahili into a strong East African product surface with real acquisition value, strong local-language SEO, and a batch process that agents can actually finish.

## Current Operating Snapshot - May 15, 2026

Use this section as the current planning baseline. The May 9 audit and April snapshot below are preserved as historical checkpoints only.

Source artifacts read for this sync:

- `reports/sw-localization-audit.json`
- `reports/sw-registry-promotion-wave4.json`
- `reports/sw-registry-promotion-wave5.json`
- `reports/sw-registry-promotion-wave6.json`
- `reports/sw-browser-search-qa-wave6.json`
- `reports/non-swahili-hreflang-backlog-plan.md`
- source tree under `sw/`
- `assets/js/components/tool-registry.js`

Current route counts recomputed from the source tree:

- Swahili HTML routes under `/sw/`: `852`.
- Indexable Swahili routes: `850`.
- Noindex Swahili routes: `2`.
- HTML routes under `/sw/zana/`: `519`, made up of `465` direct `/sw/zana/<slug>/` tool routes plus `54` nested TIN guide routes under `/sw/zana/mwongozo-tin/`.
- Direct `/sw/zana/<slug>/` routes are all indexable in the current tree: `465/465`.

Current registry counts recomputed from `assets/js/components/tool-registry.js`:

- Unique Swahili registry hrefs: `620`.
- Resolving Swahili registry hrefs: `620/620`.
- Broken Swahili registry hrefs: `0`.
- Unique registry hrefs under `/sw/zana/`: `369`.
- Resolving `/sw/zana/` registry hrefs: `369/369`.
- Broken `/sw/zana/` registry hrefs: `0`.
- Direct one-level `/sw/zana/<slug>/` registry coverage: `315/465`, or `67.74%`.

Wave 4-6 registry history:

- The May 9 audit baseline of `6` Swahili registry entries is historical.
- The May 9 discovery repair raised Swahili registry rows to `352`.
- Wave 4 added `52` strong existing `/sw/zana/` routes.
- Wave 5 added `30` more screened `/sw/zana/` routes.
- Wave 6 accepted `7` construction/property routes, refused `150`, and left `40` pages in the explicit polish-before-promotion queue.
- Current planning should start from `620/620` resolving Swahili registry hrefs and `369/369` resolving `/sw/zana/` registry hrefs, not from the old 6-row baseline.

Search and browser QA status:

- `reports/sw-browser-search-qa-wave6.json` tested `/sw/`, `/sw/zana-zote/`, and `/sw/tools/` on desktop and mobile.
- The Wave 6 search QA has `42` query checks across `21` buckets.
- Missing expected result queries: `0`.
- English-only result queries: `0`.
- Duplicate href queries: `0`.
- Treat shared Swahili search as healthy at the Wave 6 checkpoint, but do not use that as proof that every refused page is promotion-ready.

Hreflang status:

- `reports/non-swahili-hreflang-backlog-plan.md` separated the prior validator backlog into non-Swahili work: `502` carried warnings and `0` warnings involving `/sw/`.
- May 15 rerun: `npm run build:i18n:validate` passed for `fr`, `sw`, `yo`, and `ha`.
- May 15 rerun: `npm run validate:hreflang` scanned `7,750` pages, checked `7,748` pages with hreflang tags, validated `19,665` pairs, and reported all checks passed with `0` errors and no warnings printed.
- Zero `/sw/` hreflang warning status is still true. Do not let French/global reciprocal cleanup distract the Swahili completion track unless a future validation run shows a real Swahili regression.

Current recommendation:

- Polish refused and high-potential pages before the next registry promotion.
- Prompts 62-69 should improve page quality by lane: construction/property, trade/logistics, transport/fleet, creator/video, cultural/religious, developer utilities, business/legal documents, and environment/energy.
- Wave 7 registry promotion should only choose from pages polished in those batches. Do not scan the whole remaining `/sw/zana/` tree looking for easy count gains.

## Conservative Legal And HR Glossary - May 16, 2026

Use this glossary for Swahili legal, HR, employment, business-registration, contractor, work-permit, severance, and document routes. The goal is practical Swahili, not legal certainty.

- `contractor`: use `mkandarasi`; explain as a person or business hired for a defined task, not a final legal classification.
- `employee`: use `mfanyakazi`; do not imply statutory status unless the source page itself supports it.
- `severance`: use `malipo ya kuachishwa kazi` or `kiinua mgongo` depending on the page; frame as an estimate or checklist, not an entitlement.
- `work permit`: use `kibali cha kazi`; describe costs, documents, and planning steps, not approval outcomes.
- `company secretary`: use `katibu wa kampuni`; keep the English term nearby on company-governance tools because users may see it on official forms.
- `registrar`: use `msajili`; tie it to the official company, court, or government registry where relevant.
- `filing`: use `uwasilishaji` or `kuwasilisha nyaraka`; mention that acceptance, deadlines, and penalties must be confirmed on the official portal.
- `service fee`: use `ada ya huduma`; do not present it as an official fee unless the paired source page supports that.
- `notary`: use `mthibitishaji wa nyaraka`; `commissioner for oaths` is `kamishna wa viapo`.
- `legal aid`: use `msaada wa kisheria`; describe eligibility checks as planning only, with the legal-aid office or court as the final decision maker.
- `board resolution`: use `azimio la bodi`; keep `board resolution/azimio la bodi` on first use where the document title matters.
- `affidavit`: use `kiapo`; keep `affidavit/kiapo` on first use for court and bank forms.
- `employment contract`: use `mkataba wa ajira`; present outputs as checklists or drafts, not enforceable legal advice.

Standard safety posture:

- Prefer `makadirio`, `rasimu`, `orodha ya ukaguzi`, `planning aid`, and `thibitisha na...`.
- Avoid `imeidhinishwa`, `hakika`, `lazima utapata`, `haki iliyohakikishwa`, `uamuzi wa kisheria`, and any promise of permit approval, registry acceptance, severance entitlement, or contractor classification.
- For HR and legal routes, registry descriptions must be conservative enough to stand alone in search results.

## Historical Audit Snapshot - May 9, 2026

Source-of-truth audit artifact: `reports/sw-localization-audit.json`.

This is a no-fix audit snapshot. It does not translate pages, rebuild generated output, touch French, or change the registry.

- English source HTML routes measured: `5,648` direct source routes, with `5,650` discovered by `scripts/build-i18n.js --dry-run`.
- Swahili HTML routes under `/sw/`: `852`, which is about `15.1%` raw route presence against English source volume.
- Swahili routes with an English source pair detected by the current `build-i18n.js` style mapping: `74`, about `1.3%` paired-route coverage.
- Swahili-only or currently unmapped `/sw/` routes: `778`.
- `lang/pages/**/sw.json` page packs: `0`; `lang/sw.json` passes global key parity but is not a page-level source layer.
- Historical Swahili registry entries at audit time: `6`, all financial/PAYE or comparison entries, which was only `0.7%` of `/sw/` route volume and `1.15%` of Swahili tool-page volume.
- Obvious English UI leakage heuristic: `138` Swahili pages, about `16.2%` of `/sw/` pages.
- Swahili pages with English internal links: `227`, about `26.6%` of `/sw/` pages. The biggest English destinations are `/tools/`, root `/`, `/agriculture/`, `/blog/`, `/developer-tools/`, and `/all-tools/`.
- `npm run build:i18n:validate` passes for `fr`, `sw`, `yo`, and `ha`.
- `npm run validate:hreflang` passes with `0` fatal errors but reports `1,298` non-bidirectional warnings across `7,637` scanned pages; roughly `68` warning lines are Swahili-related and the rest is mostly baseline French/other hreflang debt.

Route clusters at the May 9 audit point:

- Tool pages: `520`.
- Country subpages, mostly repeated calculator families: `208`.
- Country hubs: `54`.
- Category or static hubs: `40`.
- Agriculture cluster: `16`.
- Salary cluster: `9`.
- Core shell: `1`.
- Blog shell: `1`.
- Legacy redirect/noindex surfaces: `2`.
- Utility page: `1`.

Source ownership map at the May 9 audit point:

- Hand-authored source candidates: `sw/index.html`, `sw/zana-zote/index.html`, `sw/mshahara-na-kodi/index.html`, `sw/nchi/index.html`, plus many category/static hubs.
- Probable scripted or repeated outputs: country hubs and country subpages, especially repeated PAYE, VAT, employee-cost, severance, contractor-vs-employee, and work-permit families.
- Tool pages under `sw/zana/` are best treated as hand-authored or copied tool outputs until each source owner is verified.
- No Swahili page family is currently maintainable through `lang/pages/**/sw.json`.

## Historical Discovery Repair Snapshot - May 9, 2026

This pass repaired Swahili discovery without translating or rewriting page content.

Source-of-truth map for this repair:

- Route existence and usability: page-level HTML under `/sw/`; no route was added unless the matching `index.html` existed and was not marked `noindex`.
- Shared search and registry discovery: `assets/js/components/tool-registry.js`.
- Swahili all-tools search at that point: `sw/zana-zote/index.html`, which read the source registry so newly added Swahili discovery rows were visible before a future registry minification pass.
- Navbar search fallback at that point: `assets/js/components/navbar.js` and synced `assets/js/components/navbar.min.js`, which mapped English registry rows to verified Swahili routes while pages still loaded the older minified registry bundle.

Discovery counts after the repair:

- Swahili registry rows before: `6`.
- Swahili registry rows added from existing usable `/sw/` pages: `346`.
- Swahili registry rows after: `352`.
- Navbar English-to-Swahili fallback rows: `215`, covering verified paired routes with an English registry source row.
- Refused missing or not-ready prioritized routes: `0`.

Added discovery rows by cluster:

- Country hubs: `54`.
- Salary, PAYE, and HR: `68`.
- VAT and business: `160`.
- PDF and document: `35`.
- Agriculture: `28`.
- All-tools surface: `1`.

Routes not in those clusters were deliberately left out of registry discovery even when the file existed. They need their own source-ownership pass before being promoted into shared search.

Completion reading:

- Raw visible route presence is roughly `15%`.
- Durable paired route coverage is roughly `1%`.
- Registry-backed discovery is below `1%` of `/sw/` route volume.
- Product completion should be described as "partially present but not durable yet," not as a finished localized website.

## Why This Matters

Swahili is a real product and search opportunity for AfroTools:

- East Africa has a large and underserved local-language finance audience.
- Salary, PAYE, VAT, remittance, invoice, and mobile-money tools match strong practical search intent.
- Swahili works best when it feels native, modern, and useful, not like a classroom translation.
- If AfroTools becomes the default Kiswahili finance-tool surface, the SEO upside compounds while paid acquisition stays low.

Treat Swahili as a product line, not a localization checkbox.

## Historical Repo Reality Snapshot - April 15, 2026

The April numbers below are retained for historical context. Use the May 15, 2026 current operating snapshot above for current planning.

At that time, the Swahili surface was much larger than its maintenance layer:

- `189` Swahili HTML pages exist under `/sw/`.
- `0` page-specific Swahili translation packs exist under `lang/pages/**/sw.json`.
- Only `6` Swahili registry entries exist in `assets/js/components/tool-registry.js`.
- The Swahili surface currently includes roughly:
  - `54` country PAYE pages
  - `60` country hubs
  - `32` tool pages under `/sw/zana/**`
  - `16` agriculture pages
  - `9` salary cluster pages
- `npm run validate:hreflang` reported `124` errors and `1,440` warnings across the repo, including Swahili-specific broken mappings and many non-bidirectional language pairs.
- `scripts/build-i18n.js` supports `sw` and maps existing `/sw/` pages for hreflang and sitemap use.
- The same build script includes French-specific polish layers such as French PAYE fallbacks and French share-text overrides, but no equivalent Swahili polish layer.

This mixed model is the main reason Swahili work feels messy:

- the visible surface is large
- the source of truth is inconsistent
- the registry does not represent the real Swahili surface
- the build system can recognize Swahili, but it cannot yet polish Swahili the way it polishes French

## Strategic Thesis

AfroTools should win Swahili by doing four things in order:

1. Stabilize the architecture.
2. Polish the app shell and acquisition entry points.
3. Own the East Africa salary and PAYE wedge.
4. Expand into adjacent business-intent tools only after the core is clean.

Swahili should not start as "all of Africa in Kiswahili." It should start as "the best Swahili finance and work-tool experience for East Africa."

After the May 15 source-tree sync, the next direction is still repair-first but no longer registry-count-first:

1. Keep existing Swahili pages source-owned and route-honest before adding large new translation batches.
2. Polish refused and high-potential pages from Wave 6 before exposing more routes in shared search.
3. Add registry entries only for Swahili pages that are user-ready, indexable, paired or intentionally standalone, and safe to surface in shared search.
4. Keep direct `/sw/zana/` coverage quality-screened; `315/465` direct routes are currently registry-covered, so the remaining work is page quality and fit, not blind promotion.
5. Preserve the zero `/sw/` hreflang-warning state and keep French/global reciprocal warnings in their own backlog lane.

## Non-Negotiables

- Swahili must be treated as a product surface, not a string dump.
- High-value Swahili pages must read like native digital-product Kiswahili.
- Do not over-translate widely recognized finance terms if users actually search the English acronym.
- Use modern, practical Kiswahili and keep familiar terms such as `PAYE`, `VAT`, `PDF`, `NSSF`, `SHIF`, and `PAYE` where search behavior or product clarity makes that the better choice.
- Choose the source of truth before editing:
  - hand-authored `/sw/` page
  - `lang/pages/**/sw.json`
  - registry
  - generated output
- Do not mix generation strategy and manual page rewrites in the same batch unless the batch explicitly calls for both.
- Do not add a Swahili registry entry until the page is actually ship-ready.
- Keep batches small enough that Claude or Codex can finish without drifting.

## Immediate Risks To Fix Before Scaling Harder

### 1. Registry quality now matters more than raw registry count

The repo now has `620` unique Swahili registry hrefs, all resolving, and `369/369` resolving registry hrefs under `/sw/zana/`.

That means:

- the old `6`-entry registry baseline is historical, not current
- direct `/sw/zana/<slug>/` registry coverage is `315/465` or `67.74%`
- the next risk is exposing pages whose visible copy is still too English-heavy
- the registry should grow only from polished, user-ready pages

### 2. Swahili pages have almost no reusable source layer

There are currently `0` `lang/pages/**/sw.json` files.

That means the Swahili surface is hard to regenerate, hard to batch safely, and hard to keep consistent across repeated agent runs.

### 3. Hreflang is currently clean for Swahili, but global backlog remains

The current backlog plan reports `502` carried hreflang warnings and `0` involving `/sw/`.

Current operating rules:

- keep Swahili at `0` warnings
- treat non-Swahili warnings as carried French/global debt
- rerun `npm run validate:hreflang` when route assumptions or reciprocal tags change
- do not broaden a Swahili quality batch into unrelated French/global reciprocal cleanup

### 4. The build pipeline is Swahili-aware but not Swahili-polished

The i18n system can build and map Swahili, but the baked-in polish helpers are still French-specific.

That means high-value Swahili pages should not rely on naive build output alone.

### 5. Scope is too wide for good local-language quality

The current `/sw/` surface already stretches across:

- East Africa money tools
- agriculture
- work documents
- AI tools
- broad country coverage

This is too much to perfect at once.

## What To Prioritize First

### Priority 1: App shell and front-facing Swahili entry points

These pages define whether Swahili feels like a real product:

- `sw/index.html`
- `sw/zana-zote/index.html`
- `sw/mshahara-na-kodi/index.html`
- `sw/nchi/index.html`
- shared search, autocomplete, nav, footer, empty states, share text, PDF flows, and result labels

If the shell is mixed or inconsistent, the rest of the rollout will feel fake.

### Priority 2: East Africa salary and PAYE cluster

This is the strongest Swahili wedge.

Start with:

- Kenya
- Tanzania
- Uganda
- Rwanda
- Burundi

For each market, aim to complete:

- country hub
- PAYE page
- category routing from Swahili salary hub
- internal links back to Swahili entry points

### Priority 3: Adjacent high-intent business tools

Only after the salary cluster is stable:

- VAT calculator
- invoice generator
- currency converter
- remittance comparison
- mobile-money fee comparison

Choose tools with clear East African search intent before broader generic tools.

### Priority 4: Supporting content

After the shell and core tools are solid:

- one Swahili comparison page
- one country-specific explainer
- one FAQ-led page for salary or tax understanding

Supporting content should reinforce the cluster, not replace it.

## Markets By Wave

### Wave 0: Architecture and SEO stabilization

- Decide source-of-truth ownership for `/sw/`
- fix the most visible hreflang and route mismatches on Swahili core pages
- define Swahili slug conventions
- stop adding new Swahili surfaces until the ownership model is clear

### Wave 1: Core Swahili product shell

- homepage
- all-tools page
- salary/PAYE hub
- countries hub
- shared UI copy and states

### Wave 2: East Africa salary/PAYE wedge

- Kenya
- Tanzania
- Uganda
- Rwanda
- Burundi

Why:

- strongest Swahili-language fit
- strongest salary-intent overlap
- easiest place to build repeatable terminology rules

### Wave 3: East Africa business-intent expansion

- currency converter
- invoice generator
- VAT calculator
- remittance comparison
- mobile-money fees

### Wave 4: Secondary expansion

- Eastern DRC where Swahili fit is strategically relevant
- selected agriculture or work-document surfaces only if they support the East Africa thesis
- only after the core money surfaces are clean

## Source-Of-Truth Strategy

Swahili needs explicit ownership by surface.

### Use hand-authored `/sw/` pages for:

- front-facing acquisition pages
- homepage and category hubs
- strategic pages with heavy SEO rewriting
- shell pages where layout and copy both matter

### Use `lang/pages/**/sw.json` for:

- repeatable calculator families
- pages where English HTML structure is already strong
- pages likely to be regenerated often

### Use registry updates for:

- discoverability after a page is complete
- Swahili search prioritization
- routing and card coverage

### Avoid:

- generating a page and then hand-polishing the output repeatedly without documenting the true source
- assuming `lang/sw.json` alone is enough for page-level quality
- creating pages that exist only in `/sw/` without a clear English source or explicit manual ownership

## Batch Design Rules

To avoid agent stalls and half-finished Swahili waves, keep batches narrow.

### Safe batch sizes

- `1` shell page plus `2-4` linked tool pages
- or `1` country hub plus `1-2` calculators plus `1` QA pass
- or `1` tool family plus metadata, schema, and link QA

### Avoid

- "translate all Swahili pages"
- mixing salary, agriculture, AI tools, and blog work in one pass
- adding registry, hreflang, UI rewrite, and tool-copy rewrites for dozens of pages at once

## Swahili Country-Hub Salary Rollout Pattern

Use this pattern before adding more `/sw/<country>/index.html` salary discovery work. The goal is to stop reinventing the same hub pass every batch.

### Pattern types

There are two valid country-hub rollout modes.

#### 1. Strong salary-entry hub

Use strong treatment when the country is a real salary-intent entry market and at least one of the following is true:

- a live Swahili local PAYE route already exists and is good enough to feature first
- the market is a regional anchor with high salary/payroll search value
- there are already localized Sw salary tools that make the country page feel like a real salary hub, not just a bridge
- the country helps a comparison cluster that users actually browse across

Canonical examples:

- `sw/kenya/index.html`
- `sw/tanzania/index.html`
- `sw/nigeria/index.html`
- `sw/south-africa/index.html`
- `sw/morocco/index.html`
- `sw/ethiopia/index.html`
- `sw/zambia/index.html`

#### 2. Lighter bridge hub

Use bridge treatment when the country needs salary/pay orientation, but the surrounding localized salary depth is still thin.

Use bridge treatment when:

- the local Sw PAYE page exists, but adjacent localized salary depth is limited
- the best user experience is still to route people into `sw/mshahara-na-kodi/index.html` and `sw/tools/index.html`
- the market matters, but it is not yet ready to act like a full salary-entry hub

Canonical examples:

- `sw/mozambique/index.html`
- `sw/malawi/index.html`

### Standard section order

For a Sw salary-first country hub, keep the section order stable unless the page has a structural reason not to.

1. Hero with salary-first support copy
2. Local tax or payroll summary cards already native to the country page
3. Any existing local tax, PAYE, VAT, or social-security tables already on the page
4. Divider
5. `Mishahara Kwanza` section for strong hubs, or `Njia ya Mishahara` for lighter bridge hubs
6. Existing tools section relabeled to `Zana za Mishahara na Ajira`
7. Back-links to Sw entry points, paired English page, and optional nearby comparison markets

Do not move the whole page into a new template just to follow this order. Fit the pattern into the current shell.

### Hero and support-copy rules

The hero should stop sounding like a generic finance directory and start sounding like a salary-entry surface.

Rules:

- keep the country name and core tax identity in the title
- make the support copy salary-first, not broad-finance-first
- lead with the local salary problem the user is trying to solve:
  - PAYE
  - social-security deductions
  - overtime
  - leave
  - salary comparison
  - retirement or housing-fund planning
- keep acronyms users actually search, such as `PAYE`, `VAT`, `NSSF`, `UIF`, `CNSS`, `SSNIT`, `NAPSA`, `USD/US$`
- use the outline CTA as the bridge back to `sw/mshahara-na-kodi/` when the page is in the salary rollout lane

### `Mishahara Kwanza` section rules

This section is the repeatable discovery block for Sw salary hubs.

For strong salary-entry hubs:

- use the label `Mishahara Kwanza`
- include `4` featured cards when space allows
- local Sw PAYE should be the first card if it is live and user-ready
- end with a bridge sentence linking to `sw/mshahara-na-kodi/index.html`
- where helpful, link to nearby comparison markets such as Kenya, Tanzania, Uganda, Ghana, Nigeria, or South Africa

For lighter bridge hubs:

- use `Njia ya Mishahara` if the page is more of a bridge than a full salary hub
- include `3` cards in most cases
- local Sw PAYE still goes first if it exists and is good enough
- the second and third cards should usually be:
  - `sw/mshahara-na-kodi/index.html`
  - `sw/tools/index.html`
- use one adjacent localized salary tool only if it adds real value without making the hub feel falsely deep

### Link priority inside the salary cluster

When choosing which localized Sw salary/pay tools to feature first, use this priority order unless the market has a strong country-specific reason to vary it:

1. local Sw PAYE route
2. `sw/zana/kikokotoo-michango-ya-hifadhi-ya-jamii/index.html`
3. `sw/zana/kikokotoo-kima-cha-chini-cha-mshahara/index.html`
4. `sw/zana/kikokotoo-muda-wa-ziada/index.html`
5. `sw/zana/kikokotoo-likizo/index.html`
6. `sw/zana/kilinganisha-mishahara/index.html`
7. `sw/zana/mpango-wa-kustaafu-mapema/index.html`
8. `sw/zana/kikokotoo-mfuko-wa-nyumba/index.html`

Use the earliest tools in the list that are already localized and actually useful for that market.

### When to feature local PAYE vs broader salary-cluster links

Feature local PAYE first when:

- the Sw route is live
- the page is not just an English fallback wrapper
- the route is already used as a real local calculator entry point

Do not make local PAYE the lead card when:

- the Sw route is weak, stale, or still mostly a fallback shell
- the country page would over-promise salary depth that does not yet exist

In those cases:

- point the outline CTA to `sw/mshahara-na-kodi/index.html`
- make the discovery section bridge into the broader salary cluster
- keep `sw/tools/index.html` as the secondary discovery target

### Reciprocal hreflang rule for paired English hubs

If a Sw country hub is touched as part of a salary-first hub rollout and the paired English hub is in scope, add or verify:

- `hreflang="sw"` on the paired English hub
- existing `hreflang="en"` and `x-default` stay intact unless clearly wrong

Do not broaden that into a repo-wide hreflang cleanup during the same batch.

### Validation checklist for country-hub salary passes

For a real country-hub salary surfacing batch, run:

- `npm run check-links`
- `npm run audit`
- `npm run build:i18n:validate`
- `npm run validate:hreflang`
- `npm run seo:report`

When summarizing results, separate:

- baseline repo debt
- net-new issues caused by the batch

Use this rule:

- if the touched Sw hubs and paired English hubs do not appear directly in the failure output, treat the remaining failures as baseline debt
- if the only remaining nearby warnings are older one-way references from untouched French pages into the paired English hubs, treat those as baseline debt
- only call an issue net-new if the touched pages themselves appear in the failing output after the batch

### Recommended execution clusters for remaining Sw country hubs

After the current Kenya/Tanzania/Uganda/Rwanda/Burundi, Nigeria/South Africa/Ghana/Egypt, and Morocco/Ethiopia/Zambia/Mozambique/Malawi passes, use this rollout order next:

1. Southern follow-on cluster:
   - Botswana
   - Namibia
   - Lesotho
2. Francophone and Central salary-discovery cluster:
   - Cameroon
   - Cote d'Ivoire
   - Senegal
3. North Africa follow-on cleanup:
   - Libya
   - Tunisia
   - Algeria only if the salary-entry case is clear

Why this order:

- the southern cluster extends the Zambia, Malawi, Mozambique, and South Africa salary graph cleanly
- the Francophone and Central cluster is valuable, but should ride on a more mature Sw salary-hub process
- the North Africa follow-on batch should happen after the current Morocco pattern is proven stable in multiple adjacent markets


### Construction, Engineering, CAD, and Built Environment Pattern

Use `/sw/ujenzi-na-uhandisi/` as the durable Swahili hub for construction, engineering, CAD, floor planning, BOQ, quantities, structural checks, electrical load, concrete, paint, tiles, roofing, water tanks, boreholes, rebar, generator sizing, septic tanks, fencing, pool cost, and architectural fees.

Group the hub in this order: CAD, drawings and floor planning; building cost, BOQ, quantities and architectural fees; structural, rebar, concrete and electrical load; paint, tiles, roofing, fencing and finishes; water tanks, boreholes, septic tanks, pools and site services; generator sizing and links to energy/solar tools; then cross-links to property, permits, PDF/export tools, SME budgeting, VAT/TIN, and developer/design surfaces.

Retain useful terms when they match real forms, drawings or search behavior: CAD, AfroDraft, floor planner, BOQ, Bill of Quantities, structural, load, kW, kVA, rebar, nondo, concrete, cement, aggregate, roofing, borehole, septic tank, generator, architectural fee, PDF, DXF, SVG, PNG and export. Explain them in natural Kiswahili around the retained term.

`/sw/nyumba-na-ardhi/` remains the property, land, permit and renovation surface. `/sw/nishati-na-huduma/` remains the energy, solar, utility, generator-fuel and battery surface. Construction pages should link to those surfaces instead of duplicating solar calculators, home-renovation pages, building-permit pages, land/title pages or utility tools.

Never overclaim professional certification, engineering approval, code compliance, planning approval, structural safety, permit acceptance, exact market prices, supplier availability, contractor quotes, generator sizing accuracy or export fidelity. Structural and electrical pages must clearly say they are planning aids and not substitutes for licensed engineers, electricians, architects, quantity surveyors or local authorities.

## Swahili SEO Playbook

### 1. Build clusters, not isolated pages

The strongest pattern is:

- Swahili homepage or category hub
- country hub
- PAYE page
- adjacent finance tool
- supporting explainer or comparison page

### 2. Write for how East African users actually search

Use a mix of Kiswahili and established financial shorthand, such as:

- `kikokotoo cha kodi ya mshahara`
- `PAYE Kenya`
- `PAYE Tanzania`
- `mshahara halisi`
- `mshahara baada ya kodi`
- `makato ya mshahara`
- `VAT calculator`
- `kibadilishaji cha sarafu`
- `ada za kutuma pesa`

Do not force purely literal terms when mixed-language search intent is stronger.

### 3. Standardize register, not every noun

Be consistent in:

- tone
- verb choices
- CTA structure
- result labels
- headings

But allow country-specific institutions and familiar acronyms to stay native to user behavior.

### 4. Make the app itself Swahili

SEO gains are weakened if the page title is in Swahili but the rest of the app is still half-English.

That includes:

- search states
- validation errors
- result cards
- share text
- PDF flows
- schema and FAQ copy
- toast messages

### 5. Only index what is truly ready

Because direct `/sw/zana/` registry coverage is still incomplete and quality-screened, do not push unfinished pages into the discovery layer just to increase counts.

## Definition Of Done For A Swahili Tool

A Swahili tool page is done only when all of the following are true:

- the copy reads like native digital-product Kiswahili
- the calculator logic is unchanged and correct
- the visible UI is Swahili
- result labels and share/PDF flows are Swahili or intentionally bilingual where search behavior requires it
- metadata and OG copy are Swahili
- FAQ and schema are Swahili
- canonical is self-referential
- hreflang is correct and bidirectional where appropriate
- the page appears exactly once in the registry if it is meant to be discoverable
- the page is linked from the correct Swahili hub

## Prompt Design Rules For Claude

### General rules

- Always define the exact file scope.
- Always require source-of-truth identification first.
- Always say whether the batch is hand-authored, generated, or mixed.
- Always forbid scope expansion.
- Always require a validation summary.
- Always require removal of leftover English UI.
- Always require terminology consistency notes.

### Reusable prompt: Swahili batch planner

```text
You are coordinating a Swahili localization batch for AfroTools.

Goal:
- Improve Swahili product quality and Swahili SEO.
- Do not translate mechanically.
- Do not expand scope beyond the listed files.

Before editing:
1. Identify the source of truth for each target:
   - hand-authored /sw/ page
   - lang/pages/**/sw.json
   - registry
   - generated output
2. Flag any conflicts before touching files.
3. Keep the batch small enough to finish cleanly.

Batch scope:
- [LIST FILES HERE]

Required outputs:
1. Short source-of-truth assessment per file.
2. Exact edits made.
3. Any SEO, hreflang, registry, or terminology risks discovered.
4. Validation run and result summary.

Constraints:
- Rewrite for natural East African Kiswahili.
- Preserve calculator logic.
- Keep app UI fully Swahili unless a finance acronym is intentionally retained.
- Do not create duplicate registry entries.
- Do not touch unrelated files.
```

### Reusable prompt: Swahili tool rewrite

```text
Rewrite this AfroTools calculator page for native Swahili-speaking users in East Africa.

Do not do a literal translation.
Write as a strong localized financial product page.

You must:
- preserve the calculation logic
- improve the Swahili title, meta description, hero copy, labels, FAQs, and schema
- use natural digital-product Kiswahili
- keep familiar finance acronyms where users expect them
- make the UI feel like it was written by a local product team

You must not:
- invent tax rules
- add unsupported features
- leave English UI fragments behind
- change scope outside the listed files

Files:
- [LIST FILES HERE]

Validation required:
- confirm canonical and hreflang state
- confirm any registry edits
- report anything still English after the pass
- note any term choices that were intentionally left bilingual
```

### Reusable prompt: Swahili app shell polish

```text
Improve this Swahili front-facing AfroTools page so it works as a real acquisition and navigation page, not just a translated shell.

Focus on:
- stronger Swahili headline and intro
- clearer hierarchy
- honest tool counts
- stronger CTAs
- natural search and navigation wording
- consistency across nav, empty states, buttons, result labels, and helper copy

Do not:
- claim coverage that does not exist
- use stiff classroom Kiswahili
- leave mixed English states behind
- touch unrelated files

Files:
- [LIST FILES HERE]
```

### Reusable prompt: Swahili SEO QA reviewer

```text
Review this Swahili batch like a strict localization and SEO editor.

Check:
- natural Kiswahili phrasing
- consistency of terminology
- title and meta quality
- canonical correctness
- hreflang correctness
- internal links to Swahili surfaces
- schema language
- duplicate registry rows
- leftover English text
- places where English acronyms should stay versus be explained

Return:
1. Critical issues
2. Medium issues
3. Nice-to-have improvements

Do not rewrite files unless asked.
```

### Reusable prompt: Swahili terminology governor

```text
You are the terminology governor for an AfroTools Swahili batch.

Build or refine a mini glossary for this batch before rewriting.

For each important term, choose one of:
- translate fully into Kiswahili
- keep the English acronym or English term
- use bilingual treatment on first mention, then shorter follow-up wording

Focus on:
- PAYE
- VAT
- gross salary
- net salary
- deductions
- taxable income
- invoice
- remittance
- exchange rate
- PDF

Return:
1. Approved term list
2. Terms to avoid
3. Any country-specific terminology notes

Do not edit files in this step unless asked.
```

## Business and Compliance Pattern

For Swahili business/compliance expansion, treat VAT, invoices, TIN, business registration, break-even, and profit margin as one practical path instead of isolated translated tools.

- Start with task intent: price with VAT, issue an invoice, confirm TIN, register the business, then test break-even and margin.
- Keep official acronyms when they help search or filing clarity, but explain them naturally on first mention.
- Use repo source data and existing calculator behavior; do not add legal or tax rules that are not present in the source.
- Link business pages back to salary/PAYE when payroll, employer tax, or staff costs become relevant.
- Prefer hand-authored Swahili product pages and persistent hub links over registry-dependent discovery for priority compliance paths.

### All-Country TIN Coverage

When Swahili TIN coverage is expanded to all African countries, keep it as a compliance discovery surface rather than a generic legal directory.

- Use `data/legal/tin-guide-data.js` as the source of truth for country facts.
- Keep country pages hand-authored in Swahili, but do not invent requirements beyond the source data.
- Group the TIN hub by region so users can scan all 54 countries quickly.
- Link TIN pages to VAT, invoice, business registration, and salary/PAYE where those workflows naturally meet.
- Add reciprocal Swahili hreflang only on the paired English TIN pages in the batch.

### All-Country VAT Coverage

When Swahili VAT coverage is expanded to all African countries, keep each country page paired to the existing English country VAT page and treat that English page as the only source of VAT rates, thresholds, exemptions, scripts, FAQs, and disclaimer posture.

- Create hand-authored Swahili product pages at `/sw/<country>/kikokotoo-vat/` with self canonicals and paired `sw/en/x-default` hreflang.
- Preserve calculator behavior from the English page: add VAT, remove VAT, custom rate, invoice-style totals, charts, share/PDF language, and estimate disclaimers.
- Do not invent VAT rates, thresholds, dates, exemptions, penalties, or official guidance; if source data is sparse, tell users to verify with the tax authority or a qualified professional.
- Surface local VAT as business/compliance support on country hubs while keeping salary/PAYE sections intact.
- Link VAT pages to invoice, TIN, business registration, and salary/PAYE when payroll context matters; add reciprocal Swahili hreflang only on the paired English VAT pages.


### Fintech and Money Movement Pattern

For Swahili fintech expansion, treat currency conversion, remittance comparison, mobile-money fees, POS, merchant fees, marketplace fees, forex profit, and import FX impact as one practical money-movement path.

- Use existing English fintech and payment-fee pages as the source of calculator behavior, provider names, modeled assumptions, scripts, and disclaimer posture.
- Keep live-rate language cautious: use makadirio, ulinganisho, snapshot, spread, and verify-with-provider wording instead of promising final quotes.
- Preserve provider names such as M-Pesa, MTN MoMo, Airtel Money, Orange Money, Wise, Remitly, WorldRemit, Western Union, LemFi, Sendwave, Jumia, Konga, Takealot, Kilimall, and Jiji.
- Surface the cluster manually from Swahili fintech, business, VAT, tools, country, and priority country hubs without registry rows.
- Cross-link money-movement pages back to VAT, invoices, TIN, and salary/PAYE when pricing, compliance, or payroll context matters.


### Fintech Savings, Credit, and Community Finance Pattern

For the second Swahili fintech layer, extend `/sw/fintech/` beyond money movement into savings products, household planning, credit comparison, mtaji wa biashara, and rotating savings groups.

- Keep retained terms when they match real search and user vocabulary: `SACCO`, `Ajo`, `Esusu`, `Chama`, `Stokvel`, `Tontine`, `Susu`, `APR`, `T-bill`, `MMF`, `microfinance`, and `fintech`.
- Explain retained terms in Kiswahili on first use instead of leaving English or regional labels floating without context.
- Order `/sw/fintech/` as: Sarafu/FX na uhamisho, Malipo ya biashara, Akiba na mapato, Mikopo na microfinance, SACCO/chama/vikundi vya akiba, kisha Mtaji wa biashara na ada za benki.
- Rotating-savings pages should respect local names and user intent. Do not flatten Chama, Ajo, Esusu, Stokvel, Tontine, and Susu into one generic term when the local term helps trust and search.
- Use paired English tool pages for formulas, inputs, scripts, provider assumptions, and disclaimer posture. Do not invent rates, provider rules, or legal requirements.



### Agriculture and Smallholder Business Pattern

Use `/sw/kilimo/` as the durable Swahili hub for top-level agriculture, farm planning, smallholder finance, and agri-business. Group the hub in this order: planting season planning, seed/fertilizer/irrigation, yield/harvest/farm profit, loans/payroll/farm finance, poultry/livestock/fish/greenhouse, cassava processing/export docs, then crop insurance plus business/VAT/salary links.

Retain agriculture and trade terms only when they help search or clarity: NPK, ROI, SACCO, greenhouse, cassava, AfCFTA, HS code, export docs, and subsidy. Explain each retained term in Swahili context on first use.

Do not overclaim yields, live input prices, subsidy access, loan approval, harvest dates, export clearance, insurance coverage, or agronomic accuracy. Use paired English agriculture pages for supported coverage, scripts, assumptions, formulas, and disclaimer posture. Country-specific agriculture subroutes should remain out of scope unless explicitly batched.

### Property, Housing, and Land Pattern

Use `/sw/nyumba-na-ardhi/` as the durable Swahili hub for property planning. Group pages in this order: buying and mortgage, renting and tenancy, land title and registry, taxes and transfer costs, investment and diaspora, construction and permits, then cross-links to insurance, fintech loans, salary/PAYE, VAT, and business compliance.

Retain search-useful terms only where they help users match market language: mortgage, ROI, CGT, diaspora, off-plan, title deed, conveyancing, service charge, short-let, and Airbnb. Explain each term in Swahili context on first use instead of leaving it as an unexplained English label.

Never overclaim property prices, legal title safety, valuation accuracy, tax treatment, building approval, tenancy enforceability, or lending approval. Property pages should remain estimate and planning tools that point users toward official registries, qualified lawyers, valuers, banks, surveyors, quantity surveyors, and local authorities.

### Insurance and Protection Pattern

For Swahili insurance expansion, treat household protection, health cover, vehicle insurance, business risk, farm risk, travel risk, and employer compensation as one practical risk-planning surface under `/sw/bima/`.

- Recommended `/sw/bima/` order: bima ya kaya na familia, bima ya afya na michango ya afya, bima ya gari na safari, bima ya biashara na dhima, bima ya kilimo na mazao, then fidia na ulinzi wa wafanyakazi.
- Retain search-useful terms when they match real market usage: `NHIF`, `SHIF`, `NHIS`, `HMO`, `medical aid`, `WIBA`, `COIDA`, `third-party`, `comprehensive`, `public liability`, and `professional indemnity`.
- Explain retained terms in Kiswahili on first use instead of leaving them as unexplained English labels.
- Use paired English insurance pages as the source of country coverage, scripts, assumptions, formulas, and disclaimer posture. Do not invent premiums, provider rules, legal requirements, country coverage, or live quote accuracy.
- If the English page covers 15 countries, the Swahili page must say 15. If it covers 54 countries, the Swahili page can say 54. Engine-backed single-page calculators should not claim country-level pages that were not created.


### Career, Jobs, CV, and Workplace Documents Pattern

Use `/sw/kazi-na-ajira/` as the durable Swahili hub for careers, job applications, CVs, offers, salary negotiation, freelancing, side hustles, workplace documents, payslips, and working-day planning. Group the hub in this order: CV/barua ya ombi/profile ya kazi, interview/offer/salary negotiation, career growth/switching/retirement, freelance/side hustle/pricing, contracts/payslip/working days, teacher/domestic-worker salary, then links to education, PAYE, insurance, and fintech.

Retain career terms only when they match how users search or read workplace documents: `CV`, `resume`, `LinkedIn`, `personal brand`, `freelance`, `side hustle`, `payslip`, `offer`, `negotiation`, `interview`, and `teacher scale`. Explain each term in Swahili context rather than leaving English labels unsupported.

`jobs/index.html` is a redirect shell and should not be paired or edited during this lane. Pair `career/index.html` to `/sw/kazi-na-ajira/`, polish existing Sw CV and cover-letter pages in place, and link existing salary comparison, leave, workers-comp, salary/PAYE, and education routes instead of duplicating them.

Never overclaim job outcomes, legal enforceability, salary levels, promotion timelines, freelance market rates, retirement outcomes, payslip legality, or contract validity. Use paired English career pages for source behavior, scripts, inputs, assumptions, and disclaimer posture, and keep Swahili pages as planning aids that point users to employers, HR, official portals, lawyers, accountants, and qualified advisors.

## Recommended Execution Order

### Phase 0: Stabilize

- choose Swahili URL and ownership conventions
- fix the highest-signal hreflang issues on Swahili core pages
- decide which pages stay hand-authored versus generated

### Phase 1: Swahili product shell

- `sw/index.html`
- `sw/zana-zote/index.html`
- `sw/mshahara-na-kodi/index.html`
- `sw/nchi/index.html`
- shared search, nav, footer, result-state, share, and PDF copy

### Phase 2: East Africa salary/PAYE wave

- Kenya
- Tanzania
- Uganda
- Rwanda
- Burundi

### Phase 3: Adjacent tools

- VAT
- invoices
- remittance
- mobile money
- currency conversion

### Phase 4: Supporting content and expansion

- comparison pages
- explainers
- selected secondary markets

## What Not To Do

- Do not translate the whole `/sw/` tree at once.
- Do not assume existing `/sw/` pages are all high quality just because they exist.
- Do not rely on `lang/sw.json` alone for high-value page quality.
- Do not add more Swahili registry entries than you can actually QA.
- Do not expand into many categories before the shell and salary/PAYE wedge are solid.
- Do not borrow French wording directly; only borrow the process discipline.

## Recommended Metrics

Track Swahili progress with simple operational numbers:

- Swahili pages with documented source of truth
- Swahili registry hrefs that map to real finished pages
- Swahili core pages with clean hreflang
- East Africa salary clusters completed
- Swahili pages with no leftover English UI
- Swahili pages linked from Swahili hubs

## Default Working Principle

Swahili should expand like a product line:

- architecture first
- app shell second
- East Africa salary/PAYE third
- adjacent money tools fourth
- supporting content fifth

If there is a tradeoff, choose fewer but better Swahili pages with cleaner SEO, better copy, and clearer ownership.

### Trade, Customs, Shipping, and Trade Finance Pattern

Use `/sw/biashara-ya-nje/` as the durable Swahili hub for import, export, customs, shipping, and trade finance. Group the hub in this order: ushuru/forodha/gharama iliyofika, HS codes/AfCFTA/cheti cha asili, export/import documents, shipping/weight/demurrage, LC/trade finance/international payments, mini-importation, then links to FX, VAT, TIN, kilimo, and broader business compliance.

Retain trade terms only when they match how users search or read trade documents: `AfCFTA`, `HS code`, `Incoterms`, `CIF`, `FOB`, `LC`, `T/T`, `CAD`, `SBLC`, `Bill of Lading`, `demurrage`, and `landed cost`. Explain each term in Swahili context on first use instead of leaving it as unexplained English.

Never overclaim customs rates, HS classification, AfCFTA eligibility, bank fees, port charges, shipping timelines, clearance requirements, or legal enforceability. Use paired English trade pages for source behavior, scripts, assumptions, supported coverage, and disclaimer posture. Do not duplicate agriculture export-docs or vehicle/car import surfaces unless a future batch explicitly resolves the product-truth pairing.


### Transport, Vehicles, Fuel, and Logistics Pattern

Use `/sw/usafiri-na-magari/` as the durable Swahili hub for transport, vehicles, fuel, routes, urban mobility, delivery, fleet, and logistics. Group the hub in this order: importing a vehicle and customs costs, car loans and ownership cost, fuel/toll/trip cost, ride-hailing and urban fares, Boda Boda/Okada/Matatu/Danfo/Trotro, delivery/fleet/logistics, then registration/roadworthiness/insurance/tracker.

Retain transport terms only when they match how users search or read provider documents: `ride-hailing`, `Boda Boda`, `Okada`, `Matatu`, `Danfo`, `Trotro`, `fleet`, `last-mile`, `toll`, `roadworthiness`, `tracker`, `CIF`, and `landed cost`. Explain each term in Swahili context on first use instead of leaving it as an unexplained English label.

Never overclaim live fuel prices, fares, tolls, import costs, customs duty, registration outcomes, roadworthiness status, insurance status, tracker savings, delivery quotes, or fleet savings. Use paired English transport pages for behavior, assumptions, supported coverage, scripts, and disclaimer posture. Do not localize the car-price directory under `cars/index.html` until a separate product-truth review scopes that surface.


### Health, Family Health, and Care-Cost Pattern

Use `/sw/afya/` as the durable Swahili hub for health, family health, risk checks, and care-cost planning. Group the hub in this order: body measurements and nutrition, blood pressure/diabetes/risk checks, malaria/water/environmental safety, fertility/pregnancy/child growth, vaccines/genotype/family health, dosage/lab reports/hospital costs, then health insurance and family protection.

Retain medical terms only when they match user search or clinical documents: `BMI`, `BP`, `genotype`, `AA`, `AS`, `SS`, `malaria`, `diabetes`, `ovulation`, `vaccine`, `dosage`, and `lab report`. Explain each in Swahili context on first use and keep the tone calm, practical, and non-alarming.

Every risk, dosage, medical-report, pregnancy, vaccine, child-growth, and water-safety page must say it is informational and not a substitute for a clinician, emergency care, pharmacist, lab, ministry guidance, or local public-health authority. Do not invent medical guidance, thresholds, diagnoses, vaccine schedules, treatment advice, or dosing rules. Use paired English pages for source behavior, assumptions, scripts, and disclaimer posture.

For duplicate English routes, prefer the `health/` source when it is the stronger health surface: `health/bmi-calculator/`, `health/calorie-counter/`, and `health/pregnancy-due-date/`. Do not add Swahili hreflang to duplicate `tools/` routes unless that exact route is intentionally paired in a future batch.

### Education, Exams, Scholarships, and Student Finance Pattern

Use `/sw/elimu/` as the durable Swahili hub for education, exams, scholarships, student finance, and study tools. Group the hub in this order: education hub and study plan, exams and grade calculators, GPA/CGPA and grade tracking, scholarships/fees/student loans, university/degree/study-abroad pathways, flashcards/timetables/learning tools, then links to student budget, health, work, and fintech.

Retain education terms only when they match official exam names, scholarship forms, or user search: `WAEC`, `NECO`, `JAMB`, `KCSE`, `APS`, `Matric`, `GPA`, `CGPA`, `IELTS`, `HELB`, `NSFAS`, `NYSC`, and `NSS`. Explain each retained term in Swahili framing instead of leaving acronyms unsupported.

For the overlapping student-loan routes, use `tools/student-loan-repay/` as the paired source for Swahili repayment planning unless a future product-truth review explicitly canonicalizes `tools/student-loan/`. Do not add Swahili hreflang to the duplicate route unless that route is intentionally localized.

Never overclaim official cutoffs, admission decisions, scholarship eligibility, loan approval, school fees, degree recognition, visa outcomes, or study-abroad success. Use paired English pages for formulas, supported inputs, scripts, assumptions, and disclaimer posture, and keep Swahili pages as planning aids that point users back to official portals and qualified advisors.

### Government, Identity, and Civic Documents Pattern

For Swahili civic identity pages, keep `/sw/zana/mwongozo-kitambulisho-taifa/` as a practical planning surface for national ID systems such as `NIN`, `Ghana Card`, `Huduma Namba`, `Smart ID`, `NIDA`, and `Indangamuntu`.

Retain official ID names and acronyms when they match how users search or read government forms, then explain them in Kiswahili context on first use. Link identity pages to country hubs, TIN, VAT, business registration, education, health, and salary/PAYE only where those workflows naturally require identity or KYC.

Never overclaim live government requirements, legal status, processing timelines, fees, enrollment-center availability, travel eligibility, or KYC acceptance. Use the paired English civic page as the source for supported countries, scripts, assumptions, and disclaimer posture. If a future passport, voter, visa, or civil-certificate route overlaps with the ID page, inspect product truth first and pair only the real source route.


The Swahili government, passport, visa, and regulatory filing batch extends this pattern under `/sw/serikali-na-nyaraka/`. Group the hub in this order: kitambulisho na KYC; pasipoti na picha za pasipoti; visa na safari za Afrika; usajili wa mpiga kura; vyeti vya kuzaliwa na kifo; leseni za biashara na vibali; ulinzi wa data, alama za biashara, usajili wa bidhaa, na Made in Africa; kisha cross-links to TIN, usajili wa biashara, VAT, biashara ya nje, fintech/KYC, na usafiri/visa.

Retain official and search-useful terms when they appear in forms or portals: `passport`, `visa`, `e-visa`, `visa on arrival`, `INEC`, `IEBC`, `IEC`, `POPIA`, `NDPR/NDPA`, `DPA`, `ARIPO`, `OAPI`, `Nice Classification`, `NAFDAC`, `KEBS`, `SABS`, `FDA Ghana`, `AfCFTA`, and `Rules of Origin`. Explain these terms in Kiswahili framing and avoid importing mojibake or emoji artifacts from English sources.

Do not duplicate completed surfaces. `/sw/zana/mwongozo-kitambulisho-taifa/` remains the National ID pair; government batches should link it rather than recreate it. Do not add another Swahili alternate to `tools/national-id-guide/` unless that route is intentionally revisited. For sparse government or regulatory data, use verification language and point users to official authorities, qualified professionals, or regulators instead of inventing fees, timelines, eligibility, election dates, visa outcomes, certificates, trademark approval, product-registration success, or data-compliance guarantees.

### Legal Documents, Contracts, and Access-to-Justice Pattern

Use `/sw/biashara-na-uzingatiaji/` as the broad paired Swahili legal/compliance hub unless a future batch deliberately repoints `legal/index.html`. Do not create a competing `/sw/sheria-na-mikataba/` hub while that pairing remains in place.

Group the legal slice in this order: mikataba ya biashara; NDA, ubia, na wanahisa; kiapo na tamko la kisheria; nguvu ya wakili na wosia; msaada wa kisheria, ada za mahakama, na dhamana; then existing ajira, freelance, rental, business-license, data, trademark, TIN, VAT, and government-document links.

Retain legal and search-useful terms when they match forms or user vocabulary: `NDA`, `partnership agreement`, `shareholder agreement`, `affidavit`, `statutory declaration`, `power of attorney`, `will`, `legal aid`, `court fees`, `bail`, `surety`, `notary`, `commissioner for oaths`, `probate`, `tag-along`, `drag-along`, and `vesting`. Explain each term in Kiswahili framing instead of leaving English labels unsupported.

Never claim generated documents are legally valid across every country. Do not invent filing fees, bail outcomes, legal-aid eligibility, estate rules, witness rules, notarization requirements, court acceptance, trademark validity, employment enforceability, or property-transfer outcomes. Keep the pages as planning/checklist tools and point users to lawyers, courts, legal-aid offices, notaries, commissioners for oaths, employers, landlords, company secretaries, and official authorities.

### Data Privacy, DPA, DPIA, and Breach Notification Pattern

Keep Swahili data-privacy pages under the broader business/compliance and government/KYC discovery graph, not as a new top-level hub unless a later product decision deliberately creates one.

Group the slice in this order: sera ya faragha and cookie consent; DPA and controller/processor workflows; DPIA and risk assessment; breach notification; cross-border data transfer; GDPR vs African data laws; country-specific checks for Nigeria NDPA, South Africa POPIA, and Kenya DPA; then links to existing data-compliance, legal documents, business license, fintech/KYC, and government documents.

Retain privacy and regulatory terms when they match official forms, contracts, or user search: `GDPR`, `POPIA`, `NDPR`, `NDPA`, `DPA`, `DPIA`, `cookie consent`, `privacy policy`, `controller`, `processor`, `data subject`, `lawful basis`, `breach notification`, `cross-border transfer`, `Information Regulator`, `NDPC`, and `ODPC`. Explain these terms in Kiswahili framing rather than leaving them as unexplained English labels.

Never claim legal compliance, regulator approval, fine avoidance, or live legal accuracy. Do not invent statutory deadlines, penalty amounts, filing rules, transfer mechanisms, or regulator requirements. Use paired English privacy pages for supported country coverage, scripts, assumptions, and disclaimer posture, and point users to regulators, lawyers, DPOs, privacy professionals, or qualified advisors.

### Company Formation and Corporate Compliance Pattern

Keep company formation and corporate filing tools under `/sw/biashara-na-uzingatiaji/` as an extension of the business/compliance surface. Do not create a separate top-level company hub in this batch unless a later product decision deliberately creates and pairs one.

Group the slice in this order: business registration and company type; Nigeria CAC name check and CAC cost; South Africa CIPC cost; annual returns and compliance calendar; board resolutions; foreign-company registration; winding-up and closure planning; then links to TIN, VAT, business license, legal documents, data privacy, fintech/KYC, trade, and payroll/PAYE where natural.

Retain official and search-useful terms when they match registry portals, forms, or user search: `CAC`, `CIPC`, `annual returns`, `board resolution`, `company type`, `sole proprietor`, `private company`, `public company`, `partnership`, `foreign company`, `branch`, `subsidiary`, `winding-up`, `registrar`, `company secretary`, and `compliance calendar`. Explain them in Kiswahili framing rather than leaving them as unexplained English labels.

Never claim registration approval, name availability, fee accuracy, filing acceptance, tax compliance, company-secretarial compliance, or closure approval. Do not invent filing deadlines, penalties, official forms, or eligibility. Use paired English company/compliance pages for behavior, scripts, assumptions, country coverage, and disclaimer posture, and point users to registrars, company secretaries, lawyers, accountants, tax authorities, or official portals.

### Small Business, SME Operations, and Startup Finance Pattern

- Treat `/sw/biashara-ndogo/` as the durable Swahili SME operations hub for business plans, cash flow, burn rate, runway, unit economics, startup valuation, TAM/SAM/SOM, pricing, inventory, daily-trader profitability, payment gateway costs, and POS-agent economics.
- Keep `/sw/biashara-na-uzingatiaji/` focused on compliance, tax, legal, government filing, TIN, VAT, company registration, data privacy, and corporate obligations. Keep `/sw/biashara-na-faida/` focused on profit, margin, break-even, and pricing fundamentals.
- Recommended `/sw/biashara-ndogo/` order: business plan and AI business planner; cash flow, burn rate, runway, and unit economics; startup valuation and TAM/SAM/SOM; pricing, markup, discount, and profit margin; inventory and daily sales tracking; Mama Put, market stall, POS agent, and payment gateway; then invoice, merchant fees, POS fees, marketplace fees, VAT, TIN, registration, legal, fintech, and trade links.
- Retain search-useful terms where helpful: SME, startup, burn rate, runway, cash flow, churn, markup, discount, inventory, POS agent, payment gateway, TAM, SAM, SOM, unit economics, CAC, LTV, and GMV. Explain them in natural Kiswahili instead of leaving unexplained English fragments.
- Do not overclaim funding success, valuation precision, exact profit, provider availability, market-size certainty, business survival, or tax treatment. Keep pages as planning tools and direct users to accountants, advisors, payment providers, registrars, tax authorities, or qualified professionals when decisions carry risk.

#### Business and Finance Glossary

Use this glossary for Swahili business, VAT, invoice, fintech, SME, and trade-finance pages:

- `cash flow`: use `mtiririko wa fedha`. Use `cash flow` only in first-mention parentheses when search context truly needs it.
- `quote`: avoid the bare word `quote`. Use `quotation` for supplier, customer, proforma, freight, or service documents. Use `bei ya makadirio` only when the page is not referring to a formal document.
- `offer`: use `ofa` for job, bank, lender, insurance, or funding offers. Use `ofa mbadala` for `counter-offer`. Do not use `ofa` for a quotation or invoice.
- `approval`: use `idhini` for banks, regulators, customs, platform, loan, permit, or account decisions. Do not imply approval is guaranteed.
- `burn rate`: use `kiwango cha matumizi`; add `(burn rate)` only on first mention when the tool is specifically about startup finance.
- `runway`: use `muda wa fedha` or `muda wa fedha za biashara`.
- `inventory`: use `akiba ya bidhaa` for business stock tracking. Use `bidhaa` for ordinary stock items.
- `invoice`: use `ankara`; keep `invoice` only in retained English route names or when explaining an English-only source.
- `discount`: use `punguzo`.
- `due date`: use `tarehe ya mwisho`.
- `payment note`: use `maelezo ya malipo`.
- `approval/offer/quote` disclaimers should point users to banks, tax authorities, registrars, customs agents, accountants, lawyers, payment providers, or other qualified professionals as appropriate.

### Creator Economy, Content, and Brand Collaboration Pattern

- Treat `/sw/ubunifu-na-watayarishi/` as the durable Swahili creator hub for content planning, creator profile pages, social captions, hashtags, hooks, scripts, titles, bios, media kits, influencer rates, brand collaboration ROI, creator pricing, creator invoices, monetization, and analytics.
- Keep `/sw/biashara-ndogo/` focused on SME operations and startup finance. Keep `/sw/kazi-na-ajira/` focused on career, freelance, jobs, and employment workflows. Link those surfaces from creator pages without turning the creator hub into a general business or career hub.
- Recommended `/sw/ubunifu-na-watayarishi/` order: creator hub and profile or one-link page; content calendars; captions, hashtags, hooks, scripts, titles, and bios; media kit and creator page; influencer rate, creator pricing, and brand collaboration ROI; creator invoice, money, and analytics; then personal brand, freelance pricing, freelancer invoice, fintech, SME operations, marketplace fees, and career links.
- Retain search-useful terms where helpful: creator, influencer, content calendar, caption, hashtag, hook, script, bio, media kit, rate card, brand collab, ROI, analytics, engagement rate, CPM, TikTok, Instagram, YouTube, LinkedIn, one-link, and invoice. Explain them in natural Kiswahili framing.
- Do not claim guaranteed followers, reach, virality, brand deals, income, platform approval, CPM, engagement rates, or sponsorship conversion. Do not invent live platform rules, rates, or algorithm behavior. Use paired English creator pages for behavior, assumptions, scripts, and disclaimer posture.

### Image, Design, and Visual Creator Production Pattern

- Treat `/sw/picha-na-design/` as the durable Swahili image/design hub for brand kits, canvas work, thumbnails, social resize, carousel, social cards, image compression, crop, resize, format conversion, filters, OCR, logo, QR, flyer, video clip planning, screen recording, audio recording/editing, stock media, and repurposing.
- Keep `/sw/ubunifu-na-watayarishi/` as the broader creator economy hub for content planning, profile, pricing, invoices, monetization, and analytics. Link between the two without making either hub duplicate the other.
- Recommended `/sw/picha-na-design/` order: image/design hub and creator brand kit; canvas, thumbnail, resize, carousel, and social cards; general image compression, crop, resize, format conversion, filters, and OCR; logo, QR, and flyer tools; video clip, screen recording, audio recording/editing; stock media and repurposing; then creator calendar, scripts, hooks, media kit, creator page, SME, fintech, and career/freelance links.
- Retain search-useful terms where helpful: brand kit, canvas, thumbnail, carousel, social card, image compression, crop, resize, format, filter, OCR, logo, QR code, flyer, clip, auto-caption, screen recorder, audio editor, stock media, repurpose, TikTok, Instagram, YouTube, and LinkedIn. Explain them in natural Kiswahili framing.
- Do not overclaim privacy, file deletion, AI quality, OCR accuracy, platform approval, brand performance, virality, image quality, compression results, or licensing safety. Use paired English image/design pages for scripts, file-handling behavior, assumptions, and disclaimer posture. If shared scripts emit English, localize only at the touched Sw page level unless a future batch deliberately changes shared engines.

### Document and PDF Workspace Pattern

- Treat `/sw/hati-na-pdf/` as the durable Swahili hub for document and PDF workflows, paired to `/document-pdf/`. Treat `/sw/zana/kituo-cha-pdf/` as the Swahili PDF tool-center pair for `/tools/document-pdf/`.
- Group the Swahili PDF workspace in this order: PDF workspace and hub; merge/split/compress/reorder; password, signature, watermark, and redaction; page numbers, headers/footers, image conversion, format conversion, and OCR; form filling and PDF editing; then links to invoices, CVs, cover letters, contracts, business compliance, creator workflows, and image/design.
- Retain search-useful terms where helpful: `PDF`, `OCR`, `watermark`, `AES-256`, `eSignature`, `redaction`, `header`, `footer`, `ZIP`, `JPG`, and `PNG`. Explain them in natural Kiswahili framing instead of leaving unexplained English labels.
- Keep advanced PDF tools out of the core workspace batch unless explicitly scoped: AI chat with PDF, translation, compare, audio reader, Bates numbering, HTML-to-PDF, find/replace, repair, and workflow builder need their own product-truth pass.
- Do not overclaim file deletion, privacy, OCR accuracy, legal validity, signature enforceability, compression quality, format fidelity, or acceptance by official portals. Use paired English PDF pages for scripts, browser/file-handling behavior, assumptions, and disclaimer posture. Treat sitemap `<lastmod>` report output as baseline unless a touched route proves otherwise.
- Advanced PDF workflow extension: keep `/sw/hati-na-pdf/` as the durable Swahili document/PDF hub and treat Bates numbering, bulk watermark, repair, HTML-to-PDF, workflow builder, PDF chat, compare, find/replace, translate, and audio as workflow extensions rather than a separate top-level category.
- Advanced grouping order: core PDF workspace and organization; Bates numbering, bulk watermark, headers/footers, and audit trails; repair, compatibility, password, and damaged-file cautions; HTML-to-PDF and export fidelity; workflow builder; chat, compare, find/replace, translate, and audio; then bridges to image/design, invoices, government documents, business documents, creator files, and education files.
- Retain practical terms such as `PDF`, `Bates numbering`, `watermark`, `bulk watermark`, `OCR`, `HTML to PDF`, `workflow`, `audit CSV`, `ZIP`, `export`, `download`, `compare`, `find and replace`, `translate`, `audio`, `browser-based`, `password`, `encrypted`, `damaged PDF`, `repair`, `eSignature`, and `redaction`, with surrounding Kiswahili that explains the term naturally.



### Religious, Cultural, Family Ceremony, and Community Planning Pattern

- Treat `/sw/dini-na-utamaduni/` as the durable Swahili hub for religious, cultural, family ceremony, Islamic planning, traditional attire, naming, funeral, wedding, festival, and community-culture tools.
- Recommended grouping order: hub and broad culture/religion entry; Christian giving such as tithe and offering; Islamic planning including zakat, prayer times, Ramadan/Ramadhani, Hijri, Hajj/Umrah, Faraid, Islamic finance, and halal; family ceremonies such as wedding, naming, funeral, lobola and mahari; cultural identity such as proverbs, baby names, traditional calendars, name-day and age notes; festivals, attire, Aso-Ebi and group outfit planning; then links to insurance, fintech, SME, health, education, data/productivity, and government documents.
- Retain search-useful terms where they match user vocabulary or forms: `tithe`, `offering`, `lobola`, `mahari`, `zakat`, `nisab`, `swala/salah`, `Qibla`, `suhoor`, `iftar`, `taraweeh`, `Eid`, `Ramadan/Ramadhani`, `Hijri`, `Gregorian`, `Faraid`, `Hajj`, `Umrah`, `Murabaha`, `Ijarah`, `Musharakah`, `nikah`, `aqiqah`, `Aso-Ebi`, `kente`, `kitenge`, `agbada`, `kaftan`, `halal`, and `certification`. Explain them in natural Kiswahili framing.
- Keep wording respectful and neutral across Christian, Muslim, and cultural/traditional tools. These pages are planning/checklist aids, not religious rulings, legal advice, official calendars, halal certification, family approval, or guaranteed ceremony budgets. Point users to scholars, local religious leaders, family elders, registrars, licensed advisors, official organizers, or qualified professionals where decisions matter.

### Data, Productivity, Calendar, and Everyday Utility Pattern

- Treat `/sw/data-na-tija/` as the durable Swahili hub for productivity, planning, calendar, date, unit conversion, everyday utility, and lightweight office workflows.
- Keep this category connected to developer, PDF/document, education, SME, salary, and fintech surfaces without replacing them. Recommended order: data/productivity hub; focus and Pomodoro; unit conversion and everyday calculators; budget, bill splitting, and meeting-cost planning; countdown, public holidays, working days, and time zones; age and personal date utilities; grade tracking; random picker and classroom/team tools; then cross-links.
- Retain search-useful terms where helpful: `Pomodoro`, `unit converter`, `countdown`, `time zone`, `public holidays`, `working days`, `GPA`, `CGPA`, `random picker`, `budget planner`, `meeting cost`, `tip`, `bill split`, `WhatsApp share`, `CSV`, `export`, `iCal`, `offline`, and `local browser`. Explain them in natural Kiswahili framing.
- Do not overclaim holiday completeness, time-zone accuracy, budget advice, grade outcomes, meeting-cost precision, tip rules, random fairness, or productivity guarantees. Use paired English pages for behavior, scripts, assumptions, and disclaimer posture, and point official dates, HR deadlines, grades, receipts, or financial decisions back to their source authorities.

### Developer, Web Utility, API, and USSD Pattern

- Treat `/sw/zana-za-developer/` as the durable Swahili developer-tools hub for developer utilities, web launch checks, API work, data conversion, security helpers, hosting, PWA, and USSD workflows.
- Treat `/sw/zana/kituo-cha-developer/` as the paired Swahili tool/workspace surface for `/tools/dev-tools/`. Keep `developer-tools/` and `tools/dev-tools/` paired to different Swahili routes. Keep `developers/` out of this lane unless a later API portal batch explicitly scopes it.
- Recommended grouping order: developer hub and workspace; JSON, data conversion, and text/code utilities; hash, Base64, JWT, password, URL, UUID, and security helpers; Regex, diff, Markdown, HTML entities, and color contrast; API tester, SQL playground, and SQL formatter; SEO/web utilities such as meta tags, robots.txt, sitemap, and .htaccess; African API directory, domains, hosting, Docker Compose, and PWA manifest; USSD simulator and flow builder; then links to PDF, image/design, SME, fintech, education, and business compliance.
- Retain search-useful terms where they match developer vocabulary: `JSON`, `CSV`, `XML`, `YAML`, `TOML`, `TSV`, `Base64`, `Regex`, `JWT`, `URL`, `UUID`, `ULID`, `NanoID`, `HTML entities`, `Markdown`, `WCAG`, `API`, `REST`, `SQL`, `SQLite`, `CSS`, `meta tags`, `Open Graph`, `robots.txt`, `sitemap`, `.htaccess`, `password`, `hash`, `SHA-256`, `HMAC`, `Docker Compose`, `PWA`, `manifest`, `USSD`, `export`, `ZIP`, `CSV`, and `local browser`, with natural Kiswahili framing.
- Do not overclaim cryptographic security, password safety, JWT verification, API privacy, local processing, CORS behavior, hosting price accuracy, domain availability, SEO ranking, sitemap acceptance, PWA installability, or USSD deployment readiness. Distinguish hashing from encryption and decoding from verification, and point production decisions back to provider docs, security review, staging tests, or qualified advisors.


### Energy, Utilities, Climate, and Environment Pattern

- Treat `/sw/nishati-na-huduma/` as the durable Swahili hub for electricity tariff, prepaid meter/LUKU, bill verification, solar ROI and sizing, batteries, inverter, generator fuel, outage cost, water bills, LPG, PayGo solar, EV charging, biogas, mini-grid planning, appliance power, energy audit, and energy carbon footprint.
- Treat `/sw/hali-ya-hewa-na-mazingira/` as the durable Swahili hub for drought, rainfall, water scarcity, flood risk, air quality, carbon credit, tree planting, deforestation, waste management, recycling, e-waste, clean cooking, and sustainability scorecards.
- Recommended energy grouping order: electricity tariff, prepaid meter, and bill verification; solar ROI, solar sizing, batteries, inverter, and backup duration; solar vs generator, generator fuel, outage cost, and diesel vs solar farm; water bill, LPG, PayGo solar, EV charging, and biogas; mini-grid feasibility, energy audit, appliance power, and carbon footprint; then links to property, agriculture, transport, SME, fintech, and climate tools.
- Recommended climate grouping order: drought, rainfall, water scarcity, and flood risk; air quality and health/environment context; carbon credit, carbon footprint, tree planting, and deforestation; waste, recycling, e-waste, and charcoal vs clean cooking; sustainability scorecard and business action planning; then links to agriculture, insurance, health, water safety, energy, SME, and government/compliance tools.
- Retain search-useful terms when they match equipment, utility bills, carbon workflows, or user search: `kWh`, `kWp`, `kVA`, `tariff`, `prepaid meter`, `LUKU`, `solar`, `inverter`, `battery`, `lithium`, `lead-acid`, `LPG`, `PayGo`, `mini-grid`, `ROI`, `TCO`, `EV`, `diesel`, `generator`, `backup`, `outage`, `carbon footprint`, `carbon credit`, `MRV`, `REDD+`, `AQI`, `PM2.5`, `e-waste`, `recycling`, `biogas`, and `clean cooking`. Explain them in natural Kiswahili framing.
- These pages are estimate and planning surfaces, not official tariffs, engineering designs, weather forecasts, medical advice, carbon-credit certification, insurance quotes, or sustainability certification. Keep country coverage and market assumptions as narrow as the paired English source supports, and point users to utilities, regulators, qualified installers, engineers, meteorological agencies, health/environment authorities, insurers, carbon professionals, or official data sources when decisions carry risk.

### Telecom, Mobile Data, Internet, and Connectivity Pattern

- Treat `/sw/mawasiliano-na-mtandao/` as the durable Swahili hub for telecom, mobile data, USSD codes, airtime value, SIM registration, number portability, roaming, Starlink, ISP comparison, fiber/LTE/5G, business internet, bulk SMS, WhatsApp Business versus SMS, and TV/streaming package planning.
- Recommended grouping order: mobile data plans and data usage; USSD codes and airtime value; SIM registration and number portability; roaming, Starlink, ISP, fiber, LTE, and 5G; business internet, bulk SMS, and WhatsApp Business versus SMS; TV, streaming, and home entertainment; then links to fintech, developer/USSD, government ID/KYC, SME, data/productivity, and travel or transport surfaces.
- Keep ownership boundaries clear: fintech keeps mobile money and payment-fee tools, developer keeps USSD builders and simulators, government keeps ID/KYC/civic documents, and travel/transport keeps travel logistics. Telecom links to those surfaces without duplicating them.
- Retain search-useful terms where they match provider forms or user search: `SIM`, `eSIM`, `USSD`, `airtime`, `data bundle`, `MTN`, `Airtel`, `Safaricom`, `Vodacom`, `Glo`, `Orange`, `Starlink`, `ISP`, `fiber/fibre`, `LTE`, `5G`, `VSAT`, `Mbps`, `latency`, `roaming`, `bulk SMS`, `WhatsApp Business API`, `KYC`, `NIN`, and `BVN`, with natural Kiswahili explanations.
- Do not overclaim live data-plan prices, bundle validity, coverage, network speed, Starlink availability, ISP guarantees, TV package prices, roaming rates, SIM approval outcomes, number-porting timelines, or WhatsApp/SMS provider pricing. Use paired English telecom pages for source behavior, scripts, provider framing, country coverage, and disclaimer posture.

### Language, Translation, Transliteration, and African Names Pattern

- `/sw/lugha-na-tafsiri/` is the durable Swahili language and translation hub.
- Grouping order: Swahili, Yoruba, Hausa, Igbo, Amharic, and Zulu translators; Nigerian Pidgin and Francophone African French; Arabic numerals and transliteration; African name meanings; then links to PDF translation, education, culture, government documents, creator writing, and developer text utilities.
- Retain search-useful terms where helpful: translation, translator, phrasebook, tone marks, Pidgin, Francophone Africa, Arabic-Indic numerals, transliteration, romanization, Ge'ez, Tifinagh, Unicode, script, pronunciation, and name meaning.
- PDF translation remains under the Document/PDF workspace, medical report translation remains under health, and baby names/cultural names remain linked from culture rather than duplicated here.
- Do not claim perfect translation quality, certified translation, legal/medical accuracy, school or immigration acceptance, or final cultural authority. Encourage users to verify with native speakers, qualified translators, family/community authorities, schools, agencies, or professionals when decisions matter.
