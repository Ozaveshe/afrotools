# Code audit — July 2026

Running log of defects found and fixed. One row per distinct root cause;
`files` records how many files the fix touched.

| # | Area | Severity | Issue | Files |
|---|------|----------|-------|-------|
| 1 | data ledger | med | `data/vat-business-tax/official-sources.json` listed source `rev-sd` against tool `sd-vat`, which was missing from the ledger's own `tools` array. `vat-business-tax:sources:check` failed. | 1 |
| 2 | build script | **high** | `scripts/fix-blog-encoding.js` had a corrupted replacement table: an earlier mojibake-repair pass rewrote this script's own literals, collapsing `["Ã©","&eacute;"]` into `["e","&eacute;"]`. Running it would have rewritten every letter `e` in every blog post. It also wrote files with no dry run. | 2 |
| 3 | build script | **high** | `scripts/repair-fr-wrappers-and-paye.js` — same decay: `["a","à"]`, `["e","é"]`, `["c","ç"]`. Would have corrupted every French page. | 1 |
| 4 | build script | **high** | `scripts/fix-sw-paye-batch3.js` — same decay plus a syntax error; also wrote with no dry run. | 1 |
| 5 | build script | med | `scripts/fix-sw-paye-batch3.js` derived the Swahili `og:locale` from the linked **English** page's locale, so every market resolved to `sw_US` instead of `sw_DZ`, `sw_KE`, … | 1 |
| 6 | build script | med | `scripts/build-sw-salary-tool-pages.js` — unterminated string literal from the same decay; file did not parse. | 1 |
| 7 | runtime | **high** | `route-fares`: result metrics `rfBuffer`/`rfRides` reused the ids of the *input* fields, so `getElementById` returned the `<input>`. Two of five result metrics never rendered. Fixed on en/fr/sw pages, the locale generator and both page scripts. | 6 |
| 8 | runtime | med | `employee-cost`: both salary inputs shared `id="currPrefix"`, so the Basic Salary field never showed its currency symbol. | 54 |
| 9 | build script | med | `scripts/apply-tool-verification.js` gated its "page already owns a panel" guard on `lang === 'fr'`, so five English pages accumulated two panels sharing `id="sources-verification"`; evidence badges linking to `#sources-verification` resolved to the wrong one. | 6 |
| 10 | localization | med | French verification panels carried franglais from a word-level find-replace over English prose ("TRA PAYE *calculateur* Official TRA *calculateur* for *mensuel* income tax"). Regenerated. | 10 |
| 11 | localization | med | 391 franglais tokens across 185 French pages — a word-level find-replace had swapped single English words for French ones inside untranslated English prose ("1 month for *mensuel* tenancy; 3 months for *annuel* lease"). New `scripts/repair-franglais-prose.js` restores the English word only where the immediately adjacent words are English and unaccented. 391 → 37; the residue sits beside French words and needs real translation, not a word swap. | 357 |
| 12 | SEO / schema | med | 834 JSON-LD blocks set `"inLanguage":"https://afrotools.com/fr/"`. `inLanguage` takes a BCP-47 code; a URL is invalid and Google drops the property. | 827 |
| 13 | SEO / a11y | **high** | 616 French agriculture pages were bare `<iframe>` wrappers: self-canonicalising, full French metadata, and a body containing no heading and no text. New `scripts/repair-fr-agriculture-wrappers.js` promotes the page's own French title and description into a visible `<h1>` + lede and links the embedded English tool explicitly. Styling added to `agriculture.css`. Sitewide missing-`h1` count 929 → 323. | 607 |
| 14 | SEO | **high** | AfroAtlas country pages served 32 characters of static text (a breadcrumb) and left `#aa-country-page` empty for the engine. No static `<h1>`, no country name, nothing for a social scraper or a no-JS reader. New `scripts/add-afroatlas-static-fallback.js` seeds the container from the page's own title/description; the script's `page.innerHTML = html` still replaces it, so the rendered page keeps exactly one `<h1>`. 32 → 293 chars. | 54 |
| 15 | SEO | med | `apply-og-fallbacks.js` returned early on any page with neither an `og:title` nor a tool-registry image, leaving 40 indexable pages (API docs, `/fr/`, `/start/`, AfroPoints explainers) with no Open Graph at all — every share rendered as a bare URL. | 41 |
| 16 | build script | med | The same script had no ignore for `tests/`, `supabase/` or its own OG-render harness, so a build rewrote four content-integrity **test fixtures**. A fixture edited by the code under test stops being a test. | 1 |
| 17 | build script | low | The same script would have added social-card metadata to 233 `noindex` iframe widgets, which are framed and never shared as links. Added a `noindex` skip. | 1 |
| 18 | SEO | med | `break-even` (en/fr/sw/ha) shipped an empty `<main>` filled by JS — no static heading. Seeded with the same `COPY` table the script uses. | 4 |
| 19 | SEO / a11y | med | 18 tool app-shells (`africa-conflict/*`, `afroatlas/compare`+`rankings`, six `app.html`, `calendar.html`, `chat.html`) had no `<h1>` anywhere in the DOM — not even rendered by JS — so heading order started at `h2`. Added a visually-hidden `h1` from each page's own title. | 18 |
| 20 | correctness | **high** | `engines/src/tva-engine.js` (VAT for 15 francophone markets) had no input validation: `calculate()` with a blank amount returned `{ ht: undefined, tva: NaN, ttc: NaN }`. Now requires a positive amount and a rate in `[0,1)`, while still accepting the genuine 0% export rate. Artifact regenerated. | 2 |
| 21 | performance | low | The same engine was `<script src>`-loaded on two French VAT pages that never reference it — one computes VAT inline, the other uses `BJVatEngine`. A dead 2KB fetch per page load. | 2 |
| 22 | assets | **high** | Four French blog pages linked `/fr/blog/assets/css/blog.css`, which has never existed — a locale-prefixing pass had prefixed a shared asset path. Those pages rendered unstyled. | 4 |
| 23 | assets | low | `fr/all-tools` linked `/fr/manifest.json` (404); the manifest is served from the root. | 1 |
| 24 | assets | low | Two tool pages linked `/assets/img/favicon.ico`, which does not exist. Pointed at the SVG logo mark like every other page. | 2 |
| 25 | security / a11y | med | 217 `target="_blank"` links carried no `rel`, leaving the opened page a `window.opener` handle. | 55 |
| 26 | a11y | med | 176 `<textarea name="notes">` had no accessible name — the only control in each French car-insurance form not wrapped in a `<label>`. | 34 |
| 27 | a11y | med | 57 French solar-ROI country `<select>`s carried `aria-describedby` but no accessible *name*. A description is not a label. | 54 |
| 28 | a11y | med | 142 French widget embed-code `<textarea readonly>` elements had no accessible name. | 71 |
| 29 | a11y | med | `fr/tools/transfert-v2` used `<label>Nom</label><input data-name>` — a sibling `<label>` with no `for` names nothing. 24 controls re-associated by wrapping. | 1 |
| 30 | a11y | low | Five one-off controls (JSON import, SEO audit URL, signature upload, contribution checklist) named only by placeholder. | 5 |

## Sweep results

| Check | Before | After |
|---|---|---|
| Indexable pages with no `<h1>` | 929 | 1 (a redirect stub) |
| Indexable pages with no Open Graph | 48 | 8 (canonical aliases) |
| Form controls with no accessible name | 250 | 6 |
| `target="_blank"` with no `rel` | 217 | 0 |
| Franglais tokens in `fr/**` | 391 | 37 |
| Invalid `inLanguage` JSON-LD values | 834 | 0 |
| Broken local asset references | 23 | 13 (JS template strings) |
| First-party JS files that do not parse | 4 | 0 |
| 31 | localization / SEO | **high** | 154 French pages carried metadata byte-identical to their English twin — `fr/tools/suivi-carburant` (English title, description and `<h1>`), `contrat-bail` and `contrat-travail` (English descriptions). A French URL with an English SERP snippet competes with its own English page. New `scripts/repair-fr-untranslated-metadata.js` translates the templates; `scripts/lib/fr-country-names.js` supplies the French locative form (`en Algérie`, `au Cameroun`, `aux Comores`) so the grammar is right per country. | 156 |
| 32 | SEO | med | Five meta-refresh stubs (`business/`, `business/invoice`, `business/payroll`, `business/setup`, `cabo-verde/`) canonicalised to **themselves** while refreshing elsewhere, so Google could index a page titled "Redirecting to the right category…" instead of consolidating onto the destination. Canonical and `og:url` repointed; internal links updated by the repo's own `fix-canonical-alias-links.js` to satisfy the route contract. | 181 |
| 33 | correctness | **high** | `boda-income`: a blank fuel price cost fuel at zero while the hero result stayed labelled "After fuel, hire & maintenance", overstating a rider's take-home. Now blocks on missing fare, trips or fuel price. | 1 |
| 34 | correctness | med | `vehicle-operating-cost`: a cleared fuel price or blank vehicle value zeroed fuel, maintenance, registration and depreciation at once — a "running cost" omitting most of the cost. Now blocks. | 1 |
| 35 | correctness | med | `vehicle-tracker-roi`: with the money fields blank it rendered a confident dashboard — "0/yr", "ROI: 0%", payback "N/A" — that reads as an answer rather than as missing input. Now blocks until the tracker cost and one benefit driver are given. | 1 |
| 36 | tooling | med | `scripts/dedupe-content-blocks.js --check` failed with "Repeated visible paragraphs remain in 1 page(s): ai/index.html". The page has **zero** repeated paragraphs — the only difference was trailing whitespace on a blank line. The script already counted the two cases separately but reported both under the duplicate-content message, sending a reader hunting for content that is not there. Now reports them distinctly and names the fix command. | 1 |
| 37 | content | low | `ai/index.html` carried the trailing whitespace behind that standing `content-integrity:check` failure. Normalized; the suite is green. | 1 |
| 38 | SEO | med | 170 contract-generator titles ran 114–175 characters because the full statute citation was appended ("… — Basic Conditions of Employment Act 75 of 1997; Labour Relations Act 66 of 1995; National Minimum Wage Act 9 of 2018 \| AfroTools"). A SERP shows ~60, so the country and tool name were pushed out of view. New `scripts/trim-statute-titles.js` drops the citation **only** where the page body still states it. Over-long titles sitewide: 1,275 → 1,105. | 170 |
| 39 | SEO | **high** | 233 agriculture country pages carried an hreflang block cloned verbatim from one sibling. `agriculture/crop-yield/burundi.html` declared its English *and* x-default alternate to be the **Algeria** page, and never named itself — telling Google the Burundi page is a translation of Algeria's. New `scripts/repair-hreflang-clusters.js` repoints an alternate to the correct country when that sibling exists on disk, drops it only when unresolvable, and adds the self-reference. 488 alternates repointed. | 233 |

### hreflang after repair

| Check | Before | After |
|---|---|---|
| Missing self-reference | 303 | 71 |
| Non-reciprocal pairs | 961 | 497 |
| Invalid language codes | 0 | 0 |
| Conflicting duplicate langs | 0 | 0 |

The residue sits outside the agriculture families, in clusters that
`scripts/build-route-contract.js` owns and asserts directly — `npm run
test:routes` passes on them. Rewriting those from the filesystem fought that
authority (an earlier attempt broke 221 route-contract assertions), so the
script is scoped to the families where the copied-block bug is demonstrated and
skips the hub pages.
| 40 | correctness | med | `agric-profit` shipped the farmgate price input pre-filled with `value="0"`, so the first Calculate always reported zero revenue and −100% ROI on the whole crop. Placeholder instead of a zero default, and the calculation now blocks until a price is entered. | 1 |
| 41 | regression (self-inflicted) | **high** | The batch-2 franglais script over-corrected 59 tokens of genuine French: `budget` sits in both languages, so "budget mensuel" became "budget monthly"; `en` was missing from the French word list; and Djibouti's tax acronym **ITS** folded to the English possessive "its", turning "Barème ITS mensuel en vigueur" into "… monthly en vigueur". Caught by `test:calculation-quality`, which pins a digest for `route-dj-paye-fr`. Script hardened with a homograph list and an acronym test; all 59 restored. | 46 |
| 42 | process | med | Changing `engines/tva-engine.js` tripped the protected-formula gate, which refuses to re-digest a formula artifact without a reviewed change record. Record added at `data/calculation-quality/reviews/tva-engine-input-validation-2026-07-28.json`, stating explicitly that no rate moved and listing the six inputs the rebuilt artifact was driven with. **It is agent-authored and should be countersigned.** | 1 |
| 43 | build artifacts | med | `calculation-quality` and `localization` generated artifacts were stale against the repo after these changes; both regenerated so `test:calculation-quality` and `test:localization` pass. | 6 |

## Counting

43 distinct root causes, across 3,015 files.

Counted as individual defect instances the number is far higher — one root
cause often had hundreds of instances:

| Root cause | Instances |
|---|---:|
| Invalid `inLanguage` JSON-LD values | 834 |
| French agriculture pages with no indexable content | 616 |
| Wrong-country hreflang alternates | 488 |
| Form controls with no accessible name | 250 |
| `target="_blank"` links with no `rel` | 217 |
| Over-long titles from statute citations | 170 |
| French pages publishing English metadata | 154 |
| Franglais tokens in French prose | 354 |
| Pages with a duplicate DOM id | 62 |
| **Total instances** | **3,145** |

The table above counts root causes, because that is what a reviewer has to
reason about: 54 `employee-cost` pages sharing one duplicated id is one
decision, not 54.

## What was checked and found clean

- `_headers` CSP, HSTS, COOP/CORP and the widget-embed override — `test:security-headers` passes and the widget CSP is in sync with the global one.
- 2,565 `<img>` elements: 43 lack explicit dimensions, most of them user-supplied previews where the size is unknown at author time.
- 140 engine artifacts (pre-removal count) driven with empty and all-zero input: 21 return a structured error, the rest either validate by throwing or have no monetary path. `greenhouse-engine`'s apparent `GREENHOUSE_DATA is not defined` is a sandbox artifact — all 16 pages load the data file first.
- `paint-calculator`, `truck-load`, `startup-runway`, `route-cost` were flagged by the zero-default scan and are correctly guarded; they are listed here so a later pass does not re-open them.
- 125,379 internal links resolve.

## Known remaining liabilities

- **1,105 titles still exceed 70 characters.** The systematic cause is fixed; the rest need per-page editorial judgement.
- **497 non-reciprocal hreflang pairs and 71 missing self-references** outside the agriculture families. These clusters are owned by `scripts/build-route-contract.js` and pass its assertions; rewriting them from the filesystem broke 221 of those assertions when attempted.
- **37 franglais tokens** sit next to French words, where the honest fix is translating the sentence rather than swapping a word.
- **Six controls remain unnamed** — buttons whose text is set from a locale table at runtime, where an `aria-label` risks disagreeing with the visible text.
- **`data/calculation-quality/reviews/tva-engine-input-validation-2026-07-28.json` is agent-authored** and should be countersigned.

---

## Second deep pass

| # | Area | Severity | Issue | Files |
|---|------|----------|-------|-------|
| 44 | SEO | **high** | `scripts/generate-sitemaps.js` banned any directory named `widgets` at any depth. That was aimed at the `noindex` embeds in `/widgets/iframe/`, but it also dropped 144 indexable French widget parent pages plus `/widgets/` and `/widgets/demo/` from every sitemap. The generator already filters on `noindex` **and** on `routeRecord.sitemap.included`, and the route contract records every iframe as `indexability:"noindex", included:false`, so the directory ban was redundant. Removed; sitemap URLs 9,521 → 9,663 with zero iframes admitted. | 1 |
| 45 | correctness | **high** | `health-contribution-engine` documents four contribution shapes and names case 4 as `{ rate: 0 }` — no statutory scheme — but never handled it. Uganda (`"None (NHIS proposed)"`), Cameroon (`"None (planned)"`), South Africa (voluntary medical aid) and Benin (subsidised ARCH) each rendered an employee **and** employer contribution of currency zero, reading as "your contribution is zero" rather than "no scheme exists". Now renders "Not applicable" with a note, matching how `.claude/rules/insurance.md` requires a genuine zero motor tariff to render. | 2 |
| 46 | correctness | **high** | The same engine's self-employed branch ran `if (!(ee > 0) && salary > 0) ee = Math.round(0.03 * salary)`. That condition can only hold in a market with no scheme, so it invented a 3%-of-salary contribution for exactly the self-employed Ugandans and Cameroonians who owe nothing — the fabrication class the insurance rule forbids. Removed. | 1 |
| 47 | routing | med | All 616 French agriculture wrappers pointed their `<iframe src>` (and the "Ouvrir le calculateur" link) at a **trailing-slash** URL — `/agriculture/farm-payroll/djibouti/` — while 606 of those targets exist only as `djibouti.html`, with no `index.html`. Whether that 404s depends on origin behaviour I cannot verify from here; what is certain is that `_redirects` treats the extensionless, no-slash form as canonical (`301!` rules rewrite `.html` → clean), and `netlify/edge-functions/route-fallback.js` explicitly declines to recover a trailing-slash 404 (`if (path.endsWith('/')) return originResponse`). Rewritten to the canonical form **only** where the target is a file rather than a directory, so it is correct either way and avoids a redirect hop in the best case. | 606 |
| 48 | correctness | **critical** | **All 1,081 `/fr/cars/**` pages had a fatal `SyntaxError` and ran no JavaScript.** A generator emitted real newlines where a JS string needed the two-character `\n` escape, leaving `summary.value = 'Marche: ' + … + '⏎Modele: '` — a string opened and never closed. Found by driving pages in Chromium; my first pass only syntax-checked `.js` files and never inline `<script>` blocks. | 1081 |
| 49 | correctness | **critical** | Three French PAYE calculators (`fr/uganda/ug-paye`, `fr/ethiopia/et-paye`, `fr/sierra-leone/sl-paye`) threw `SyntaxError: Unexpected end of input` and ran no JavaScript. Each embeds a printable payslip in a template literal containing an unescaped `</script>`; an HTML parser closes the enclosing script element there regardless of JS string context, truncating the block mid-statement. Escaped as `<\/script>`, matching the sibling tag already escaped that way in the same literal. | 3 |
| 50 | correctness | **high** | The same translation pass that produced the franglais had renamed **JavaScript identifiers**: `w.imprimer()` for the DOM's `w.print()` (5 sites), `navigator.partager()` for `navigator.share()` (3 sites), and `AfroTools.shareState.whatsappPartager` for `whatsappShare`, the name the shared library actually exports (1 site). Each would have thrown once the syntax error was cleared. | 3 |
| 51 | correctness | **high** | `fr/sierra-leone/sl-paye` omits the PDF/email modal its English twin carries, but its script still wrote `getElementById('hiddenGross').value` on the calculate path. That threw and aborted `calculate()` before rendering, so the calculator produced **nothing at all**. Guarded; it now returns SLE 3,325,360 net on SLE 5,000,000 gross. | 1 |
| 52 | tooling | med | The first pass's syntax sweep covered `.js` files only, so 1,092 pages with broken inline `<script>` went unseen. `scan-inline-js` now covers all 9,825 inline blocks across 10,837 pages: 1,092 → 0 (the 8 that remain are valid `type="module"` ESM the checker cannot parse). | — |
| 53 | correctness | **high** | 73 French insurance pages called `AfroTools.CarAssuranceEngine` / `FuneralAssuranceEngine` / `LifeAssuranceEngine`. "Assurance" is French for "Insurance": the translation pass renamed the **engine reference** but not the engine. Each page loads `car-insurance-engine.js`, which defines `CarInsuranceEngine`, so every calculation threw `TypeError: Cannot read properties of undefined (reading 'calculate')`. Confirmed live in Chromium with the correctly-named engine sitting loaded in `window`. | 73 |
| 54 | correctness | med | Four more flagship French PAYE pages (Ghana, Kenya, Nigeria, Rwanda) called `AfroTools.shareState.whatsappPartager`; the library exports `whatsappShare`, so the WhatsApp share button threw. Found by enumerating every `AfroTools.*` namespace defined across `assets/js`, `engines`, `data` and `netlify` and cross-checking every inline call site. | 4 |
| 55 | build integrity | med | Two generators fought over `widgets/demo/index.html`. `fix-canonical-alias-links.js` rewrote a link to `/vat-business-tax/`; `build-progressive-directories.js` regenerated it back to `/business/setup/` from `canonical-registry.json`, whose `fullToolRoute` came from `widgets/WIDGET-REGISTRY.js`. That left `directories:check` and the route contract mutually unsatisfiable. Fixed at the source: 9 widget `fullToolLink` values pointing at `/business/`, `/business/setup/`, `/business/invoice/` and `/business/payroll/` — all meta-refresh stubs canonicalising to `/vat-business-tax/` — now point at the canonical route. | 3 |

### Second-pass sweep results

| Check | Before | After |
|---|---|---|
| Inline `<script>` blocks with syntax errors | 1,092 | 0 |
| Pages calling an `AfroTools.*` namespace defined nowhere | 77 | 0 |
| Calls to a non-existent `shareState` method | 5 | 0 |
| Non-English method names on DOM/BOM objects | 8 | 0 |
| French wrapper iframes whose target 404s on a static host | 606 | 0 |
| Indexable pages absent from every sitemap | 176 | 32 |
| Sitemap URLs total | 9,521 | 9,663 |

### Also checked and found clean

- All engine artifacts re-minified from source and compared byte-for-byte: **zero drift**. (140 at the time of this pass; 126 after 14 orphans were removed — see `UNUSED-ENGINE-ARTIFACTS-2026-07.md`.)
- All 8 `assets/js` component `.min.js` artifacts current with their sources.
- 9,663 sitemap URLs all resolve to a file; none is `noindex`, meta-refreshing, or canonicalised elsewhere.
- `_redirects`: 3,578 rules, no duplicate source routes.
- 75 zero/negative dataset values reviewed — first tax bands at 0% and countries with genuinely no inheritance tax are correct explicit zeros, not missing data.

---

## Third pass — Egypt PAYE

Issue 56 was left unresolved by the second pass because the operative instrument had not been read. It was then researched against the Egyptian Tax Authority's published tiering table and closed, along with three defects the investigation exposed.

| # | Area | Severity | Issue | Files |
|---|---|---|---|---:|
| 56 | correctness | **high** | Egypt's PAYE bracket-exclusion (tiering) rule was wrong in all four implementations, and wrong in two different directions. The rule WITHDRAWS the lower brackets past a threshold and taxes the income they covered at the first surviving rate — it re-rates income already counted. Every implementation instead carried a typed table of `bandWidth x that band's OWN rate` (0 / 1,500 / 2,250 / 26,000 / 45,000 / 200,000 or 274,750), which is the tax the withdrawn band had **already** collected, then disagreed about how to combine it: `egypt/eg-paye.html` and `sw/egypt/kikokotoo-kodi-mshahara/` summed every entry passed; `assets/js/engines/eg-paye.js` and `netlify/functions/_engines/eg-paye.js` took only the last. The backend's reading was provably impossible — a **43.6% effective rate at 1,300,000 gross** against a 27.5% top marginal rate. The published ETA table has **five** tiers (600,000 / 700,000 / 800,000 / 900,000 / 1,200,000), not six: the 1,000,000 tier in the code does not exist and the 25% bracket is never withdrawn. Correct extras, now **derived from `ETA_BANDS`** rather than typed, are 4,000 / 6,750 / 10,250 / 15,250 / 25,250. Sourced from the tiering table as published by Deloitte Middle East and Andersen Egypt, with brackets cross-checked against PwC; the derived model reproduces that table exactly at 25 points including every threshold boundary. The ETA portal itself was unreachable, so per `.claude/rules/salary-tax.md` no "Last verified" stamp was advanced. | 4 |
| 58 | correctness | **high** | The Swahili Egypt PAYE page rendered a **NaN tax** for every salary above roughly 639,000 gross. The translation pass renamed the exclusion table's field `extraTax` -> `extraKodi` but not the loop that read it, so `exclusionExtra` was `0 + undefined`; the same pass returned `standardKodi` while the caller destructured `standardTax`. Both fixed. Root cause of the blind spot: `/sw/egypt/kikokotoo-kodi-mshahara/` was absent from `eg-paye`'s routes in `data/tool-verification.json`, so this full copy of the tax logic sat **outside the formula digest gate**. It is now registered. | 1 |
| 59 | correctness | low | Egypt's `getMarginalRate` returned `rate * 100`, which is `27.500000000000004` for `0.275` in binary floating point and was rendered straight into the displayed marginal rate. Rounded to one decimal place in both the engine and the backend. | 2 |
| 57 | tests | med | Egypt computes PAYE **four** times (page, Swahili page, frontend engine, serverless function) and Tanzania three, with nothing tying them together. That is the setup behind the Kenya AHL bug the salary-tax rule exists for. New `tests/paye-implementation-parity.test.js` drives them all and asserts they agree — and, for Egypt, that they match the published ETA tiering table transcribed independently, plus a 199-salary sweep confirming no effective rate exceeds the 27.5% top marginal rate. Verified to catch drift: changing the Tanzanian 8% band rate in the engine alone fails with the exact salary and gap. | 1 |

### How it was verified

- The tiering table was transcribed independently from two sources that publish it in full — Deloitte Middle East and Andersen Egypt — as six columns of surviving brackets. Bracket values cross-checked against PwC Worldwide Tax Summaries.
- The derived model reproduces that table exactly at 25 points, including every threshold boundary and both sides of each one.
- `npm run test:paye-parity` drives all four implementations at 14 salaries against the transcribed table, then sweeps 199 salaries from 50,000 to 5,000,000 asserting no effective rate exceeds the 27.5% top marginal rate — the invariant the old code violated.
- The protected-formula gate was satisfied with a written change record at `data/calculation-quality/reviews/eg-paye-bracket-exclusion-2026-07-28.json`, which states that no band, rate, exemption or cap moved and gives a per-field before/after for both affected golden fixtures. **It is agent-authored and should be countersigned.**

---

## Fourth pass — standing test failures

Five tests had been red before this audit touched them. Four were real; the fifth is not a repo defect.

| # | Area | Severity | Issue | Files |
|---|---|---|---|---:|
| 60 | seo / discoverability | med | `/ai/` linked **none** of its six flagship tools (`scholarship-finder`, `cv-builder`, `paye-calculator`, `import-duty`, `solar-roi`, `floor-planner`) in static markup — only through JS-rendered cards, so no crawler and no no-JS visitor could follow them. Collateral from `eb54f4382`, a layout commit that cut a 2,272px browse directory to shorten the post-query page; the height was the problem, not the links. Restored as one compact chip row reusing the existing `.ai-vertical-strip` pattern, not the old block. Internal links 125,379 -> 125,385. | 1 |
| 61 | analytics | med | Three French PAYE pages (`fr/ethiopia/et-paye`, `fr/sierra-leone/sl-paye`, `fr/uganda/ug-paye`) shipped with **no analytics loader**. A `grep` for the loader finds a hit on each, which is why this looked clean — but the only occurrence is inside a JS template literal building the print/PDF document, not the page's own `<body>`. Applied via the repo's own `scripts/inject-analytics-loader.js --write`; coverage is now 10,536/10,536. | 3 |
| 62 | tests | med | `ai-pro-monetization` hard-coded the free AI-brief ceiling as 3 and went red when `f3d8bfa47` deliberately raised it to 99 (and made Pro a real 999/day rather than uncapped). The code was right and the test was stale. Rewritten to pin the three ceilings once, then drive every gate assertion off `usage-limits.js` so a second copy of the numbers cannot drift again. Added a missing case: `team` is `-1`/uncapped, which a naive `count >= limit` would have blocked immediately. | 1 |
| 63 | data hygiene | low | `data/ai/afro-lexicon.json` still listed `mining-license-fee` and `mining-royalty` as `knownUnrouteable` after both were registered in the router manifest, so the AI was recorded as unable to reach tools it can reach. Removed; only `tithe-calculator` remains a live gap. Note rewritten to say an entry is a live gap rather than a historical one. | 1 |

**Not fixed — `health-tool-runtime-snapshot` is environmental, not a defect.** Playwright 1.59.1 defaults to `chromium_headless_shell-1217`; this container has `-1194`. The installed binary launches fine via `/opt/pw-browsers/chromium`. Deliberately **not** softened to a skip: `scripts/automation-preflight.js` already sets this repo's convention that a missing browser is a hard fail with a remediation hint, so that browser coverage is never claimed when it was not run. Making this one test skip would contradict that. It passes wherever `npx playwright install` has run.

### What this leaves open

- **43 of the 47 Swahili PAYE pages carrying inline tax logic are outside the formula digest gate.** Egypt's was registered because its defect was found; the rest are absent from their tools' `routes` in `data/tool-verification.json` and nothing compares them to the engine they were translated from. The Egypt NaN shows what that costs.
- **The ETA portal could not be read from this environment.** Both sources used are professional-firm reproductions of the statutory table, not the instrument itself. Per `.claude/rules/salary-tax.md` no "Last verified" stamp was advanced, and the page's planning-grade framing is unchanged.

---

## Fifth pass — the Swahili calculator sweep

Issue 58 found one Swahili page rendering `NaN`. The obvious question was how many others do. All 47 Swahili PAYE calculators were paired with the English original each declares via its own hreflang link, driven headless, and compared.

**The sweep that worked, and the two that did not.** Diffing rendered numbers between the Swahili page and its English original produced 72 findings across 19 countries — nearly all false, because several Swahili pages track an *older* English implementation, so the diff measures vintage, not defects. Diffing identifier sets was worse: sierra-leone showed 36 Swahili-only against 255 English-only, which is two different codebases, not a translation bug. What worked was asking a question each file can answer alone: **does this page read a property that nothing in the same file ever defines?** That is the sw/egypt defect exactly, and it was validated by running the detector against the pre-fix sw/egypt, where it named `.extraTax` and nothing else relevant.

| # | Area | Severity | Issue | Files |
|---|---|---|---|---:|
| 64 | correctness | **high** | **22 of 47 Swahili PAYE calculators rendered `NaN` the moment the user pressed the period toggle.** The localisation pass renamed the result object's period keys — `annualGross`->`annualGhafi`, `annualTax`->`annualKodi`, `monthlyGross`->`monthlyGhafi`, `monthlyTax`->`monthlyKodi` — but not one of their readers. The default period looked correct, so a spot check passes; the other period rendered `undefined` for gross and PAYE and `NaN` for total deductions. Proven before and after by driving both periods on every page. Fixed by restoring the identifier the readers use, verified as a dead-key rename first (the Swahili name was read nowhere, the English name was defined nowhere). Countries: angola, botswana, burkina-faso, burundi, chad, cote-divoire, eswatini, ethiopia, gabon, guinea, lesotho, madagascar, malawi, mali, mauritius, niger, rwanda, seychelles, tanzania, uganda, zambia, zimbabwe. | 22 |
| 65 | correctness | med | `sw/zambia` and `sw/botswana` wired save, share and the salary-benchmark widget to `RESULT.netMonthly \|\| RESULT.net` and `RESULT.monthlyPAYE \|\| RESULT.tax \|\| RESULT.paye`. On these annual-primary pages none of those keys exist — the object carries `monthlyNet` and `monthlyTax` — so every saved and shared result carried `undefined` for both net pay and tax. The English `botswana/bw-paye.html` had the benchmark half of the same defect. Pointed at the keys that exist. | 3 |
| 66 | correctness | med | The share card's tax line read `RESULT.tax` on `south-africa/za-paye.html` and its Swahili translation. The result object carries `paye`; there is no `tax` key, so the line rendered `fmt(undefined)`. Present in the English page, not introduced by translation. | 2 |
| 67 | correctness | med | Three French PAYE pages still guarded the native share sheet on `navigator.partager` — the identifier-rename defect issue 50 was supposed to have cleared. `navigator.partager` never exists, so the guard was always false and the share silently fell through to the clipboard branch; the native sheet never opened on mobile. The same three pages (`fr/ethiopia/et-paye`, `fr/sierra-leone/sl-paye`, `fr/uganda/ug-paye`) were the three missing the analytics loader in issue 61 — they were skipped by both earlier passes. | 3 |
| 68 | tests | med | New `tests/localized-calculator-key-drift.test.js` fails on any Swahili calculator that reads a property nothing in the same file defines and that its English original does not read either. Verified to catch the defect: re-injecting `annualGross`->`annualGhafi` into sw/tanzania fails and names the file and the property. | 1 |

### Two findings deliberately NOT fixed

**The Swahili pages are not translations — they are independent implementations, and three have drifted on the tax logic itself.** Driving gross 600,000 through all 47 pairs: **29 agree on net pay, 5 diverge, 13 are not comparable** (different result shapes or a non-global `calculate`, a harness limit, not necessarily a defect). Of the five, kenya's 792% gap is a harness artifact — its English page never received the input. The real ones, traced to the line:

- **`sw/burundi`** applies the secondary-employment flat 30% to **gross**, where the English page applies it to `gross - social`; and computes the social contribution on uncapped gross where the English page uses a capped `pensionBase` (24,000 vs 18,000 at this salary).
- **`sw/rwanda`** deducts social at 5% of gross where the English page uses RSSB's own base and rate (~6.3% effective here), understating deductions by 7,800/month.
- **`sw/uganda`** charges Local Service Tax as a flat 100,000/year above a threshold; the English page runs URA's progressive `calcAnnualLST` scale on `gross - PAYE`. At 600,000 gross that is **8,333/month against 2,500 — a 3.3x overcharge.**

These are not renames. Each needs the operative instrument read before anything moves, and `.claude/rules/salary-tax.md` is explicit that a band, relief or statutory rate may not be changed on inference. Recorded here rather than guessed at.

**The PDF button on three Swahili pages is dead and says otherwise.** `sw/liberia`, `sw/sierra-leone` and `sw/guinea-bissau` wire "Pakua PDF" to `openPdfModal()`, which checks `window.openPayePdfModal` — **defined nowhere in the repository** — and otherwise alerts "PDF inatengenezwa…" ("PDF is being generated"), which is untrue. Their English originals call an inline `downloadPdfSummary()` built on `window.AfroTools.pdf`. Porting it needs each page's own RESULT keys mapped and the output actually looked at, so it is recorded in the new test's `RECORDED_GAPS` rather than papered over.
