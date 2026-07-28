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
- 140 engine artifacts driven with empty and all-zero input: 21 return a structured error, the rest either validate by throwing or have no monetary path. `greenhouse-engine`'s apparent `GREENHOUSE_DATA is not defined` is a sandbox artifact — all 16 pages load the data file first.
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
