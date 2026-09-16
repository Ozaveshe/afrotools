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
