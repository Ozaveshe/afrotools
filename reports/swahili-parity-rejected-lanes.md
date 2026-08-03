# Swahili Parity Rejected Lanes

Reviewed: 2026-07-31

This register prevents a technically green replacement surface from being credited as product parity. Rejected commits remain preserved for review but are not eligible for the acceptance ledger or coordinated release.

## Consumer and culture — rejected

- Branch: `codex/sw-consumer-culture-parity-20260731`
- Commit: `6fc11ac8`
- Claimed scope: 107 apps across Telecom, Security, Career, Diaspora, Religious & Cultural, Sports, Travel and Uniquely African.
- Coordinator credit: 0/107.

Reasons:

1. The implementation replaces distinct app workflows with seven generic workflow kinds and one generic calculation engine.
2. Browser proof exercises the replacement form, generic result, and newly added JSON/TXT exports; it does not prove parity with each English app's original formula, source data, output model, or advertised exports.
3. A single generic calculator fixture is used to credit materially different products such as Lobola, telecom pricing, religious calculations, travel planning, security checks and sports tools.
4. Seventy-two acceptance entries are therefore unsupported by route-specific product oracles even though the replacement pages render and the generic exports reopen.
5. The remaining 35 routes are correctly marked blocked, but their implementation cannot be reused as product proof.

Required redo:

- Split the 107 rows into coherent app families with their original English engine or data owner.
- Preserve app-specific inputs, formulas, validation, results, sources and exports.
- Add route-specific or family-specific deterministic oracles before browser acceptance.
- Treat artwork, metadata, reflow and generic export proof as supporting evidence, not product-correctness proof.

## PAYE report-language lane — implementation retained, acceptance blocked

- Branch: `codex/sw-paye-reports-20260731`
- Commit: `aad6a0a2`
- Claimed workflow scope: 26 country PAYE report/export routes.
- Coordinator credit: 0/26 full apps; the report/export improvement is retained.

Reasons:

1. All 26 report actions produce substantive Swahili output and real locally rendered PDFs that reopen through `pdf-parse`.
2. Formula-function hashes remain frozen and the app workflows retain their country-specific engines.
3. Several complete page owners still declare `afrotools-language-fallback=en` or contain explicitly marked English reference copy.
4. Report-language correctness is therefore not evidence that the whole app has reached native Swahili parity.

Required redo:

- Translate and review every remaining explicitly marked English UI, reference, source and limitation string.
- Remove the English-fallback declaration only after the full owner passes the runtime-residue test.
- Rerun the existing 26-route calculation, AI-consent, PDF parse, mobile, theme and accessibility suite.

## Finance, HR and Personal Finance lane — implementation retained, acceptance blocked

- Branch: `codex/sw-finance-remainder-20260731`
- Checkpoint: `e9da8a69`
- Claimed scope: 112 apps.
- Coordinator credit: 0/112 pending exact product oracles.

Reasons:

1. The 112 routes render as Swahili owners and the parity harness proves metadata, mobile reflow, themes, keyboard focus and a newly injected local JSON assurance export.
2. The browser suite does not enter each original app's real valid and invalid inputs or assert its expected computed outputs.
3. Shared-script presence and currency-token overlap are weaker than formula or data-owner parity.
4. A generic JSON export cannot replace proof for each format advertised by the English owner.
5. A conservative visible-text scan found substantial English residue on 66/112 owners; the generator uses a short lexical replacement dictionary rather than reviewed native translations.
6. `fuel-tracker` is a product replacement: the English app uses `fuel-tracker-engine.js` and `fuel-tracker-vip.js`, while the Swahili route executes a generic `swtCalc('fuelTracker')` branch.
7. Ten calculation-bearing pages duplicate inline English logic instead of sharing a DOM-free engine. Seventeen PAYE rows also lack an exact shared page or engine owner.
8. `payslip-generator` is the nearest candidate, but its dedicated Swahili test is red because the current page loads `lazy-analytics.js` despite the privacy contract.

Required redo:

- Partition the 112 rows by real engine/controller owner.
- Add deterministic valid, invalid and expected-output fixtures per route or genuinely shared formula family.
- Produce and parse/reopen every original advertised export format.
- Keep rows blocked until their own product contract passes, even after reciprocal hreflang is repaired.

## Health and Education lane — both categories blocked

- Branch: `codex/sw-health-education-parity-20260731`
- Commit: `f8ac6e51`
- Scope: 42 Health and 42 Education apps.
- Coordinator credit: Health 0/42; Education 0/42.

Review:

1. Health preserves the real English engines, but its owner-spec paths are labels rather than executed comparison suites. The browser proof accepts any non-empty changed result instead of an exact expected value.
2. Health invalid proof falls back to native HTML validity or a blanket medical warning. PDF proof checks only the signature and byte length, the private marker is actually entered on one of 42 routes, and optional AI consent is not exercised.
3. Independent samples expose English runtime residue in BMI, water-quality, water-intake, sickle-cell, diabetes-risk and blood-group outputs. Only 20/42 owners visibly disclose an explicit review date; a generic WHO panel is not per-app freshness proof.
4. Education currently proves that workflows render metrics and that generic local exports reopen, but exact expected product outputs are frozen for only a small subset.
5. Both categories remain blocked until every route has exact expected-result and invalid-state oracles, every original export is parsed or reopened, sensitive-route privacy markers and AI consent are exercised, runtime English is eliminated, and source/freshness plus reciprocal hreflang pass per app.

## Creative, Image Design and Developer Tools lane — rejected

- Branch: `codex/sw-creative-image-developer-parity-20260731`
- Reviewed checkpoint: `5726f202`
- Scope: 97 apps.
- Coordinator credit: 0/97.

Reasons:

1. The browser suite primarily checks an injected generic JSON receipt. Existing owners are not driven through representative inputs, exact expected outputs, invalid-state clearing or their original export actions.
2. Twenty-eight newly generated owners are semantic replacements. Background removal, favicon generation, certificates, creator workflows and royalty tools lose material inputs, processing behavior and output formats from their English products.
3. The Markdown editor translates the executable `input` event name to `ingizo`, breaking live preview.
4. Data Converter, Hash Generator, Base64 and Markdown Editor send user-entered or derived context to `ai-advisor` without the required explicit content-preview consent.
5. Image to Text lacks proof for its original TXT, Markdown, JSON and CSV outputs; Creator Invoice lacks parsed PDF proof; three capture/recording apps remain correctly codec-blocked.
6. Forty-three of 97 owners still need artwork, including 41 rows previously labelled accepted. Residual English runtime states and provider-freshness gaps also remain.

Required redo:

- Quarantine the generic replacement runtime and keep all 97 rows blocked.
- Split Developer utilities, Image workflows and deterministic Creator tools by their real English engine/controller owners.
- Require exact valid, invalid and expected-output oracles plus every original advertised export per app.
- Treat real-device capture/codec apps as a separate hardware proof lane.
