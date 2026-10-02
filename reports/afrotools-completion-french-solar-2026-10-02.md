# French Solar completion candidate

Observed: 2026-10-02. Status: implemented, awaiting publisher integration and production proof. AfroTools completion remains uncertified and the goal is active.

The root picker and all 54 country pages now use French country names, action labels and status messages. Search accepts French accents and names while preserving English, country-code and slug lookup. Cards, keyboard continuation and downloaded brief links retain canonical French destinations. Calculation engines, source records, defaults and export payloads remain intact.

The live defect was observed at `2a96c978`: `Ouvrir Senegal Calculateur` and `Senegal selected - XOF`. The current publisher recovery `4f1eb4ec` is verified live through Netlify deploy `6abf441dd4a9040008566f0b` and the public release marker; it does not contain this new repair.

## Validation

- 12 focused Node tests pass after rebasing onto `4f1eb4ec`.
- Stable source browser and optimized-dist browser each pass all three widths: 1365, 390 and 320 pixels. All 54 picker destinations are covered; French search, labels, keyboard navigation, JSON route, overflow and uncaught errors are checked.
- Final `build:deploy`, `audit:dist`, `security:scan`, lint, type-check, `build:i18n:validate` and hreflang checks pass.
- The artifact predates rebase; inspected changes between `2a96` and `4f1e` do not affect French Solar, its engines/data or shared browser assets. It is local workflow proof. Publisher release artifact and hosted candidate CI remain pending.
- Preliminary browser evidence that overlapped generation is excluded from acceptance; corrected fixture failures are preserved in ignored evidence.

## Pending acceptance

Publisher source review, integration, regeneration and exact-SHA production root/country workflow checks remain required. Earlier production early-input and skipped-transition observations stay open; this patch does not establish their causes. Native-language review of assumptions, results and planning-brief/export content remains pending. This evidence does not certify any complete app, Pro, account, SEO, data-freshness or whole-language workflow.

Source owners: `scripts/lib/french-solar-country-picker.js`, `scripts/repair-fr-solar-country-pages.js` and `scripts/build-french-energy-parity.js`. Detailed evidence and limits are in the matching JSON report; local logs are under `artifacts/completion-fr-runtime-20261002/`. No live mutations were performed.
