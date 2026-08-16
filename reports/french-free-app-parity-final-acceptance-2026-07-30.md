# French free-app parity final acceptance

Evidence date: 2026-07-30

## Verdict

- Accepted categories: **32/32**.
- Accepted canonical free apps: **1256/1256**.
- Native primary French owners: **1256/1256**.
- English iframe/transplant, bridge, alias-only and missing primary owners: **0**.

Acceptance is generated from the exact inventory owner for every English ID.
Every category below names its reviewed receipt, or its committed static and
browser contracts where the final receipt is the durable aggregation point.

## Category evidence

| Category | Apps | Durable evidence | Focused contracts |
|---|---:|---|---|
| Agriculture | 447 | `reports/fr-agriculture-parity-closeout-2026-07-28.md` | `node tests/fr-agriculture-parity-manifest.test.js` |
| Business & ROI | 12 | `reports/fr-business-roi-parity-evidence.json` | `node scripts/audit-fr-business-roi-parity.js`<br>`playwright test tests/e2e/fr-business-roi-parity.spec.js --project=chromium --workers=1` |
| Career & Development | 4 | `reports/fr-career-parity-evidence.json` | `node tests/career-planning-engine.test.js`<br>`playwright test tests/e2e/french-career-parity.spec.js --project=chromium --workers=1` |
| Climate & Environment | 13 | `reports/fr-climate-native-parity-evidence.md` | `node tests/fr-climate-parity.test.js`<br>`playwright test tests/e2e/fr-climate-native-parity.spec.js --project=chromium --workers=1` |
| Creative Economy | 46 | `reports/fr-creative-economy-parity-progress-2026-07-29.md` | `node tests/fr-creative-english-structural-parity.test.js`<br>`node scripts/run-fr-creative-proof.js` |
| Developer Tools | 32 | `reports/fr-developer-tools-parity-stop-receipt-2026-07-29.md` | `node scripts/build-french-developer-parity-manifest.js --check` |
| Diaspora | 2 | `reports/fr-diaspora-parity-evidence.json` | `node tests/fr-diaspora-parity.test.js`<br>`playwright test tests/e2e/fr-diaspora-parity.spec.js --project=chromium --workers=1` |
| Document & PDF | 32 | `reports/french-document-pdf-parity-evidence.json` | `node tests/french-document-pdf-parity.test.js`<br>`playwright test tests/e2e/french-document-pdf-parity.spec.js --project=chromium --workers=1` |
| Education | 42 | `reports/fr-education-parity-receipt.md` | `node scripts/audit-fr-education-parity.js`<br>`playwright test tests/e2e/fr-education-category-parity.spec.js --project=chromium --workers=1` |
| Energy & Utilities | 20 | `docs/audits/FRENCH-ENERGY-UTILITIES-PARITY-RECEIPT.md` | `node tests/french-energy-parity.test.js`<br>`playwright test tests/e2e/french-energy-parity.spec.js --project=chromium --workers=1` |
| Engineering & Construction | 26 | `reports/fr-engineering-construction-parity-manifest.json` | `node scripts/build-french-engineering-parity.js --check`<br>`playwright test tests/e2e/french-engineering-functional-parity.spec.js --project=chromium --workers=1` |
| Finance, Tax & Market Data | 132 | `reports/french-finance-tax-market-data-133-acceptance.md` | `node tests/french-finance-parity.test.js`<br>`node tests/gsc-demand-capture-products.test.js`<br>`playwright test tests/e2e/french-finance-native-parity.spec.js --project=chromium --workers=1`<br>`playwright test tests/e2e/gsc-demand-capture-products.spec.js --project=chromium --workers=1` |
| Fintech & Banking | 31 | `reports/french-fintech-banking-parity-evidence.json` | `node scripts/capture-french-fintech-english-baseline.js --check` |
| Government & Civic | 15 | `reports/french-government-mining-parity-evidence-2026-07-30.md` | `node tests/fr-government-parity.test.js`<br>`playwright test tests/e2e/fr-government-parity.spec.js --project=chromium --workers=1` |
| Health & Wellness | 42 | `docs/audits/FRENCH-HEALTH-WAVE3-PARITY-RECEIPT.md` | `node tests/french-health-parity.test.js`<br>`playwright test tests/e2e/french-health-parity.spec.js --project=chromium --workers=1` |
| HR & Payroll | 6 | `reports/french-hr-payroll-parity-evidence.md` | `node tests/fr-hr-payroll-parity.test.js`<br>`playwright test tests/e2e/fr-hr-payroll-parity.spec.js --project=chromium --workers=1` |
| Image & Design | 19 | `docs/audits/FRENCH-WAVE2-IMAGE-DESIGN-VIP-RECEIPT.md` | `playwright test tests/e2e/french-image-design-wave2.spec.js --project=chromium --workers=1` |
| Insurance | 16 | `docs/audits/FRENCH-INSURANCE-16-APP-PARITY-EVIDENCE.md` | `node tests/french-insurance-parity.test.js`<br>`playwright test tests/e2e/french-insurance-parity.spec.js --project=chromium --workers=1` |
| Language & Translation | 11 | `docs/audits/FRENCH-WAVE2-LANGUAGE-TRANSLATION-RECEIPT.md` | `node tests/french-language-wave2.test.js`<br>`playwright test tests/e2e/french-language-wave2.spec.js --project=chromium --workers=1` |
| Mining & Extractives | 6 | `reports/french-government-mining-parity-evidence-2026-07-30.md` | `node --test tests/fr-mining-parity.test.js`<br>`playwright test tests/e2e/fr-mining-parity.spec.js --project=chromium --workers=1` |
| Mortgage & Property | 66 | `reports/french-mortgage-property-evidence.json` | `node tests/french-mortgage-property-parity.test.js`<br>`playwright test tests/e2e/french-mortgage-property-parity.spec.js --project=chromium --workers=1` |
| Personal Finance | 5 | `artifacts/french-personal-finance-parity/README.md` | `node tests/french-personal-finance-parity.test.js`<br>`playwright test tests/e2e/french-personal-finance-parity.spec.js --project=chromium --workers=1` |
| Religious & Cultural | 22 | `docs/audits/FRENCH-RELIGIOUS-CULTURAL-22-PARITY-RECEIPT.md` | `node tests/french-religious-cultural-parity.test.js`<br>`playwright test tests/e2e/french-religious-cultural-parity.spec.js --project=chromium --workers=1` |
| Security & Safety | 7 | `reports/french-security-parity-repair-evidence.md` | `node tests/french-security-parity.test.js`<br>`node tests/french-security-browser-check.js` |
| Small Business & SME | 28 | `reports/fr-small-business-parity-receipt.md` | `node tests/fr-small-business-engine-parity.test.js`<br>`playwright test tests/e2e/fr-small-business-parity.spec.js --project=chromium --workers=1` |
| Sports & Entertainment | 15 | This final receipt | `node tests/french-sports-parity.test.js`<br>`playwright test tests/e2e/french-sports-parity.spec.js --project=chromium --workers=1` |
| Telecom & Mobile | 14 | This final receipt | `node tests/french-telecom-parity.test.js`<br>`playwright test tests/e2e/french-telecom-parity.spec.js --project=chromium --workers=1` |
| Trade & Import | 22 | `reports/french-trade-import-parity-evidence.md` | `node scripts/audit-fr-trade-parity.js`<br>`playwright test tests/e2e/fr-trade-import-parity.spec.js --project=chromium --workers=1` |
| Transport & Logistics | 18 | This final receipt | `node tests/french-transport-parity.test.js`<br>`playwright test tests/e2e/french-transport-parity.spec.js --project=chromium --workers=1` |
| Travel & Tourism | 9 | `docs/audits/FRENCH-TRAVEL-PARITY-9-APP-RECEIPT.md` | `node tests/french-travel-parity.test.js`<br>`playwright test tests/e2e/french-travel-parity.spec.js --project=chromium --workers=1` |
| Uniquely African | 33 | `reports/fr-uniquely-african-parity/acceptance-receipt.json` | `node scripts/validate-fr-uniquely-african.js`<br>`playwright test tests/e2e/fr-uniquely-african-parity.spec.js --project=chromium --workers=1` |
| VAT & Business Tax | 63 | `docs/audits/FRENCH-WAVE2-VAT-BUSINESS-TAX-PARITY-RECEIPT.md` | `node scripts/verify-french-vat-business-tax-wave2.js` |

## Generated ownership

- Category evidence source: `data/audits/french-free-app-category-acceptance.json`.
- App acceptance registry: `data/audits/french-free-app-acceptance.json`.
- Full owner inventory: `reports/french-free-app-parity-inventory.json`.
- Generator: `scripts/build-french-free-app-acceptance.js`.

The generator fails closed on a changed denominator, a non-native primary
owner, a category-count mismatch, duplicate or missing category evidence,
a missing receipt, or a missing referenced test/script file.

This receipt is repository acceptance evidence. Production deploy and live
route proof remain separate release layers.
