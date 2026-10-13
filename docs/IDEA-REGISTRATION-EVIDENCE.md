# Idea Board registration references

The country registration references are separate from the generated business ideas and all startup, revenue, operating-cost and break-even estimates. They do not establish a suitable entity type, eligibility, profitability or a complete startup budget.

Maintained source: data/ideas/registration-evidence.json. The Idea Evidence Explorer engine validates exact country, currency, claim type, HTTPS official domain, dates, review cadence, source locator and three public-language labels. The detail dialog loads the same-origin ledger only after Inspect evidence. No idea name, filters, shortlist or personal data are sent in that request. No Supabase schema/data change is required.

The first batch contains two business-name registration fee lines: Kenya BRS KES 950 and Nigeria CAC NGN 20000 for registration with certified copies. Kenya private-company fees and Nigeria name reservation are deliberately withheld because official pages disagree. The ledger records that unresolved evidence rather than selecting an arbitrary value.

Source observed and claim checked dates are 2026-10-13. These are review dates, not publication or commencement dates. BRS does not state a document date on the reviewed fee page. CAC's PDF ends with a 2024-10-31 dateline; the May-2025 filename and June-2025 URL are not substituted for it. Neither claim asserts an effective-from date.

Amounts are withheld after 30 days from the claim review; source links and original dates remain so users can inspect the official source. Invalid, missing, future-dated and wrongly scoped claims fail closed. Fetch failures leave the idea workflow usable. Refresh requires a new primary-source review of the specific line, resolving conflicting official evidence, updating the genuine observed/review dates and reviewing the exact diff. A successful request or source hash change alone is insufficient.

Shortlist backups and exports retain their existing generated-origin and missing-source disclosures. National references shown in the detail dialog are not attached to exported idea estimates or recorded as idea provenance. All 10116 live ideas were seed examples in the separate read-only aggregate of 2026-10-13; none is upgraded by this feature. Reviewed field-level financial evidence and protected publisher imports remain outstanding.

Validation: node --test tests/idea-registration-evidence.test.js and Playwright tests/e2e/idea-registration-evidence.spec.js, plus existing Idea Evidence Explorer regression checks. Publisher imports maintained source only and regenerates its artifact; final exact-commit CI and deployment proofs are separate gates.
