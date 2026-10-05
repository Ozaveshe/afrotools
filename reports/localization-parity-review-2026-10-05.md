# French, Hausa and Swahili: English parity review and delivery plan

Review date: **5 October 2026**. Repository baseline: `e9fed80dd64f54f84866f33ea849c9de8c99b1ce`. Scope: review and plan; no product fixes, commits, pushes or deployments were made.

**Verdict: French and Swahili have substantial app coverage, but neither currently meets a consistently excellent translation standard. Hausa needs a larger product-completion programme as well as editorial work.** The most urgent issues are in real workflows: incorrect French invoice terminology, mixed Swahili controls, a broken Hausa CV result, and Hausa invoice behaviour that has fallen behind English tax and privacy safeguards.

The right objective is that someone can find a tool, understand its limits, complete the same task, recover from errors, and use its output entirely in their chosen language. Counting translated pages or matching English word counts cannot establish that.

**1. What this review establishes**

I inspected the locale manifests, coverage policy, shared catalogs, French and Swahili acceptance inventories, Hausa launch contracts, source generators, runtime code and existing tests. I recalculated the app inventories without rewriting them, joined Hausa coverage against the English app IDs, checked the non-app inventory, ran static and browser checks, and compared home, CV and invoice journeys across all four languages at 390 × 844 pixels. Existing browser suites additionally exercised discovery, country selection, PAYE, VAT, currency-data failure states, institutional pages, keyboard behaviour and the Hausa Core 25.

Live browser spot checks confirmed the French invoice terminology and currency-label errors, Swahili invoice mixed language, Swahili homepage “source boundary” leakage, and the Hausa CV `undefined` result. These are observations of specific public routes, not exact-SHA production certification. Local browser checks used the repository static server, whose API fixtures do not establish live provider or database health.

This is a source-wide structural review with targeted linguistic and functional investigation, **not a native-editor review of every sentence or a successful execution of all 1,256 apps**. No real CV, client, financial or account records were supplied. No paid-account, billing, Supabase, AI-provider or production export verification was performed. Suggested wording below is an editorial draft for native review.

**2. Baseline: keep the denominators separate**

| Measure | English | French | Swahili | Hausa |
|---|---:|---:|---:|---:|
| Classified public-route records | 6,140 | 3,807 | 1,596 | 106 |
| Classified native | 6,140 | 2,192 | 763 | 23 |
| Classified localized shell | 0 | 1,614 | 828 | 58 |
| Explicit English fallback | 0 | 0 | 5 | 25 |
| Indexable-eligible records | 4,013 | 2,179 | 1,584 | 81 |
| Shared catalog keys | 180 | 180 | 180 | 180 |
| English free-app inventory | 1,256 | 1,256 mapped | 1,256 mapped | 64 mapped through current coverage data |
| Recorded free-app acceptance | Baseline | 1,256 | 1,256 | No equivalent acceptance ledger in this checkout |

French also has one deprecated coverage record. These are route-contract records, not physical HTML file counts or counts of independently implemented engines. For example, the Swahili inventory has 1,601 physical HTML files but 1,596 coverage records. Agriculture contributes 447 of the 1,256 English app rows, so raw totals heavily weight repeated country families.

The Hausa join finds **9 native mappings, 51 shell mappings and 4 fallback mappings**. The other **1,192 English app IDs have no Hausa counterpart in this mapping source**. That means mapping work is missing; it is not proof that every one of those products needs an entirely new implementation. The route matrix accompanying this report lists all 1,256 English IDs and their current counterparts.

French and Swahili acceptance totals remain 1,256 when freshly calculated. Their committed reports are stale only for three English display names: `education-hub`, `plagiarism-pct`, and `tutoring-rate`. This particular drift does not remove accepted routes. The Hausa launch report is also stale in its counts, although recomputed launch gates return true.

The **separate non-app check passes its consistency test** and reports:

| Current non-app inventory | French | Swahili |
|---|---:|---:|
| English routes assessed | 465 | 465 |
| Structural pass | 160 | 137 |
| Under standard | 2 | 1 |
| Missing counterpart | 303 | 327 |
| English editorial articles represented | 40 / 338 | 21 / 338 |
| Country-hub structural pass | 54 / 54 | 54 / 54 |
| Category-hub structural pass | 30 / 32 | 27 / 32 |

The non-app checker excludes app subroutes, English author profiles and long-tail tool/country calculators. Its word/control ratios are triage signals. For example, it flags the localized homepages, but adding words or dummy controls to satisfy the ratio would not establish English workflow parity. Missing category-hub mappings also require route-owner review before creating pages; an existing localized destination may serve the intent.

Sources: `data/registry/locale-page-coverage.json`, fresh French/Swahili inventory builders, `reports/hausa-localization-coverage.md`, and `reports/localized-non-app-parity.json`.

**3. Findings, ordered by user impact**

| ID / priority | Finding and evidence | Required outcome |
|---|---|---|
| L01 / P1 | **Hausa invoice sharing lacks English's explicit data-in-link choice.** The rendered Hausa invoice has neither `includeInvoiceDataInLink` nor the English review checkbox. A local browser interception confirmed that Share constructs an `invoice` URL parameter containing the state structure, including company/client/contact/payment fields. The interception stopped the share/clipboard operation and recorded field names only. | Default to a plain tool link; require a clear Hausa opt-in before including private invoice data. Bring the review and export safeguards into parity. This is a user-initiated Share action, not evidence of background exfiltration. |
| L02 / P1 | **Hausa currency changes rewrite a user-entered tax rate.** Set tax to 9, then select KES: Hausa changes it to 16. English, French and Swahili preserve 9 in the same local comparison. Hausa source also describes VAT as following currency. | Separate currency, jurisdiction and tax choice. Preserve entered rates and amounts; explain any explicit jurisdiction-driven suggestion. No conclusion about legally correct tax rates is made here. |
| L03 / P1 | **Hausa CV output is broken and materially narrower.** On the live page, pressing “Gina daftarin CV” renders `undefined` instead of the displayed name. Inline code reads `name.value`, which collides with the browser's `window.name`. The product provides a short TXT brief and an English handoff for templates/PDF; English provides the full builder. | Fix named DOM access and assert exact synthetic-name round trips. Then reuse the full CV workflow with Hausa copy, templates, import, editing, save and supported exports. Keep partial-workflow status explicit until complete. |
| L04 / P1 | **French invoice terminology and identifiers change meaning.** “Line Items” becomes “Éléments de campagne.” Currency option text shows “SGH - Ghana” and “ODD - Soudan”; actual option values remain GHS and SDG. Confirmed locally and live. | Correct source lexicon entries; protect currency codes, statutory acronyms and technical identifiers from translation; inspect validation, preview and PDF output as well as initial labels. |
| L05 / P1 | **Swahili invoice translation is visibly incomplete.** Live labels include “Kampuni Name,” “Hati Type,” “Malipo & Compliance,” “Bank / Malipo Instructions” and “Saved Kiolezos.” Local results also show “Salio due.” These are present in the maintained lexicon, not just transient network output. | Review complete phrases and all dynamic states. Reject hybrid words and untranslated ordinary controls; retain approved technical terms only where useful. |
| L06 / P2 | **CV template flows leak English and introduce false meanings.** After opening the French builder, template cards still display “BEST FOR,” “Use template,” “Preview full size,” and English descriptions. French also translates “Global Compact” as “Pacte mondial.” Swahili includes “Programu za soko la msalaba” for cross-market job applications and describes premium templates as “vya malipo,” suggesting payment in a free workflow. | Localize dynamic template data and controls at their source. Distinguish job applications from software, compact layout from a global pact, and premium quality from paid access. Preserve user-authored CV text. |
| L07 / P2 | **Whole-app continuity remains incomplete.** Swahili auth, dashboard and vault are explicit English fallbacks; Hausa pricing, privacy, terms, account and dashboard are also bridges. French dashboard copy acknowledges partially English advanced apps. English's homepage now leads with task routing; French/Swahili lead with catalog search and a separate AI link; Hausa prioritizes Nigerian tasks. | Define and test equivalent task completion across discovery, account, saved work, AI handoff and export. Allow different wording/layout where it helps comprehension. Track Pro and account readiness separately from free-app translation. |
| L08 / P2 | **Coverage labels and acceptance records overstate what the checks prove.** `nativeKeyRatio` measures presence of the shared 180 catalog keys, not translation of each page's visible/runtime copy. French acceptance ties routes to category records; Swahili checks evidence references. Neither inventory reruns every workflow or requires current native-editor approval. Hausa's browser gate can use the stored 22 August pass flag. | Add source fingerprints, current execution receipts, explicit feature matrices and linguistic review states. Keep historical acceptance, current verification and open regressions separate. |
| L09 / P2 | **French discovery and browser contracts need reconciliation.** Directory exposes 1,373 in the published counter versus 1,374 in its result count. Another test tries to fill a retired country-prepaid-meter page; the page explicitly directs users to the main calculator. Blog test expects an old heading and eight guides. | Reconcile directory membership by ID. Update tests to the current route contract and actual capabilities; do not restore retired tariff pages or old headings just to make tests pass. |
| L10 / P2 | **Editorial and support coverage is outside the accepted free-app total.** The non-app ledger records 303 French and 327 Swahili missing counterparts, mostly articles. Hausa's blog and country directory remain explicit bridges. | Prioritize help needed to finish real tasks, then source-backed market guides. Maintain an explicit complete backlog; do not count untranslated articles as translated because their category hub exists. |
| L11 / P3 | **Shared language and accessibility details are inconsistent.** All sampled localized navbars expose “AfroTools home” as the logo's accessible name. Hausa About and Contact footer links still say “gadar Turanci” despite native destinations. Hausa catalogs mix “Tuntube” with “Tuntuɓe” and “Sharuddai Sabis” with “Sharuɗɗan amfani.” Swahili homepage exposes “source boundary”; its insurance card uses the literal “vifuniko.” | Localize accessible names and derive fallback labels from the route contract. Apply a reviewed terminology/orthography policy to shared components and generated copy. |

P1 means the next repair batch should address it because it affects correctness, privacy or primary task completion. P2 means substantial product/editorial or verification work. P3 means consistency work with a broad shared-component benefit.

**4. Language-specific editorial direction**

French is the closest to a coherent complete product in the sampled flows. Its homepage is clear and restrained, its institutional journeys remain French, and source/runtime foundations are substantial. The weak point is contextual translation in complex apps: plausible French words can express the wrong business meaning. Favor established Francophone African product language, consistent *vous*, accents and French typography, while keeping each country's own tax terminology and currencies.

Swahili has extensive working coverage and good shared-state foundations: the sampled PAYE, VAT, failure-state and keyboard tests pass. Its remaining problem is often sentence construction and meaning, not missing files. Review whole tasks with Kiswahili-speaking users in the intended markets. Technical loanwords can remain where established; ordinary actions such as saving a template should not become hybrid strings. Avoid mapping language to Kenya or KES by default.

Hausa needs both breadth and depth. Keep the useful route-first model and natural `/ha/kayan-aiki/` slugs. Build from shared engines and complete workflows, with native Hausa editorial review, instead of reproducing English HTML through bulk replacement. Standardize Boko orthography, including ƙ, ɗ and ɓ, and test search with common keyboard variants. Nigeria-specific tools may retain Nigerian scope; Hausa language selection must not silently choose Nigeria or NGN for a country-neutral workflow.

| Context | Observed copy | Suggested direction for native review |
|---|---|---|
| French invoice line items | Éléments de campagne | Lignes de facture; button: Ajouter une ligne |
| French currency label | SGH - Ghana / ODD - Soudan | GHS - Ghana / SDG - Soudan; identifiers unchanged |
| French ATS claim | CV sécurisé ATS | CV compatible avec les logiciels de suivi des candidatures (ATS); avoid a security/guarantee implication |
| French compact CV layout | Pacte mondial | Format compact international |
| French template actions | Use template / Preview full size | Utiliser ce modèle / Afficher l’aperçu en grand |
| Swahili company field | Kampuni Name | Jina la kampuni |
| Swahili document type | Hati Type | Aina ya hati |
| Swahili saved templates | Saved Kiolezos | Violezo vilivyohifadhiwa |
| Swahili amount due | Salio due | Salio linalodaiwa |
| Swahili bank/payment instructions | Bank / Malipo Instructions | Maelekezo ya benki au malipo |
| Swahili premium CV templates | violezo 30 vya malipo ya CV | violezo 30 vya CV; remove the unintended payment implication |
| Hausa terms navigation | Sharuddai Sabis | Sharuɗɗan amfani, matching the existing legal catalog |
| Hausa contact label | Tuntube Mu | Tuntuɓe mu, matching the existing glossary |

These examples establish concrete defects; they are not statistical error rates. Do not assign a precise language-quality percentage from this sample.

**5. Delivery plan**

**Phase A — establish a current acceptance baseline.** Extend the existing inventories instead of starting another competing registry. Preserve English IDs and authoritative localized routes. Add a Hausa ledger for all 1,256 current English app IDs, with explicit missing, partial-workflow, native/shell and accepted states. Check all 64 current Hausa mappings, beginning with the nine native-labeled entries. Keep non-app routes, account/Pro journeys, app subroutes, and export formats as separate coverage dimensions. Refresh the three display-name records and Hausa launch counts through their owners.

Each app record should name the English source and generator, localized owner, feature/state checklist, source fingerprint, tested revision, browser result, export artifact result, reviewer/date, unresolved defects and verified production revision when available. Changes to a shared engine, lexicon or template must invalidate affected evidence automatically. Use `needs-revalidation` for drift; retain historical acceptance for traceability.

Exit: one reproducible denominator, no ambiguous owner silently accepted, and every route has an honest current verification state. No new public “100% translated” claim follows merely from catalog completeness.

**Phase B — repair the highest-impact regressions.** First work package: Hausa invoice consent/rate preservation and Hausa CV name rendering; French invoice terminology/currency labels; Swahili invoice mixed controls; then French/Swahili CV template strings. Change dictionaries, templates and readable runtime owners; regenerate only their outputs. Reuse English safeguards and deterministic engines. If a Hausa runtime has no recoverable readable source owner, establish one before extending the minified implementation.

Acceptance examples: tax 9 remains 9 after a currency-only change in all languages; ordinary Share excludes invoice data; explicit opt-in explains exactly what a link contains; a synthetic name including relevant diacritics survives result and export; GHS/SDG stay unchanged; no “campaign” terms in invoices; CV template cards and dynamically opened panels remain localized. Include both success and invalid/empty states.

**Phase C — professional editorial review of the complete task.** Give each language a product editor and an independent reviewer. Use a domain specialist for tax, legal, health and other high-consequence terminology. Expand the existing product glossaries into contextual entries: English concept, definition, approved phrase, forbidden mistranslations, retained tokens, jurisdiction, example screen and reviewer. Avoid replacing the current static-first system with a new translation service solely for this exercise.

Review source copy, hydration, validation, empty/error/offline states, source labels, examples, template metadata, help, accessible names and downloaded files together. Begin with shared chrome and money/document/career tasks, then move through the 32 categories in bounded batches of roughly 3–5 distinct workflows. A country family may share a reviewed template, but each jurisdiction still needs correct mapping, facts, units and source applicability.

Exit per batch: no critical/major linguistic errors, consistent approved terms, no unintended ordinary English, and editor plus independent review recorded. Proper names, APIs, PDF/CSV, currency codes and approved technical terms are not automatically errors.

**Phase D — complete Hausa workflows and catalog coverage.** After stabilizing the current routes, start with the CV builder, cover letter, invoice, receipt, PDF compression and merge/split journeys, then salary/VAT, bank/currency and education/agriculture tasks already discoverable in Hausa. Decide the order using actual usage/search evidence when available; this review did not inspect analytics, so this is a task-utility priority rather than a traffic ranking.

Use the existing Naira-to-words, WhatsApp-link and USSD source-owned implementations as candidates to revalidate for the acceptance pattern, not as automatically certified examples. Preserve supported English controls, calculations, scenarios, import/export, undo/reset and local draft behaviour. Add current English counterparts in later waves by category. Keep fallback routes labeled until full acceptance; never reclassify a narrow brief as a full editor to improve the percentage.

Exit: accepted Hausa app count grows only when the complete route-specific contract passes. Resolve all 1,192 unmapped IDs through verified mapping, implementation, or an explicit scoped exception. Exceptions remain visible gaps against the user's full-parity objective.

**Phase E — close whole-app journey gaps.** Provide equivalent task discovery and intent routing in French, Swahili and Hausa, including misspellings, accents/keyboard variants, country clarification, unknown requests and understandable fallback. The English homepage's routing workflow is a behaviour benchmark; localized pages need not be literal visual copies. Never translate or overwrite user-entered CV/client content automatically when switching UI language.

Localize account entry, return-to-tool paths, saved work, pricing, help, privacy and terms. For Pro, assess the 21 currently registered app routes individually and preserve Active/Shell/Limited-preview labels; translated marketing must not imply account sync, paid access or provider readiness that English has not proved. Use correct-project live Supabase access only when that later implementation actually requires it.

For non-app content, first resolve missing category/support destinations and relevant task guides. Then work through the 338-article English editorial baseline with market-specific factual review. Countries have different rules even when they share a language. Audit the broader published route graph separately so omitted long-tail routes and app workspaces do not disappear from the programme.

**Phase F — make parity a release property.** Add change-impact checks so a change to an English workflow, shared template, source label or export contract reopens the affected locale reviews. Make targeted checks fast enough to run on each batch; use broader build, security and dist audits at integration. Preserve canonical routes, explicit fallbacks, noindex boundaries and reciprocal hreflang. Validate live routing, caches, exports and the exact deployed revision after release; local tests alone do not establish production parity.

The current repository freeze runs through at least 10 October 2026 and distinguishes maintenance from new free-app expansion. The immediate correctness/privacy/translation repairs fit maintenance; schedule new French/Swahili catalog expansion through the programme's explicit scope review. This review and plan do not require a deployment decision.

**6. Definition of “on par at the highest level”**

| Dimension | Acceptance gate |
|---|---|
| Task completion | Same supported task outcomes, fields, options, validation, recovery, persistence and export capabilities as the reviewed English owner; omissions explicitly tracked. |
| Calculations | Identical numeric results for identical jurisdiction, source version, units and inputs; localized formatting may differ. Protect rates, identifiers, signs, decimal parsing and currencies. |
| Language | Native-editor review in context; no critical/major meaning errors; approved terminology and orthography; user-authored text preserved. |
| Dynamic states | Loading, empty, invalid, error, stale, fallback and offline messages are understandable and localized; no raw internal jargon. |
| Output | Open and parse every supported changed export; check labels, totals, fonts, diacritics, reading order, page breaks and editable round trips. A successful download alone is insufficient. |
| Privacy | Local-first and consent behaviour at least as strong as the reviewed English workflow; sensitive values absent from analytics/logs/URLs except a clearly explained, explicit share choice. |
| Accessibility and layout | Keyboard/focus/status behaviour, localized accessible names, meaningful language markup, 320/390/768/desktop reflow, text zoom and light/dark checks. Include manual assistive-technology review, not only automated scans. |
| Discovery and SEO | Search/switcher opens the correct counterpart; honest fallback; route/canonical/hreflang/sitemap consistency; localized titles/descriptions and schema-visible copy. |
| Delivery quality | Measured load/runtime cost on representative constrained mobile conditions, no new blocking console failures, useful static HTML, and smoke checks with production caching. |
| Evidence | Exact source revision and route-specific evidence, named reviewer and current status; failed or missing gates cannot be averaged away by high page counts. |

Suggested usability validation: recruit representative native-speaking users for the highest-value tasks in each language, observe where they need English or assistance, then repeat after fixes. Establish completion and comprehension targets from that baseline rather than inventing a current score. For changed high-risk flows, require zero unresolved correctness/privacy blockers before acceptance.

The localization scope follows [W3C's distinction between translation and adaptation of formats, culture and product behaviour](https://www.w3.org/International/questions/qa-i18n). Language markup and accessible names should be assessed using [W3C's language-of-parts guidance](https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html). Reciprocal language destinations should follow [Google's localized-version guidance](https://developers.google.com/search/docs/specialty/international/localized-versions). These references support the proposed gates; they do not certify the current app.

**7. Implementation owners and first reviewable batches**

| Batch | Primary source owners | Proof required |
|---|---|---|
| Hausa invoice correctness/privacy | `ha/kayan-aiki/kirkiro-invoice/index.html`, its app/runtime owner; compare `tools/invoice-generator/index.html` and `assets/js/pages/invoice-generator-enhancements.js` | Rate preservation, explicit data sharing, review/export and JSON round trips. |
| Hausa CV correctness then full workflow | `ha/kayan-aiki/gina-cv/index.html`; reusable `tools/cv-builder/` runtime; establish Hausa generator ownership for the expanded workflow | Exact names, validation, templates, local save/import and parsed exports. |
| French document language | `data/localization/fr-document-pdf-lexicon.json`, `fr-document-pdf-lexicon-overrides.json`, `scripts/build-french-document-pdf-parity.js`, `scripts/build-french-cv-runtime.js` | Invoice vocabulary/codes and hydrated CV/template/export language. |
| Swahili document language | `data/localization/sw-document-pdf-lexicon.json`, `scripts/build-swahili-document-pdf-parity.js`, relevant CV runtime/template owners | No mixed ordinary controls; contextual review of template names, help and output. |
| Shared shell/editorial | `lang/{locale}.json`, existing product glossaries, `assets/js/components/navbar.js`, `footer.js`, `scripts/build-swahili-product-surface.js`, `scripts/lib/swahili-category-directory.js` | Localized accessible names, correct fallback labels, consistent terms and narrow regeneration. |
| Evidence and discovery | Existing FR/SW inventory builders/acceptance files, `scripts/lib/localization-platform.js`, Hausa coverage/launch builders, `scripts/build-localized-non-app-parity.js` | Current revision receipts; honest partial-workflow states; counters reconciled by identity. |

Use one integration owner and small isolated implementation batches if the work is later divided among people or agents. Engineering owns workflow/source changes, language editors own meaning and terminology, QA owns reproducible browser/export evidence, and the publisher owns release proof. This review did not create other chats or delegate implementation.

Do not promise a completion date for every Hausa app from the route count alone. Measure the first two repair/editorial batches, separate unique workflows from repeated country templates, then forecast throughput with actual review capacity. The first deliverable should be a verified invoice/CV batch and a current acceptance ledger, not another platform-wide translation count.

**8. Verification receipt and limits**

| Check run | Result |
|---|---|
| `node scripts/build-localization-platform.js --check` | PASS: 11,695 route records; catalogs/coverage internally consistent. |
| `node tests/localization-runtime.test.js` and `node tests/localization-platform.test.js` | PASS. |
| French and Swahili free-app inventory tests | PASS: 1,256 recorded accepted mappings in each. |
| FR/SW inventory builders with `--check` | FAIL: three stale English display-name fields in each committed report; fresh totals unchanged. |
| `node scripts/report-hausa-coverage.js` | PASS: 106 routes, 23 native, 58 shells, 25 fallbacks. |
| `node scripts/report-hausa-launch-readiness.js` | FAIL: stale generated counts; freshly evaluated gates true. Its stored historical browser flag does not replace current workflow tests. |
| French, Swahili and Hausa product-surface static tests | PASS. |
| `node scripts/validate-hreflang.js` | PASS: 26,204 relationships across 4,253 equivalence groups. |
| `node scripts/audit-french-visible-mojibake.js` | PASS: 2,187 indexable files; 3,895 HTML files scanned. This checks encoding, not semantic quality. |
| Hausa visible-copy audit, read-only `buildReport()` | Zero definite English blockers; 151 possible false positives. It does not detect the demonstrated runtime/name or workflow gaps. |
| `node scripts/build-localized-non-app-parity.js --check` | PASS for report consistency; the 303/327 missing counterparts remain. |
| Three existing product-surface browser suites | Initial result: 24 passed, 4 failed. Swahili consent failed because this run preset declined analytics; an isolated run without that preset passed. Final distinct result: **25 pass, 3 French failures**. French: 4/7; Hausa: 9/9; Swahili: 12/12 after correction. |
| Direct comparative browser sampling | Twelve home/CV/invoice route loads at 390px: HTTP 200, no page-width overflow or captured uncaught page errors. This does not cover every state, console resource warning, viewport or route. |
| Targeted live checks | Confirmed the specified French/Swahili visible-copy defects and Hausa CV `undefined`; no full production certification. |

Dependencies were installed with `npm ci --no-audit --no-fund`. The supplied worktree was initially sparse; it was expanded to inspect the actual localized pages. No tracked product changes resulted. Temporary scripts, logs and screenshots are in `output/playwright/localization-review-2026-10-05/`; the durable evidence summary and full route matrix accompany this report.

Not run: every app-specific suite; all export formats; complete native-language review; full link/SEO/build/security/dist release stack; real account/payment/provider/Supabase checks; every live route. Those remain explicit acceptance work. The changes delivered here are review artifacts only.

**Recommended starting point:** complete L01–L06 as small, source-owned repair batches while introducing current, route-specific acceptance evidence. Then use that proven process for Hausa expansion and the remaining French/Swahili editorial and whole-app gaps.
