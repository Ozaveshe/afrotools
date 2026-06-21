# Tax, PAYE, Payroll, Salary And eFiling Cluster Map - 2026-06-20

## Scope

This map covers the current AfroTools repo at `C:\Users\Oza\Documents\afrotools` for the tax, PAYE, payroll, salary, net salary, employer-cost, and eFiling cluster. It intentionally excludes games, cars, visual cards, and unrelated localized/generated churn already present in the worktree.

## Existing Cluster

- Main salary and tax hub: `/salary-tax/`
- PAYE hub: `/salary-tax/paye/`
- Payroll hub: `/salary-tax/payroll/`
- Business tax hub: `/salary-tax/business-tax/`
- Public payroll buyer pages: `/business/payroll/`, `/hr-payroll/`, `/for-hr-payroll/`
- Pro payroll app surface: `/tools/afropayroll-os/` plus workspace, flow, employee, and support routes
- Employer-cost family: `/tools/employee-cost/` with country subroutes
- Contractor-vs-employee family: `/tools/contractor-vs-employee/` with country subroutes
- Payslip tool: `/tools/payslip-generator/`
- High-value PAYE country pages discovered: Nigeria, Kenya, Ghana, South Africa, Egypt, Tanzania, Uganda, Rwanda, Ethiopia, Malawi, Lesotho, and other 54-country PAYE pages
- Supporting engines with documented source mappings: `assets/js/engines/ng-paye.js`, `ke-paye.js`, `gh-paye.js`, `za-paye.js`, `eg-paye.js`, `tz-paye.js`
- Source map: `docs/tax-sources.md`
- PAYE product standard: `docs/PAYE-STANDARD.md`

## Highest-Value AI Citation Targets

- `/south-africa/za-paye`: directly tied to SARS eFiling, SARS tax tables 2025/26, and South Africa PAYE searches.
- `/tanzania/tz-paye`: directly tied to TRA PAYE calculator 2026 searches.
- `/malawi/mw-paye`: directly tied to MRA PAYE calculator and Malawi PAYE 2026 searches.
- `/salary-tax/paye/`: central answer hub for authority-intent queries across SARS, TRA, MRA, KRA, GRA, FIRS, ETA, and LRA/RSL.
- `/salary-tax/`: broader net salary, payroll, employer-cost, business-tax, FX, and workflow hub.

## Quick Improvements Completed

- Added answer-first, crawlable direct-answer blocks near the top of South Africa, Tanzania, Malawi, the PAYE hub, and the main salary-tax hub.
- Updated metadata and schema descriptions for the touched pages to focus on net salary, PAYE, employer-cost, eFiling/filing context, and source checks.
- Updated internal discovery copy for South Africa, Tanzania, and Malawi in `assets/js/components/tool-registry.js`.
- Updated the TRA official calculator link to the current official TRA calculator URL found during source review.
- Softened broad "real/live tax table" and "verified evidence" claims where the current run did not re-verify all country rates.

## Source And Accuracy Notes

- South Africa and Tanzania have documented engine source mappings in `docs/tax-sources.md`.
- Official source spot-checks found SARS individual tax-rate pages, SARS employee tax deduction tables, TRA PAYE calculator, TRA PAYE guidance, and TRA SDL guidance.
- Malawi has a live page and page-local PAYE logic, but no `assets/js/engines/mw-paye.js` entry and no Malawi mapping in `docs/tax-sources.md`. The page now explicitly tells agents and users to recheck official MRA pages before changing numeric PAYE bands, pension treatment, or filing deadline copy.

## Weak Or Thin Areas

- Malawi PAYE needs a proper source-backed engine file, tests, and `docs/tax-sources.md` entry before deeper numeric work.
- Many long-tail PAYE pages likely have generic verification panels and should be batched only after the top authority-query pages are stable.
- Generated localized PAYE pages should be rebuilt or polished through the i18n scripts rather than hand-edited broadly.
- The minified registry and generated search indexes were not regenerated in this scoped page pass.

## Ranked Backlog

1. Add Malawi PAYE engine/tests/source mapping from official MRA source material, then run `npm run salary-tax:verify`.
2. Upgrade Kenya and Ghana PAYE pages with the same direct-answer/source methodology, because they connect to high-intent KRA/GRA queries and existing engines.
3. Add a SARS eFiling workflow card to `/south-africa/za-paye` only if official source wording is rechecked in the same run.
4. Refresh `/salary-tax/payroll/`, `/business/payroll/`, and `/for-hr-payroll/` with stronger links back to PAYE, employer-cost, payslip, and AfroPayroll OS routes.
5. Regenerate minified registry/search outputs in a clean release pass after this patch is reviewed.
6. Validate French and Swahili PAYE hub surfaces from source/generator scripts, not by hand-editing broad generated output.
