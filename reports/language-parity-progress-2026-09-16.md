# English, French and Swahili parity — active review

Base: 6183e6395a8168a55fdb1c1591113c368179edac. This review does not inherit a blanket pass from historical acceptance.

## Scope and denominator

Fresh inventory builders map 1,256 free English apps to French and Swahili. The seven review dimensions are design, usability, functionality, independent correctness, calculation/state logic, feature completeness and exports. PDF structural validity, parsed content, operation semantics and rendered layout are separate checks. Existing acceptance remains historical evidence; it is neither erased nor promoted automatically.

## Confirmed work

### Minimum-wage CSV

Commit 23d738c2 preserves fractional local amounts instead of rounding them to whole units; escapes multiline CSV fields; and supplies Swahili headings/missing-value labels on the Swahili page. English keeps its headings; source dates, laws and values are unchanged. The legacy page builder and current page receive the same targeted call change; a pre-existing malformed string in that builder is corrected. Full legacy page regeneration was not used because this patch must preserve later page changes. The engine output was generated with its minification owner.

Validation passed: two focused CSV tests, existing South Africa source-contract test, actual Swahili browser workflow with reopened CSV and 54 country rows, generator syntax, i18n dictionaries, hreflang and diff checks. Synthetic tests verify fractional values and quoted multiline fields independently. Browser data comparison checks export fidelity, not current legal correctness. This is a scoped export improvement, not full minimum-wage app parity.

## Confirmed gaps under active investigation

- French invoice-generator lacks several EN/SW capabilities: document type/payment-method controls, saved items/invoices, print, JSON backup/import and reminders.
- Freelance invoice generic change handling rebuilds line-item controls during focus changes, causing intended edits to miss their target across all three languages.
- CV ATS PDF export strips accents/non-ASCII text. A candidate repair is undergoing review; full Unicode PDF support remains a requirement, not replaced by a narrower safe fallback.
- French document export receipts can report fixture recovery without an expected-content assertion. A semantic export test repair is in progress.
- Swahili minimum-wage historical receipt claimed reopened CSV, while its former test checked only the filename. The new test now reopens contents; other app claims still need route-specific review.

## Delivery state

This resumed phase has not been deployed. Broad app parity remains unproven. No claim that all 1,256 apps were freshly tested, that English is inherently correct, or that historical acceptance establishes every dimension.

## Static capability discovery

`node scripts/audit-language-capabilities.js --output=<evidence-json-path>` reads fresh route inventories and parses all three locales with an inert browser DOM parser. It does not execute page scripts, and browser network access is blocked. `--ids=invoice-generator,pdf-merge-split` narrows discovery to named apps. Output records file hashes, static controls/scripts and ID differences; every row remains `requires-workflow-review`. Runtime-generated controls, different IDs for equivalent features, and shared app launchers require further inspection.

The initial run inspected all 1,256 apps. It corroborated the French invoice control gaps, while PDF merge/split and CV builder had matching static control IDs. Neither matching IDs nor differences prove functional parity or failure. The complete private evidence file is `language-capabilities-static.json`; page hashes bind it to the inspected files.

## Integrated document wave

- `fd44e743`: PDF evidence now distinguishes structural validity, parsed text and operation semantics. Coordinator passed merge/split page identity/order, actual reverse order, full-page redaction and evidence-negative checks.
- `47e7a72a`: freelance invoice field changes preserve line-item DOM and focus. Coordinator passed all three locales with independently calculated totals, save/reload/import and parsed PDF/DOC/TXT/CSV/JSON output. These tests do not prove mobile pointer behavior; a separate Swahili stylesheet movement defect is being repaired.
- Combined coordinator run: seven browser tests passed. Fresh partial receipts were saved outside the repository; historical full-category receipts were restored instead of replacing them with a partial run.
- `d2f26129` and `50bc82d7`: CV/cover-letter local embedded-font work integrated. Eleven coordinator parser/font-provenance tests passed. Eight browser checks are running. Native CV headings, status text and asynchronous state-change behavior remain under active follow-up.

Static capability baseline: 1,256 apps inspected in all three locales. Raw ID differences are discovery signals; they do not establish missing features without workflow review. French minimum-wage and overtime use materially different forms from English and need capability/correctness review, not an automatic transplant of English assumptions.

Coordinator career browser run completed: all eight checks passed together in the integrated tree. Scope remains the tested exports, mobile overflow, unsupported-character failure and cover-letter stale-draft guard; additional native CV/state work is still pending.

### Swahili pointer stability

`9be29016` keeps the active accessibility stylesheet attached while placing later style owners before it. Coordinator syntax/diff checks and all 11 browser tests passed: three locale invoice workflows with real pointer interactions, plus both Swahili invoice apps at 320/390px in light/dark themes. Tests verify that the stylesheet is not removed, its sheet identity is retained, pointer geometry remains stable and the clicked action actually changes app state. These checks address the reproduced defect; they are not universal document-category visual acceptance.

User scope clarification: finish the 1,256 free apps first, then assess Pro separately. Do not expand the current repair wave into paid Pro implementation. Preserve the broader follow-up assessment after free-app evidence is complete.

### Next financial capability review

Source inspection found the English overtime TOIL comparison computes cash and time-off value from algebraically equivalent expressions, then uses strict floating-point greater-than to choose a negotiation verdict. It also hardcodes an eight-hour day. Review this shared EN/SW calculation/display against explicit working-day assumptions and add independent boundary fixtures before promoting the comparison into French. French currently lacks the TOIL controls; copying the English comparison unchanged would import its limitations. No statutory-rate claim or rate update is made by this finding.

### Overtime comparison correction

The shared HR engine now returns a planning-only time-off equivalent using the recorded daily hours, or a disclosed eight-hour fallback. EN/SW show that equivalent directly, avoiding a false cash-advantage verdict from floating-point rounding. French includes equivalent hours/days and the actual multiplier/day assumption in results and exports. Cash-pay formulas and recorded legal rates are unchanged; availability/conversion must still be confirmed separately.

Passed: three independent engine/owner tests, existing payroll checks, French HR contract, i18n/hreflang and all three locale browser cases (EN/SW initial run; FR corrected and rerun). The first FR export check caught an omitted nonnumeric assumption in the generic export collector; the final comparison explicitly includes its numerical multiplier and the downloaded TXT retains the full assumption. This does not prove all generic exports retain every nonnumeric caveat. Country-name localization and the overtime dispute-letter workflow remain outside this scoped comparison repair.

### Second integrated repair wave

- Career commits ef95f4de/74f07552 preserve edited ATS text in TXT/PDF, localize native headings/status and cancel stale asynchronous exports. Fourteen parser/source tests passed. Coordinator browser run passed16of18; EN/FR edited-text cases timed out on pointer interaction near final empty-input feedback. This is unresolved pointer usability evidence, not proof of export corruption; keyboard-specific regression refinement is pending. No universal CV/template acceptance.
- Document commits e2193204/e8d88c28 validate imported backups before replacing drafts and repair the French receipt fixed-discount machine value. Current coordinator validation is running; agent9state+9export cases passed, with independently expected receipt totals267percentage versus282fixed. Receipt raster-PDF content fidelity remains under separate rendered review.
- Invoice commits9e7db5f8/d5326055 localize freelance output labels, retain unit-rate precision and escape billing details in invoice previews. Current coordinator combined workflow validation is running. French main invoice capability migration remains separate and pending.

This wave is committed locally and has not been deployed. Free apps remain first; Pro assessment follows later.

Coordinator second-wave validation completed: all23 combined document/invoice browser checks passed (18document +3freelance +2inert-preview), i18n/hreflang passed, diff check passed. Career run remains16/18 pending two pointer-feedback retests;14node tests passed. Private1,256-row matrix now includes scoped review notes without upgrading full-dimension verdicts.

### Calendar export gap under repair

The French generic finance calendar exporter used a hardcoded2026-07-01 date when no date input existed. The leave route advertisesICS but has no parental-planning date fields; the DCA route also needs workflow-specific schedule review. The exporter now rejects missing, ambiguous or impossible dates instead of inventing one. Three focused date tests pass, including leap-day preservation. This is an interim integrity repair, not calendar feature parity: restoring the real French leave planner and DCA schedule semantics remains required. English parental planning also needs review of inclusive/end dates and paternity working-day assumptions before reuse.

### Explicit French leave calendar workflow

Added source-owned French leave planner controls with user-confirmed duration, start date, leave type and calendar/Monday–Friday counting. Shared pure date helper records last included leave date, exclusive calendar end and return date, emits two localized events with identities/timestamps and UTF-8 line folding. It does not infer statutory entitlement; assumptions are visible. Modified dates invalidate the prepared download. Removed duplicate generic leave ICS button; dedicated planner owns actual scheduling.

Validation:7date/export unit tests and390px browser download/reopen/stale-state check PASS. Firstbrowserrun exposed generic export interception; dedicated planner now bypasses that summary interceptor, rerunPASS. Parental due-date workflow, variable work weeks/holidays UI, EN/SW scheduling repair and DCA recurring schedule remain open; this is not fullleave-app parity. Calendar serialization reference: https://www.rfc-editor.org/rfc/rfc5545 (event end is exclusive).

### Invoice and receipt integration checks

All9current invoice-generator browser cases passed in the coordinator workspace (including EN/FR/SW migration workflows), alongside the earlier11DOCX/receipt/invoice-word checks and21CVtext cases. Security scan passed at1138b520. Receipt user-text/default patches integratedea4480d6/aad22be8; final6render plus3French invoice smoke checks are running. Release remains pending: French serialized-export wrapper can rewrite exact user dictionary words in backups, so invoice-only optout e3ac6c18 awaits collision-test evidence beforeintegration. This is an integrity fix, not broad template/currency acceptance.

### Backup integrity and styled-document follow-up

Final receipt6+Frenchinvoice3 checks passed. Invoice/freelance owner export optout56153e14 and global JSONbyte-preservation a6db8721 integrated, with collisiontest80fd930c;3JSONunit and2actualinvoicebackup browser tests PASS. Freelance import safety13efa91e integrated; actualmerge/prototype check and3browser importer checksPASS. StyledCV9ad638d8 passed5node tests; receiptTXT/nativecopy629ddb36 andinvoicePDFseparator4e894c8d integrated. Coordinator6styledCV/modernreceipt cases running.

A thermal/compact receipt-width regression introduced by the printable clone is being fixed before release. Fullbuild/releasechecks stillpending. Further CVJSONrestore/Pan-African Minimal, receiptremainingtemplates andlonginvoice checks remainseparate next-batch work; no broadappacceptance implied.

### Receipt template validation and release checks

Coordinator styled-CV/modern-receipt checks completed: all six passed. Receipt print-width fix aeff9008 restores thermal (308px and monospace), compact (360px), and tax (420px) dimensions; all 12 English/French/Swahili template export cases passed. The coordinator inspected the French thermal PDF visually. Numeric tokens, source-image coverage, native labels and exact user values passed; non-modern long receipts and selectable receipt PDF text remain outside this evidence.

The broad test run identified two release failures: protected minimum-wage artifact metadata differs after the CSV precision change, and three French invoice navigation links led to English destinations. Commit d5ba9aa4 repairs navigation through the existing source-owned helper; both navigation tests now pass. Formula metadata review and the remaining broad test/audit batch are still in progress. Nothing from this repair batch has been deployed. Free-app parity remains the active goal; Pro assessment follows it.

### Completed baseline release gates and additional integrity repairs

The broad run completed 1,081 test files with the two failures above and all seven audits passing. Both failed checks subsequently passed after the navigation repair and the narrow CSV-only formula review (1954ea17). The formula update changes only digest/version fields; it does not verify statutory wage sources or advance their verification date. The full build, build checks, artifact audit, lint, type checks and security scan passed for that baseline. All 12 receipt template cases also passed against its optimized deployment artifact. Generated refresh 23e8de9d contains 204 cache-only HTML changes, two invoice metadata/order updates, and three report updates; no files were deleted.

Subsequent inspection confirmed release-relevant defects, now repaired and integrated:

- Invoice payment truth (cabce9c5): selecting receipt, invoice or estimate preserves recorded payment and terms. A USD 100 document with USD 25 received continues to show USD 75 due. Currency changes preserve manually entered taxes and amounts. Recording or clearing full payment is explicit; preview and PDF status agree. No statutory rate changes.
- Invoice PDFs (2e0dc4a7, 9a27bf1b): long items, payment instructions and notes paginate; existing Noto fonts preserve extended Latin text, with retryable font loading and stale-export protection. Eight coordinator browser tests passed, including parsed long documents and exact Unicode values. The coordinator visually inspected the French PDF.
- Mobile CV sizing (ca50668e): phone-layout rules no longer shrink the hidden paper clone or its header. Six coordinator browser cases produced 12 one-page Lagos/Nairobi PDFs at 320px and 390px across EN/FR/SW; actual image dimensions and app overflow passed. The coordinator independently rendered and inspected the Swahili Nairobi PDF. These are sizing fixtures, not complete CV/template acceptance.
- French document metadata (1dba4e30): reviewed route-specific artwork is preserved before generic fallback; only breadcrumb parent URLs are localized. Two focused tests pass. Full regeneration and final artifact validation remain pending for this source change.

The combined payment and mobile-CV coordinator run passed all nine cases. A final full rebuild is running with these additions. No deployment has occurred for this repair batch. CV backup recovery, Pan-African Minimal and remaining template selection/field coverage, plus the EN/SW leave-calendar candidate, remain separate work toward the full free-app goal.

### Production-package checks and remaining release integration

The final full build passed, followed by build checks, artifact audit, security scan, lint and type checks. All 17 optimized-artifact invoice/payment/mobile-CV cases passed, plus all 12 receipt-template cases. These checks establish the repaired workflows above, not whole-app or whole-catalog acceptance.

Physical inspection found that the ordinary build did not invoke the French document generator, leaving 30 generated breadcrumb lists with English parent destinations. Commit f5fa6d8f moves the exact-route repair into the SEO step every build runs; ea987c10 regenerates those 30 pages. All 32 physical source artwork mappings and 31 existing breadcrumb lists pass, and a second SEO run produces zero changes. This was stale generated output, not a demonstrated later overwrite. Final rebuilt-artifact verification of this metadata change remains pending.

Remote main advanced to 06e37ce57a8f8d705e032bee47768a98aa73371c with education changes. A merge preview reports only two generated public-claims report conflicts, with no deletions. The full local test rerun is in its last batch with no failure reported yet. Integration, exact-commit CI, provider deployment and live verification remain pending; no deployment has occurred for this batch.

Full local rerun completed successfully: 1,082 test files and all seven audits passed. Test-generated Hausa audit-ledger churn was reviewed and restored; it is outside this repair batch.
