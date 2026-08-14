# French Finance, Tax & Market Data 133-app acceptance

This receipt extends the frozen 132-app Finance, Tax & Market Data evidence with one native French PAYE authority workflow.

## Evidence boundary

- The previously accepted 132 apps remain covered by `reports/french-finance-tax-market-data-evidence.json` and `reports/french-finance-tax-market-data-browser-evidence.json`.
- App 133 is `/tools/paye-authority-finder/`, owned in French by `/fr/tools/trouver-administration-paye/`.
- The French route uses the shared deterministic engine and `/data/salary-tax/authority-router.json`; it does not embed, fetch, or hand off to the English surface for its primary workflow.
- Static contract: `node tests/gsc-demand-capture-products.test.js`.
- Mobile browser contract: `playwright test tests/e2e/gsc-demand-capture-products.spec.js --project=chromium --workers=1`.

## Safety boundary

- The workflow routes users to the canonical country calculator and official authority source; it does not duplicate tax bands or calculate PAYE.
- Authority search stays in the browser and does not collect or persist personal data.
- The canonical, hreflang, source/freshness, mobile overflow, ambiguous-acronym, and destination-link contracts are fail-closed in the focused checks above.
