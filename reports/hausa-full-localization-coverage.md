# Hausa Full Localization Coverage Pass

Snapshot date: 2026-05-18

## Current State

- Public Hausa routes after this pass: 92.
- Hausa registry rows after this pass: 87.
- New core Hausa guide or shell pages in this pass: 20.
- Visible-copy policy: a route is only called Hausa when `/ha/` exists; complex English workflows are labeled with Hausa fallback language.

## New Core Routes Added

- `/ha/jamb/tattalin-arziki/` -> `/jamb/economics/`
- `/ha/jamb/gwamnati/` -> `/jamb/government/`
- `/ha/jamb/kasuwanci/` -> `/jamb/commerce/`
- `/ha/jamb/adabi/` -> `/jamb/literature/`
- `/ha/jamb/tarihi/` -> `/jamb/history/`
- `/ha/jamb/crk/` -> `/jamb/crk/`
- `/ha/kayan-aiki/gyara-pdf/` -> `/tools/pdf-editor/`
- `/ha/kayan-aiki/lambar-shafi-pdf/` -> `/tools/pdf-page-numbers/`
- `/ha/kayan-aiki/cgt-najeriya/` -> `/tools/ng-cgt/`
- `/ha/kayan-aiki/kalkuletan-paystack/` -> `/tools/paystack-calculator/`
- `/ha/kayan-aiki/tazarar-riba/` -> `/tools/profit-margin/`
- `/ha/kayan-aiki/dawo-da-jari/` -> `/tools/break-even/`
- `/ha/kayan-aiki/karin-farashi/` -> `/tools/markup-calc/`
- `/ha/kayan-aiki/takardar-albashi/` -> `/tools/payslip-generator/`
- `/ha/kayan-aiki/kudin-maikaci/` -> `/tools/staff-cost/`
- `/ha/kayan-aiki/gwajin-ussd/` -> `/tools/ussd-simulator/`
- `/ha/kayan-aiki/waya-ko-banki/` -> `/tools/mobile-vs-bank/`
- `/ha/kayan-aiki/kwatanta-aika-kudi/` -> `/tools/remittance-compare/`
- `/ha/noma/kalandar-shuka/` -> `/tools/planting-calendar/`
- `/ha/noma/hadarin-fari/` -> `/tools/drought-risk/`

## What This Pass Finishes

- The existing Hausa lane now has documented Hausa entry points for the main Nigeria-first clusters: PAYE, VAT, JAMB, PDF, telecom, business pricing, money movement, agriculture, health, language and documents.
- High-risk workflows such as PDF editing, Paystack fee checks, remittance comparison, CGT, payslip generation and USSD simulation are presented as Hausa guides or shells where the runtime remains on the English source page.
- New subject routes cover more JAMB demand without creating fake Hausa yearly archives.

## Remaining Full-Repo Gap

AfroTools still has many English registry-backed tools outside the Hausa lane. They should not be bulk-copied into `/ha/` without source review, route naming, registry ownership and visible-copy audit. The safe next step is category-by-category expansion, not raw page-pack generation.

## Validation Stack

```bash
node scripts/audit-hausa-visible-copy.js
npm run build:i18n:validate
npm run validate:hreflang
npm run audit
npm run seo:report
npm run check-links
git diff --check
```
