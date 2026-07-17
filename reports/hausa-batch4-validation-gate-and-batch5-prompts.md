# Hausa Batch 4 Validation Gate And Batch 5 Prompt Pack

Generated: 2026-05-16

## Batch 4 Gate

- Hausa public route count: 59.
- Visible-copy blockers: 0.
- Hausa registry rows: 54.
- Registry missing page count from `npm run audit`: 0.
- Hreflang: 0 errors; 1 carried non-Hausa warning, `sw/blogu/index.html -> fr/blog/index.html`.
- Mobile audit: issue-bearing pages reduced from 1123 to 1105 after the Hausa lane collapse fix. The prior Hausa fixed-sidebar cluster dropped out. Remaining Hausa mobile flags are older shared patterns, not a new blocker.
- SEO report mode: 20 JSON-LD auto-fixes available, carried non-Hausa/global backlog; no missing canonical, title, description, or hreflang violation.

## Validation Evidence

- `node scripts/audit-hausa-visible-copy.js`: passed, 59 routes scanned, 0 blockers.
- `npm run build:i18n:validate`: passed for fr, sw, yo, ha.
- `npm run validate:hreflang`: exit 0, 1 non-Hausa warning.
- `npm run audit`: passed, missing page 0.
- `npm run seo:report`: exit 0, report-only JSON-LD backlog remains.
- `npm run pdf:verify`: passed.
- `npm run vat-business-tax:verify`: passed.
- `npm run salary-tax:verify`: passed.
- `npm run check-links`: passed, no broken internal links.

## Batch 5 Prompt Pack

### Prompt 1: Hausa 59-route validation gate

You are working in `C:\Users\Oza\Documents\afrotools`.

Task: Hausa 59-route validation gate after Batch 4.

Mode: review only. Do not edit files. Do not touch `dist/`.

Run `node scripts/audit-hausa-visible-copy.js`, `npm run build:i18n:validate`, `npm run validate:hreflang`, `npm run audit`, `npm run seo:report`, `npm run check-links` with a long timeout if feasible. Inspect `reports/hausa-visible-copy-ledger.md`, `reports/mobile-audit.md`, `docs/HAUSA-LOCALIZATION-STRATEGY.md`, `assets/js/components/tool-registry.js`, `assets/js/components/navbar.js`, and `assets/js/components/footer.js`.

Report final verdict: `INTERNAL_PREVIEW_READY`, `CLEANUP_STILL_REQUIRED`, or `NOT_READY`; separate direct Hausa blockers from carried non-Hausa debt.

### Prompt 2: Hausa remaining mobile layout pass

Task: Hausa mobile layout cleanup for remaining flagged routes.

Mode: focused implementation. Do not touch `dist/`. Preserve FR/SW/YO.

Read `reports/mobile-audit.md`, `ha/index.html`, `ha/harshe-da-fassara/index.html`, `ha/jamb/index.html`, `ha/assets/health-ha.css`, `assets/css/global.css`, and the seven Hausa routes flagged for sub-16 form controls.

Fix only real Hausa mobile risks: late collapse, cramped card grids, sub-44 tap targets, or inputs that can render below 16px. Do not redesign.

Validate with `node scripts/mobile-audit.js`, `node scripts/audit-hausa-visible-copy.js`, `npm run build:i18n:validate`, and `npm run seo:report`.

### Prompt 3: Hausa possible false-positive triage

Task: Hausa visible-copy possible false-positive triage.

Mode: review plus narrow implementation. Do not touch `dist/`.

Read `reports/hausa-visible-copy-ledger.md` and all routes still under `POSSIBLE_FALSE_POSITIVE`.

Reduce false positives only when the visible text is awkward or confusing. Keep accepted acronyms and brand names. Do not hide true English leakage with broad audit ignores.

Validate with `node scripts/audit-hausa-visible-copy.js`, `npm run build:i18n:validate`, and `npm run seo:report`.

### Prompt 4: Hausa JAMB CBT shell

Task: Create a Hausa route-visible shell for JAMB CBT without changing CBT logic.

Mode: implementation. Do not touch `dist/`.

Read `ha/jamb/index.html`, `jamb/cbt/index.html`, `assets/js/components/tool-registry.js`, and `docs/HAUSA-LOCALIZATION-STRATEGY.md`.

Create a Hausa route only if it can honestly wrap or link to the existing English CBT experience. Keep result logic, question data, timer behavior, and source truth unchanged. Label English-only flows clearly in Hausa.

Validate with `node scripts/audit-hausa-visible-copy.js`, `npm run build:i18n:validate`, `npm run validate:hreflang`, `npm run audit`, and `npm run seo:report`.

### Prompt 5: Hausa JAMB tutor shell

Task: Create a Hausa route-visible shell for the JAMB tutor experience.

Mode: implementation. Do not touch `dist/`.

Read `ha/jamb/index.html`, `jamb/tutor/index.html`, `assets/js/components/tool-registry.js`, and shared navbar/footer Hausa discovery labels.

Keep AI/tutor capability honest. Do not imply Hausa AI output if the underlying tutor remains English. Use Hausa instructions and clear fallback labels.

Validate with `node scripts/audit-hausa-visible-copy.js`, `npm run build:i18n:validate`, `npm run audit`, and `npm run seo:report`.

### Prompt 6: Hausa JAMB past questions index

Task: Create a Hausa navigation route for JAMB past questions.

Mode: implementation. Do not create yearly archives. Do not touch `dist/`.

Read `ha/jamb/index.html`, `jamb/past-questions/index.html`, and existing Hausa subject pages.

Build a Hausa index that routes to subject pages and honestly labels English archives. Preserve question data and source paths.

Validate with visible-copy audit, i18n validation, hreflang validation, audit, and SEO report.

### Prompt 7: Hausa data plan compare route

Task: Hausa route-visible shell for data plan comparison.

Mode: implementation. Do not touch telecom source data or `dist/`.

Read `ha/sadarwa/index.html`, `telecom/data-plan-compare/index.html`, `ha/kayan-aiki/amfanin-bayanan-intanet/index.html`, and registry/navbar telecom rows.

Use Hausa labels for Nigerian networks, plan duration, price, and GB. If live plan data is not guaranteed, keep copy as estimate and ask users to confirm from operator apps or USSD.

Validate with visible-copy audit, i18n validation, hreflang validation, audit, SEO report, and check-links if feasible.

### Prompt 8: Hausa airtime value route

Task: Hausa route for airtime value and recharge planning.

Mode: implementation. Preserve telecom calculations. Do not touch `dist/`.

Read `telecom/airtime-value/index.html`, `ha/sadarwa/index.html`, and telecom registry rows.

Create a Hausa route only if the English source is mature. Keep MTN, Airtel, Glo, 9mobile, USSD, and Naira where natural.

Validate with visible-copy audit, i18n validation, hreflang, audit, and SEO report.

### Prompt 9: Hausa PDF convert shell

Task: Hausa route-visible shell for PDF conversion.

Mode: implementation. Preserve PDF workflow and download gates. Do not touch `dist/`.

Read `ha/takardu-da-pdf/index.html`, `tools/pdf-convert/index.html`, PDF category workflow docs, and PDF verifier scripts.

Keep local-processing and file safety language. If conversion UI remains English, label it as `Shafin Turanci` from the Hausa route.

Validate with `npm run pdf:verify`, visible-copy audit, i18n validation, audit, and SEO report.

### Prompt 10: Hausa PDF editor or signer candidate review

Task: Decide whether PDF editor or PDF sign should be next for Hausa.

Mode: discovery/report only. Do not edit files.

Read document/PDF registry rows, `tools/pdf-editor/index.html`, `tools/pdf-sign/index.html`, `ha/takardu-da-pdf/index.html`, and PDF workflow docs.

Recommend one route for implementation and one route to avoid for now. Include risk, source maturity, validation commands, and fallback policy.

### Prompt 11: Hausa irrigation Nigeria route

Task: Hausa route for Nigeria irrigation calculator if source is mature.

Mode: implementation. Do not touch all Africa agriculture pages. Do not touch `dist/`.

Read `ha/noma/index.html`, `agriculture/irrigation/nigeria.html`, and existing Hausa agriculture routes.

Preserve water, cost, and crop logic. Use practical Hausa for farmers. Keep official/advisory limits clear.

Validate with visible-copy audit, hreflang validation, audit, i18n validation, and SEO report.

### Prompt 12: Hausa seed rate Nigeria route

Task: Hausa route for Nigeria seed-rate calculator.

Mode: implementation. Preserve crop spacing formulas. Do not touch `dist/`.

Read `ha/noma/index.html`, `agriculture/seed-rate/nigeria`, and existing Hausa agriculture route patterns.

Use Hausa for seed spacing, hectare, row distance, germination, and loss assumptions. Do not update agronomy claims.

Validate with visible-copy audit, hreflang validation, audit, i18n validation, and SEO report.

### Prompt 13: Hausa business registration fallback cleanup

Task: Review whether business registration is ready for Hausa.

Mode: discovery first, implementation only if small. Do not touch `dist/`.

Read `ha/kasuwanci-da-haraji/index.html`, `tools/business-registration/index.html`, registry rows, and Nigeria source claims.

If not ready, improve Hausa fallback labels and hub copy only. If ready, propose a route and validation plan but do not create it without clear scope.

### Prompt 14: Hausa CAC checker candidate

Task: Hausa CAC checker route-readiness review.

Mode: discovery/report only. Do not edit files.

Read `ha/najeriya/index.html`, `tools/cac-checker/index.html`, registry rows, and any CAC data/source files.

Report if CAC checker should be translated now, what legal/source warnings are required, and exact validation commands.

### Prompt 15: Hausa currency converter fallback polish

Task: Hausa visible-label polish for currency converter fallback.

Mode: focused implementation. Do not alter FX logic, live-data calls, or `dist/`.

Read `ha/index.html`, `ha/kayan-aiki/index.html`, `ha/najeriya/index.html`, footer Hausa links, and `tools/currency-converter/index.html`.

Keep the route as English fallback unless a scoped Hausa route already exists. Make labels Hausa-first and honest.

Validate with visible-copy audit, i18n validation, audit, and SEO report.

### Prompt 16: Hausa bank charges/mobile money cluster review

Task: Review Nigeria money helper cluster after mobile-money Hausa route.

Mode: review plus focused copy/link fixes. Do not touch `dist/`.

Read `ha/kayan-aiki/kudin-tura-kudi-ta-waya/index.html`, `ha/najeriya/index.html`, `ha/kayan-aiki/index.html`, `tools/bank-charges/index.html`, and money registry rows.

Ensure fallback pages are not promoted as Hausa, and the Hausa mobile-money route is discoverable wherever appropriate.

Validate with visible-copy audit, i18n validation, audit, and SEO report.

### Prompt 17: Hausa registry duplicate and alias audit

Task: Hausa registry duplicate and alias audit after Batch 4.

Mode: review plus focused fixes. Do not touch `dist/`.

Read `assets/js/components/tool-registry.js`, navbar/footer source, and all 59 Hausa routes.

Verify every `lang: 'ha'` row points to an existing route, no English fallback is stored as Hausa, duplicate aliases are intentional, and categories are correct.

Validate with `npm run audit`, visible-copy audit, i18n validation, SEO report, and check-links if feasible.

### Prompt 18: Hausa source ownership map refresh

Task: Refresh Hausa route ownership map for 59 routes.

Mode: documentation/report only. Do not edit site files.

Read `docs/HAUSA-LOCALIZATION-STRATEGY.md`, `reports/hausa-visible-copy-ledger.md`, `assets/js/components/tool-registry.js`, and all `/ha/` routes.

Update or produce a report showing hand-authored hubs, copied/adapted tools, English source pairs, and routes without clear source owner.

Validate with visible-copy audit and i18n validation.

### Prompt 19: Hausa internal preview checklist

Task: Prepare Hausa internal preview checklist for 59 routes.

Mode: review only. Do not edit files.

Run the full Hausa proof stack and inspect the five highest-value user flows: PAYE, VAT, JAMB, PDF, and telecom.

Report what an internal reviewer should click, expected labels, fallback wording, carried debt, and exact go/no-go criteria.

### Prompt 20: Hausa Batch 5 final gate and Batch 6 handoff

Task: Batch 5 final validation gate and next prompt pack.

Mode: review only unless a remaining blocker is tiny and scoped. Do not touch `dist/`.

Run visible-copy audit, i18n validation, hreflang validation, audit, SEO report, PDF verify, VAT/business-tax verify, salary-tax verify, mobile audit if layout changed, and check-links with a long timeout if feasible.

Report final verdict, direct blockers, carried baseline debt, net-new issues, route inventory, registry/search verdict, shared shell verdict, validation results, and the exact next 20 prompts for Batch 6.
