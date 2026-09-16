# Leave workflow parity — bounded evidence, 2026-09-16

## Implemented planning capabilities

EN/SW retain all six views. Exact parental durations, inclusive last dates, exclusive ICS ends, nonzero return events, seven-day alarms, stale-result invalidation and UTC holiday/anniversary arithmetic are tested. Swahili now has active-summary copy/TXT, rather than only a proof-panel copy.

French retains its native entitlement/remaining-days form, save/reset/clear and reports. Five supplemental workflows add real accrual inputs/request comparison; salary/unused-days valuation; country/type/due-date parental planning with ICS; country/year holiday bridge planning and explicit WhatsApp actions; and a sortable 54-country comparison table. Existing employer-confirmed free-duration planner remains a separate coordinator-owned capability; this branch does not replace its file.

## Sources and ownership

- EN inline leave data: tools/leave-calculator/index.html. SW and FR use data/hr/leave-entitlements.js and the HR engine. Neither source is established as current authoritative law by these changes.
- reports/leave-country-source-conflicts-2026-09-16.json records 35 country conflicts; null is absent data, not statutory zero. Do not unify by copying English values.
- scripts/build-leave-holiday-reference.js extracts the existing EN LC_HOLIDAYS snapshot; build:surfaces runs that owner. Generated assets/js/lib/leave-holiday-reference.js preserves all original dates/names. Dates are explicitly not reverified current official holidays.
- Maintained French native page loads assets/js/pages/french-leave-workflows.js. The French gap generator preserves this accepted native owner; it is not a generated gap handoff.
- Shared leave-calendar.js belongs to the coordinator; our untracked testing copy is not part of these commits.
- Native leave exporters replace the generic finance export interceptor for this exact app only. New export controls also use the existing noPdfGate owner marker.

## Evidence and limits

- EN/SW six-view test: actual active TXT, independent 182/365-year accrual fixture (12 days -> 5.9), keyboard tab activation, 390px no overflow, invalid input hides stale summary.
- America/New_York fixture: Jan 1 2026 remains Thursday; bridge Jan 2; anniversary accrual resets on Jan 1. No holiday law updates.
- French browser: same independent accrual, payout 2600*12/260*10=1200; selected Kenya synthetic three-day parental fixture Sep18->Sep22 inclusive, return Sep23, ICS end Sep23/return-event end Sep24, two events and seven-day reminder. No unrelated July2 summary event. Missing durations remain unknown in new planners/comparison.
- French original rights: Kenya annual21 less4taken yields17; save/reload, copy, actual CSV/TXT/JSON/PDF, reset and clear. These validate existing source behavior, not statutory correctness. Subsequent report repair uses existing Noto fonts; accented French labels and footer are parsed and visually reviewed.
- Mobile screenshot: ../leave-workflow-evidence/french-leave-mobile.png (synthetic inputs only).

## Remaining requirements (not accepted)

1. Resolve country rules using official current labour laws/gazettes, effective dates, populations, units and eligibility. Existing missing paternity values in legacy rights views must not imply verified zero. High-use source-reviewed country batches are next.
2. French report repair completed: dedicated assets/js/pages/french-leave-reports.js reuses existing Noto fonts, native heading/date/footer and source limitations. Parsed PDF and one-page visual artifact ../leave-workflow-evidence/french-leave-report-page-1.png verify the synthetic 21-minus-4 scenario. Shared PDF-template remains unchanged for other tools.
3. French report backup repair completed: schemaVersion/tool/inputs preserve country and numeric daysTaken. A visible JSON importer validates before mutating controls; unknown tools, unexpected keys, unsupported countries and invalid values are rejected. Browser proof reproduces 17 days after restore and preserves prior state/storage after rejection.
4. Full rendering/a11y/privacy/export coverage is not implied by these bounded browser checks. New French comparison has an accessible horizontal-scroll table; visual design is not identical to EN six-tab layout.
5. Existing original four-HR broad test failed on untouched overtime copy interception before reaching leave. This is not evidence of a new leave defect, nor a passing cross-HR regression.
6. Newly added French planning scenarios are transient; existing rights local-save behavior is preserved. EN/SW did not provide saving for those scenarios; no new persistence claim.

No live mutation, push or deployment. No whole-app acceptance ledger updated.

Follow-up validation: 1 pure backup validator test; French browser covers new workflows, original save/reload/CSV/TXT/JSON/accented PDF/reset/clear, backup validation and asynchronous PDF invalidation. Noto font binaries and leave-calendar.js are existing coordinator-owned dependencies, not duplicated in this candidate.
