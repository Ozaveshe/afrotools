# Tool Quality Prompt Batch 111-260

Generated from the committed full reports/tool-quality-ranking.json snapshot because the working ranking report currently contains a reduced one-row rerun. This batch continues after prompts 1-110 and contains the next 150 lowest-ranked tools by rank, score, and id, excluding previously issued targets.

Use each prompt as a standalone copy-paste instruction for an agent.

## 111. taille-terrain-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id taille-terrain-fr from F to A-grade.
Route: /fr/tools/taille-terrain
File: fr/tools/taille-terrain/index.html
Current score: 49
Category: Mortgage & Property

Goal:
Turn Taille de terrain into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against property calculators, mortgage tools, rental ROI planners, and real-estate investment workbenches.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add property-specific inputs, fees, tax/levy assumptions, maintenance or operating costs, currency, and scenario controls.
- Show total cost, monthly or annual impact, break-even or affordability result, risk notes, and copy/export summary.
- Include source/freshness notes for rates or fees and a property/finance disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows taille-terrain-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/taille-terrain.
```

## 112. charge-electrique-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id charge-electrique-fr from D to A-grade.
Route: /fr/tools/charge-electrique
File: fr/tools/charge-electrique/index.html
Current score: 50
Category: Engineering & Construction

Goal:
Turn Calculateur de charge electrique into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against construction material calculators, quantity-surveying tools, contractor estimate sheets, and home-improvement calculators.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add measurement inputs, unit selectors, waste/contingency controls, material and labor cost fields, and currency handling.
- Show quantity, cost, low/base/high scenarios, formula/methodology, procurement checklist, and copy/export summary.
- Include measurement assumptions, safety disclaimer, and advice to verify final quantities with a qualified local professional.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows charge-electrique-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/charge-electrique.
```

## 113. devis-quantitatif-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id devis-quantitatif-fr from D to A-grade.
Route: /fr/tools/devis-quantitatif
File: fr/tools/devis-quantitatif/index.html
Current score: 50
Category: Engineering & Construction

Goal:
Turn Generateur de devis quantitatif into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against construction material calculators, quantity-surveying tools, contractor estimate sheets, and home-improvement calculators.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add measurement inputs, unit selectors, waste/contingency controls, material and labor cost fields, and currency handling.
- Show quantity, cost, low/base/high scenarios, formula/methodology, procurement checklist, and copy/export summary.
- Include measurement assumptions, safety disclaimer, and advice to verify final quantities with a qualified local professional.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows devis-quantitatif-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/devis-quantitatif.
```

## 114. document-pdf-ha

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id document-pdf-ha from D to A-grade.
Route: /ha/takardu-da-pdf/
File: ha/takardu-da-pdf/index.html
Current score: 50
Category: Document & PDF

Goal:
Build a trustworthy document workflow for Takardu da PDF, with privacy, file handling, result states, and download path.

Competitive benchmark:
Benchmark against Smallpdf, iLovePDF, PDF24, Adobe Acrobat online, and local-first document workflows.

Requirements:
- Preserve natural Hausa with no English leakage except unavoidable technical terms. Keep wording useful for Hausa-speaking users.
- Add clear upload/workflow steps, preview or file summary, processing controls, output/download path, and error states.
- Include privacy/local-processing language where true and wire downloads through existing repo patterns if downloads are involved.
- Follow docs/PDF-CATEGORY-WORKFLOW.md where relevant and add copy/export or result summary behavior.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows document-pdf-ha as rank A with score >= 85, browserOk true, and no console/page errors on /ha/takardu-da-pdf/.
```

## 115. dr-congo-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id dr-congo-sw from D to A-grade.
Route: /sw/dr-congo/
File: sw/dr-congo/index.html
Current score: 50
Category: Uniquely African

Goal:
Turn Zana za Jamhuri ya Kidemokrasia ya Kongo 2026 - Kodi ya Mshahara na Fedha into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against leading Uniquely African tools, official references where applicable, and polished workflow-first calculators.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add complete user inputs, validation, clear output, assumptions, and scenario comparison.
- Show methodology, next steps, related links, and copy/export summary.
- Include source/freshness notes and an appropriate disclaimer for the domain.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows dr-congo-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/dr-congo/.
```

## 116. frais-service-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id frais-service-fr from D to A-grade.
Route: /fr/tools/frais-service
File: fr/tools/frais-service/index.html
Current score: 50
Category: Mortgage & Property

Goal:
Turn Calculateur de frais de service into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against property calculators, mortgage tools, rental ROI planners, and real-estate investment workbenches.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add property-specific inputs, fees, tax/levy assumptions, maintenance or operating costs, currency, and scenario controls.
- Show total cost, monthly or annual impact, break-even or affordability result, risk notes, and copy/export summary.
- Include source/freshness notes for rates or fees and a property/finance disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows frais-service-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/frais-service.
```

## 117. generateur-mot-de-passe-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id generateur-mot-de-passe-fr from D to A-grade.
Route: /fr/tools/generateur-mot-de-passe
File: fr/tools/generateur-mot-de-passe/index.html
Current score: 50
Category: Developer Tools

Goal:
Turn Generateur de mot de passe into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against DevToys, CyberChef, JSONLint, Code Beautify, MDN examples, and focused developer utilities.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add direct input, transform/validate controls, sample data, clear output, copy/download behavior, and error states.
- Show changed character or validation details where relevant and keep everything local-first.
- Include privacy/local-processing note, keyboard-friendly controls, and practical developer examples.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows generateur-mot-de-passe-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/generateur-mot-de-passe.
```

## 118. generateur-uuid-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id generateur-uuid-fr from D to A-grade.
Route: /fr/tools/generateur-uuid
File: fr/tools/generateur-uuid/index.html
Current score: 50
Category: Developer Tools

Goal:
Turn Generateur UUID into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against DevToys, CyberChef, JSONLint, Code Beautify, MDN examples, and focused developer utilities.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add direct input, transform/validate controls, sample data, clear output, copy/download behavior, and error states.
- Show changed character or validation details where relevant and keep everything local-first.
- Include privacy/local-processing note, keyboard-friendly controls, and practical developer examples.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows generateur-uuid-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/generateur-uuid.
```

## 119. jamb-english-ha

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id jamb-english-ha from D to A-grade.
Route: /ha/jamb/turanci/
File: ha/jamb/turanci/index.html
Current score: 50
Category: Education

Goal:
Build a student-first learning or verification workflow for JAMB Turanci a Hausa, with diagnosis, guidance, and next steps.

Competitive benchmark:
Benchmark against exam prep apps, score calculators, study planners, and high-quality student dashboards.

Requirements:
- Preserve natural Hausa with no English leakage except unavoidable technical terms. Keep wording useful for Hausa-speaking users.
- Add guided inputs, topic or score breakdown, weak-area diagnosis, timetable or action plan, and related learning links.
- Show a clear result panel, next-step checklist, copy/export summary, and student-friendly explanations.
- Include source/freshness notes for syllabus, score, or eligibility assumptions and avoid claiming official status without evidence.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows jamb-english-ha as rank A with score >= 85, browserOk true, and no console/page errors on /ha/jamb/turanci/.
```

## 120. minuteur-pomodoro-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id minuteur-pomodoro-fr from D to A-grade.
Route: /fr/tools/minuteur-pomodoro
File: fr/tools/minuteur-pomodoro/index.html
Current score: 50
Category: Business & ROI

Goal:
Turn Minuteur Pomodoro into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against ROI calculators, business planning tools, productivity calculators, and operations dashboards.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add business inputs, cost/revenue/time fields, assumptions, currency, and scenario controls.
- Show ROI, cost, break-even, payback, recommendation, action checklist, and copy/export summary.
- Include methodology, source/freshness notes for defaults, and business disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows minuteur-pomodoro-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/minuteur-pomodoro.
```

## 121. objectif-epargne-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id objectif-epargne-fr from D to A-grade.
Route: /fr/tools/objectif-epargne
File: fr/tools/objectif-epargne/index.html
Current score: 50
Category: Salary, Tax & Crypto

Goal:
Turn Objectif épargne into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against TaxTim, TaxCalc.ng, Bankrate, NerdWallet, official payroll references, and serious finance calculators.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add complete financial inputs, rate/period controls, country/currency context, fees or deductions, and scenario comparison.
- Show result breakdown, formula/methodology, affordability or risk notes, and copy/export summary.
- Include source/freshness notes for rates and a financial/tax disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows objectif-epargne-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/objectif-epargne.
```

## 122. pdf-convert-ha

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id pdf-convert-ha from D to A-grade.
Route: /ha/kayan-aiki/canza-pdf/
File: ha/kayan-aiki/canza-pdf/index.html
Current score: 50
Category: Document & PDF

Goal:
Build a trustworthy document workflow for Canja PDF, with privacy, file handling, result states, and download path.

Competitive benchmark:
Benchmark against Smallpdf, iLovePDF, PDF24, Adobe Acrobat online, and local-first document workflows.

Requirements:
- Preserve natural Hausa with no English leakage except unavoidable technical terms. Keep wording useful for Hausa-speaking users.
- Add clear upload/workflow steps, preview or file summary, processing controls, output/download path, and error states.
- Include privacy/local-processing language where true and wire downloads through existing repo patterns if downloads are involved.
- Follow docs/PDF-CATEGORY-WORKFLOW.md where relevant and add copy/export or result summary behavior.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows pdf-convert-ha as rank A with score >= 85, browserOk true, and no console/page errors on /ha/kayan-aiki/canza-pdf/.
```

## 123. pdf-workspace-yo

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id pdf-workspace-yo from D to A-grade.
Route: /yo/awon-ise/wurin-pdf/
File: yo/awon-ise/wurin-pdf/index.html
Current score: 50
Category: Document & PDF

Goal:
Build a trustworthy document workflow for Ibi iṣẹ́ PDF, with privacy, file handling, result states, and download path.

Competitive benchmark:
Benchmark against Smallpdf, iLovePDF, PDF24, Adobe Acrobat online, and local-first document workflows.

Requirements:
- Preserve natural Yoruba and avoid English leakage except unavoidable technical terms. Keep the workflow understandable for Yoruba-speaking users.
- Add clear upload/workflow steps, preview or file summary, processing controls, output/download path, and error states.
- Include privacy/local-processing language where true and wire downloads through existing repo patterns if downloads are involved.
- Follow docs/PDF-CATEGORY-WORKFLOW.md where relevant and add copy/export or result summary behavior.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows pdf-workspace-yo as rank A with score >= 85, browserOk true, and no console/page errors on /yo/awon-ise/wurin-pdf/.
```

## 124. planificateur-etudes-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id planificateur-etudes-fr from D to A-grade.
Route: /fr/tools/planificateur-etudes
File: fr/tools/planificateur-etudes/index.html
Current score: 50
Category: Education

Goal:
Turn Planificateur d’études into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against exam prep apps, score calculators, study planners, and high-quality student dashboards.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add guided inputs, topic or score breakdown, weak-area diagnosis, timetable or action plan, and related learning links.
- Show a clear result panel, next-step checklist, copy/export summary, and student-friendly explanations.
- Include source/freshness notes for syllabus, score, or eligibility assumptions and avoid claiming official status without evidence.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows planificateur-etudes-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/planificateur-etudes.
```

## 125. ratio-taille-hanches-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id ratio-taille-hanches-fr from D to A-grade.
Route: /fr/tools/ratio-taille-hanches
File: fr/tools/ratio-taille-hanches/index.html
Current score: 50
Category: Health & Wellness

Goal:
Turn Calculateur ratio taille-hanches into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against medically careful calculators from WebMD, NHS-style guidance pages, and polished health apps.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add precise health inputs, result ranges, uncertainty notes, privacy-first local handling, and next-step guidance.
- Show result explanation, warning signs or when-to-seek-help guidance, and copy/export summary where appropriate.
- Include a medical disclaimer and avoid overclaiming diagnosis or certainty.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows ratio-taille-hanches-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/ratio-taille-hanches.
```

## 126. salary-tax-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id salary-tax-sw from D to A-grade.
Route: /sw/salary-tax/
File: sw/salary-tax/index.html
Current score: 50
Category: Salary, Tax & Crypto

Goal:
Build a payroll, contribution, or tax calculator for Umehamishiwa Mshahara na Fedha kwa Kiswahili, with rate assumptions, source notes, and clear breakdowns.

Competitive benchmark:
Benchmark against TaxTim, TaxCalc.ng, Bankrate, NerdWallet, official payroll references, and serious finance calculators.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add complete financial inputs, rate/period controls, country/currency context, fees or deductions, and scenario comparison.
- Show result breakdown, formula/methodology, affordability or risk notes, and copy/export summary.
- Include source/freshness notes for rates and a financial/tax disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows salary-tax-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/salary-tax/.
```

## 127. seuil-rentabilite-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id seuil-rentabilite-fr from D to A-grade.
Route: /fr/tools/seuil-rentabilite
File: fr/tools/seuil-rentabilite/index.html
Current score: 50
Category: VAT & Business Tax

Goal:
Turn Calculateur de seuil de rentabilite into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against Taxngr, TaxCalc.ng, Zoho, Wave, invoice calculators, and SME compliance tools.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add business-specific inputs, country/currency selectors, tax or fee assumptions, revenue/cost fields, and validation.
- Show result breakdown, methodology, business next steps, recordkeeping checklist, and copy/export summary.
- Include current-rate source/freshness notes and tax/business disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows seuil-rentabilite-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/seuil-rentabilite.
```

## 128. zana-bima-ndogo-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id zana-bima-ndogo-sw from D to A-grade.
Route: /sw/zana/bima-ndogo/
File: sw/zana/bima-ndogo/index.html
Current score: 50
Category: Insurance

Goal:
Build a practical insurance estimator or comparison workflow for Bima Ndogo kwa Kiswahili, with coverage gaps and quote-readiness guidance.

Competitive benchmark:
Benchmark against insurer quote flows, comparison marketplaces, premium calculators, and coverage needs estimators.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add risk profile, coverage amount, deductible/excess, country/currency, term, and affordability inputs.
- Show estimated premium range, coverage gap, fit score, checklist, and copy/export summary.
- Include assumptions, source/freshness notes, and insurance disclaimer that real quotes vary by insurer and underwriting.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows zana-bima-ndogo-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/zana/bima-ndogo/.
```

## 129. zana-bima-ya-lazima-ya-gari-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id zana-bima-ya-lazima-ya-gari-sw from D to A-grade.
Route: /sw/zana/bima-ya-lazima-ya-gari/
File: sw/zana/bima-ya-lazima-ya-gari/index.html
Current score: 50
Category: Insurance

Goal:
Build a practical insurance estimator or comparison workflow for Bima ya Lazima ya Gari kwa Kiswahili, with coverage gaps and quote-readiness guidance.

Competitive benchmark:
Benchmark against insurer quote flows, comparison marketplaces, premium calculators, and coverage needs estimators.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add risk profile, coverage amount, deductible/excess, country/currency, term, and affordability inputs.
- Show estimated premium range, coverage gap, fit score, checklist, and copy/export summary.
- Include assumptions, source/freshness notes, and insurance disclaimer that real quotes vary by insurer and underwriting.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows zana-bima-ya-lazima-ya-gari-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/zana/bima-ya-lazima-ya-gari/.
```

## 130. zana-fidia-ya-wafanyakazi-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id zana-fidia-ya-wafanyakazi-sw from D to A-grade.
Route: /sw/zana/fidia-ya-wafanyakazi/
File: sw/zana/fidia-ya-wafanyakazi/index.html
Current score: 50
Category: Insurance

Goal:
Turn Fidia ya Wafanyakazi into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against insurer quote flows, comparison marketplaces, premium calculators, and coverage needs estimators.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add risk profile, coverage amount, deductible/excess, country/currency, term, and affordability inputs.
- Show estimated premium range, coverage gap, fit score, checklist, and copy/export summary.
- Include assumptions, source/freshness notes, and insurance disclaimer that real quotes vary by insurer and underwriting.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows zana-fidia-ya-wafanyakazi-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/zana/fidia-ya-wafanyakazi/.
```

## 131. zana-kikokotoo-bima-ya-gari-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id zana-kikokotoo-bima-ya-gari-sw from D to A-grade.
Route: /sw/zana/kikokotoo-bima-ya-gari/
File: sw/zana/kikokotoo-bima-ya-gari/index.html
Current score: 50
Category: Insurance

Goal:
Build a practical insurance estimator or comparison workflow for Kikokotoo cha Bima ya Gari kwa Kiswahili, with coverage gaps and quote-readiness guidance.

Competitive benchmark:
Benchmark against insurer quote flows, comparison marketplaces, premium calculators, and coverage needs estimators.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add risk profile, coverage amount, deductible/excess, country/currency, term, and affordability inputs.
- Show estimated premium range, coverage gap, fit score, checklist, and copy/export summary.
- Include assumptions, source/freshness notes, and insurance disclaimer that real quotes vary by insurer and underwriting.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows zana-kikokotoo-bima-ya-gari-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/zana/kikokotoo-bima-ya-gari/.
```

## 132. zana-kikokotoo-bima-ya-maisha-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id zana-kikokotoo-bima-ya-maisha-sw from D to A-grade.
Route: /sw/zana/kikokotoo-bima-ya-maisha/
File: sw/zana/kikokotoo-bima-ya-maisha/index.html
Current score: 50
Category: Insurance

Goal:
Build a practical insurance estimator or comparison workflow for Kikokotoo cha Bima ya Maisha kwa Kiswahili, with coverage gaps and quote-readiness guidance.

Competitive benchmark:
Benchmark against insurer quote flows, comparison marketplaces, premium calculators, and coverage needs estimators.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add risk profile, coverage amount, deductible/excess, country/currency, term, and affordability inputs.
- Show estimated premium range, coverage gap, fit score, checklist, and copy/export summary.
- Include assumptions, source/freshness notes, and insurance disclaimer that real quotes vary by insurer and underwriting.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows zana-kikokotoo-bima-ya-maisha-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/zana/kikokotoo-bima-ya-maisha/.
```

## 133. zana-kikokotoo-bima-ya-mazao-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id zana-kikokotoo-bima-ya-mazao-sw from D to A-grade.
Route: /sw/zana/kikokotoo-bima-ya-mazao/
File: sw/zana/kikokotoo-bima-ya-mazao/index.html
Current score: 50
Category: Agriculture

Goal:
Build a practical insurance estimator or comparison workflow for Kikokotoo cha Bima ya Mazao Afrika, with coverage gaps and quote-readiness guidance.

Competitive benchmark:
Benchmark against leading Agriculture tools, official references where applicable, and polished workflow-first calculators.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add complete user inputs, validation, clear output, assumptions, and scenario comparison.
- Show methodology, next steps, related links, and copy/export summary.
- Include source/freshness notes and an appropriate disclaimer for the domain.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows zana-kikokotoo-bima-ya-mazao-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/zana/kikokotoo-bima-ya-mazao/.
```

## 134. zana-kikokotoo-bima-ya-mazishi-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id zana-kikokotoo-bima-ya-mazishi-sw from D to A-grade.
Route: /sw/zana/kikokotoo-bima-ya-mazishi/
File: sw/zana/kikokotoo-bima-ya-mazishi/index.html
Current score: 50
Category: Insurance

Goal:
Build a practical insurance estimator or comparison workflow for Kikokotoo cha Bima ya Mazishi Afrika, with coverage gaps and quote-readiness guidance.

Competitive benchmark:
Benchmark against insurer quote flows, comparison marketplaces, premium calculators, and coverage needs estimators.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add risk profile, coverage amount, deductible/excess, country/currency, term, and affordability inputs.
- Show estimated premium range, coverage gap, fit score, checklist, and copy/export summary.
- Include assumptions, source/freshness notes, and insurance disclaimer that real quotes vary by insurer and underwriting.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows zana-kikokotoo-bima-ya-mazishi-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/zana/kikokotoo-bima-ya-mazishi/.
```

## 135. zana-kikokotoo-mchango-wa-afya-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id zana-kikokotoo-mchango-wa-afya-sw from D to A-grade.
Route: /sw/zana/kikokotoo-mchango-wa-afya/
File: sw/zana/kikokotoo-mchango-wa-afya/index.html
Current score: 50
Category: Insurance

Goal:
Turn Kikokotoo cha Mchango wa Afya kwa Kiswahili into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against insurer quote flows, comparison marketplaces, premium calculators, and coverage needs estimators.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add risk profile, coverage amount, deductible/excess, country/currency, term, and affordability inputs.
- Show estimated premium range, coverage gap, fit score, checklist, and copy/export summary.
- Include assumptions, source/freshness notes, and insurance disclaimer that real quotes vary by insurer and underwriting.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows zana-kikokotoo-mchango-wa-afya-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/zana/kikokotoo-mchango-wa-afya/.
```

## 136. zana-kilinganisha-bima-ya-afya-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id zana-kilinganisha-bima-ya-afya-sw from D to A-grade.
Route: /sw/zana/kilinganisha-bima-ya-afya/
File: sw/zana/kilinganisha-bima-ya-afya/index.html
Current score: 50
Category: Insurance

Goal:
Build a practical insurance estimator or comparison workflow for Kilinganisha Bima ya Afya kwa Kiswahili, with coverage gaps and quote-readiness guidance.

Competitive benchmark:
Benchmark against insurer quote flows, comparison marketplaces, premium calculators, and coverage needs estimators.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add risk profile, coverage amount, deductible/excess, country/currency, term, and affordability inputs.
- Show estimated premium range, coverage gap, fit score, checklist, and copy/export summary.
- Include assumptions, source/freshness notes, and insurance disclaimer that real quotes vary by insurer and underwriting.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows zana-kilinganisha-bima-ya-afya-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/zana/kilinganisha-bima-ya-afya/.
```

## 137. zana-kituo-elimu-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id zana-kituo-elimu-sw from D to A-grade.
Route: /sw/zana/kituo-elimu/
File: sw/zana/kituo-elimu/index.html
Current score: 50
Category: Education

Goal:
Turn Kituo cha Elimu kwa Kiswahili into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against exam prep apps, score calculators, study planners, and high-quality student dashboards.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add guided inputs, topic or score breakdown, weak-area diagnosis, timetable or action plan, and related learning links.
- Show a clear result panel, next-step checklist, copy/export summary, and student-friendly explanations.
- Include source/freshness notes for syllabus, score, or eligibility assumptions and avoid claiming official status without evidence.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows zana-kituo-elimu-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/zana/kituo-elimu/.
```

## 138. calculateur-fractions-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id calculateur-fractions-fr from D to A-grade.
Route: /fr/tools/calculateur-fractions
File: fr/tools/calculateur-fractions/index.html
Current score: 51
Category: Education

Goal:
Turn Calculateur de fractions into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against exam prep apps, score calculators, study planners, and high-quality student dashboards.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add guided inputs, topic or score breakdown, weak-area diagnosis, timetable or action plan, and related learning links.
- Show a clear result panel, next-step checklist, copy/export summary, and student-friendly explanations.
- Include source/freshness notes for syllabus, score, or eligibility assumptions and avoid claiming official status without evidence.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows calculateur-fractions-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/calculateur-fractions.
```

## 139. calculateur-remise-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id calculateur-remise-fr from D to A-grade.
Route: /fr/tools/calculateur-remise
File: fr/tools/calculateur-remise/index.html
Current score: 51
Category: VAT & Business Tax

Goal:
Turn Calculateur de remise into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against Taxngr, TaxCalc.ng, Zoho, Wave, invoice calculators, and SME compliance tools.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add business-specific inputs, country/currency selectors, tax or fee assumptions, revenue/cost fields, and validation.
- Show result breakdown, methodology, business next steps, recordkeeping checklist, and copy/export summary.
- Include current-rate source/freshness notes and tax/business disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows calculateur-remise-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/calculateur-remise.
```

## 140. calculateur-statistiques-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id calculateur-statistiques-fr from D to A-grade.
Route: /fr/tools/calculateur-statistiques
File: fr/tools/calculateur-statistiques/index.html
Current score: 51
Category: Education

Goal:
Turn Calculateur de statistiques into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against exam prep apps, score calculators, study planners, and high-quality student dashboards.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add guided inputs, topic or score breakdown, weak-area diagnosis, timetable or action plan, and related learning links.
- Show a clear result panel, next-step checklist, copy/export summary, and student-friendly explanations.
- Include source/freshness notes for syllabus, score, or eligibility assumptions and avoid claiming official status without evidence.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows calculateur-statistiques-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/calculateur-statistiques.
```

## 141. calculatrice-scientifique-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id calculatrice-scientifique-fr from D to A-grade.
Route: /fr/tools/calculatrice-scientifique
File: fr/tools/calculatrice-scientifique/index.html
Current score: 51
Category: Education

Goal:
Turn Calculatrice scientifique into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against exam prep apps, score calculators, study planners, and high-quality student dashboards.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add guided inputs, topic or score breakdown, weak-area diagnosis, timetable or action plan, and related learning links.
- Show a clear result panel, next-step checklist, copy/export summary, and student-friendly explanations.
- Include source/freshness notes for syllabus, score, or eligibility assumptions and avoid claiming official status without evidence.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows calculatrice-scientifique-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/calculatrice-scientifique.
```

## 142. comparateur-financement-commerce-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id comparateur-financement-commerce-fr from D to A-grade.
Route: /fr/tools/comparateur-financement-commerce
File: fr/tools/comparateur-financement-commerce/index.html
Current score: 51
Category: Trade & Import

Goal:
Turn Comparateur financement commercial into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against DHL, Freightos, customs broker tools, landed-cost calculators, and official trade guidance.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add origin/destination, product, value, freight, duty, VAT, FX, documentation, and logistics-risk inputs.
- Show landed cost, duty/tax breakdown, readiness checklist, risk notes, and copy/export summary.
- Include source/freshness notes and trade/legal disclaimer. Do not invent official rates without source/date.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows comparateur-financement-commerce-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/comparateur-financement-commerce.
```

## 143. compteur-mots-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id compteur-mots-fr from D to A-grade.
Route: /fr/tools/compteur-mots
File: fr/tools/compteur-mots/index.html
Current score: 51
Category: Education

Goal:
Turn Compteur de mots into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against exam prep apps, score calculators, study planners, and high-quality student dashboards.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add guided inputs, topic or score breakdown, weak-area diagnosis, timetable or action plan, and related learning links.
- Show a clear result panel, next-step checklist, copy/export summary, and student-friendly explanations.
- Include source/freshness notes for syllabus, score, or eligibility assumptions and avoid claiming official status without evidence.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows compteur-mots-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/compteur-mots.
```

## 144. contrat-travail-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id contrat-travail-fr from D to A-grade.
Route: /fr/tools/contrat-travail
File: fr/tools/contrat-travail/index.html
Current score: 51
Category: Mortgage & Property

Goal:
Turn Contrat de travail into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against property calculators, mortgage tools, rental ROI planners, and real-estate investment workbenches.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add property-specific inputs, fees, tax/levy assumptions, maintenance or operating costs, currency, and scenario controls.
- Show total cost, monthly or annual impact, break-even or affordability result, risk notes, and copy/export summary.
- Include source/freshness notes for rates or fees and a property/finance disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows contrat-travail-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/contrat-travail.
```

## 145. convertisseur-binaire-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id convertisseur-binaire-fr from D to A-grade.
Route: /fr/tools/convertisseur-binaire
File: fr/tools/convertisseur-binaire/index.html
Current score: 51
Category: Education

Goal:
Turn Convertisseur binaire into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against exam prep apps, score calculators, study planners, and high-quality student dashboards.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add guided inputs, topic or score breakdown, weak-area diagnosis, timetable or action plan, and related learning links.
- Show a clear result panel, next-step checklist, copy/export summary, and student-friendly explanations.
- Include source/freshness notes for syllabus, score, or eligibility assumptions and avoid claiming official status without evidence.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows convertisseur-binaire-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/convertisseur-binaire.
```

## 146. convertisseur-unites-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id convertisseur-unites-fr from D to A-grade.
Route: /fr/tools/convertisseur-unites
File: fr/tools/convertisseur-unites/index.html
Current score: 51
Category: Business & ROI

Goal:
Turn Convertisseur d unites into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against ROI calculators, business planning tools, productivity calculators, and operations dashboards.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add business inputs, cost/revenue/time fields, assumptions, currency, and scenario controls.
- Show ROI, cost, break-even, payback, recommendation, action checklist, and copy/export summary.
- Include methodology, source/freshness notes for defaults, and business disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows convertisseur-unites-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/convertisseur-unites.
```

## 147. decodeur-jwt-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id decodeur-jwt-fr from D to A-grade.
Route: /fr/tools/decodeur-jwt
File: fr/tools/decodeur-jwt/index.html
Current score: 51
Category: Developer Tools

Goal:
Turn Decodeur JWT into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against DevToys, CyberChef, JSONLint, Code Beautify, MDN examples, and focused developer utilities.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add direct input, transform/validate controls, sample data, clear output, copy/download behavior, and error states.
- Show changed character or validation details where relevant and keep everything local-first.
- Include privacy/local-processing note, keyboard-friendly controls, and practical developer examples.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows decodeur-jwt-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/decodeur-jwt.
```

## 148. encodeur-base64-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id encodeur-base64-fr from D to A-grade.
Route: /fr/tools/encodeur-base64
File: fr/tools/encodeur-base64/index.html
Current score: 51
Category: Developer Tools

Goal:
Turn Encodeur/Decodeur Base64 into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against DevToys, CyberChef, JSONLint, Code Beautify, MDN examples, and focused developer utilities.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add direct input, transform/validate controls, sample data, clear output, copy/download behavior, and error states.
- Show changed character or validation details where relevant and keep everything local-first.
- Include privacy/local-processing note, keyboard-friendly controls, and practical developer examples.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows encodeur-base64-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/encodeur-base64.
```

## 149. formateur-json-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id formateur-json-fr from D to A-grade.
Route: /fr/tools/formateur-json
File: fr/tools/formateur-json/index.html
Current score: 51
Category: Developer Tools

Goal:
Turn Formateur JSON into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against DevToys, CyberChef, JSONLint, Code Beautify, MDN examples, and focused developer utilities.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add direct input, transform/validate controls, sample data, clear output, copy/download behavior, and error states.
- Show changed character or validation details where relevant and keep everything local-first.
- Include privacy/local-processing note, keyboard-friendly controls, and practical developer examples.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows formateur-json-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/formateur-json.
```

## 150. formateur-sql-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id formateur-sql-fr from D to A-grade.
Route: /fr/tools/formateur-sql
File: fr/tools/formateur-sql/index.html
Current score: 51
Category: Developer Tools

Goal:
Turn Formateur SQL into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against DevToys, CyberChef, JSONLint, Code Beautify, MDN examples, and focused developer utilities.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add direct input, transform/validate controls, sample data, clear output, copy/download behavior, and error states.
- Show changed character or validation details where relevant and keep everything local-first.
- Include privacy/local-processing note, keyboard-friendly controls, and practical developer examples.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows formateur-sql-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/formateur-sql.
```

## 151. funeral-cost

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id funeral-cost from D to A-grade.
Route: /tools/funeral-cost/
File: tools/funeral-cost/index.html
Current score: 51
Category: Religious & Cultural

Goal:
Build a serious cost calculator for Funeral Cost Calculator, with transparent line items, assumptions, and practical decision support.

Competitive benchmark:
Benchmark against respectful event planners, religious utility tools, cultural calendars, and strong family planning calculators.

Requirements:
- Use clear English product copy with practical African market context where relevant.
- Add culturally flexible inputs, local context, practical planning outputs, scenario comparison, and copy/export summary.
- Use respectful language and avoid pretending one tradition applies to all users.
- Include assumptions, source/freshness notes where dates or guidance matter, and an appropriate cultural/religious disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows funeral-cost as rank A with score >= 85, browserOk true, and no console/page errors on /tools/funeral-cost/.
```

## 152. generateur-certificat-origine-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id generateur-certificat-origine-fr from D to A-grade.
Route: /fr/tools/generateur-certificat-origine
File: fr/tools/generateur-certificat-origine/index.html
Current score: 51
Category: Trade & Import

Goal:
Turn Certificat d origine into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against DHL, Freightos, customs broker tools, landed-cost calculators, and official trade guidance.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add origin/destination, product, value, freight, duty, VAT, FX, documentation, and logistics-risk inputs.
- Show landed cost, duty/tax breakdown, readiness checklist, risk notes, and copy/export summary.
- Include source/freshness notes and trade/legal disclaimer. Do not invent official rates without source/date.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows generateur-certificat-origine-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/generateur-certificat-origine.
```

## 153. hub-education-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id hub-education-fr from D to A-grade.
Route: /fr/tools/hub-education
File: fr/tools/hub-education/index.html
Current score: 51
Category: Education

Goal:
Build a student-first learning or verification workflow for Hub éducation Afrique, with diagnosis, guidance, and next steps.

Competitive benchmark:
Benchmark against exam prep apps, score calculators, study planners, and high-quality student dashboards.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add guided inputs, topic or score breakdown, weak-area diagnosis, timetable or action plan, and related learning links.
- Show a clear result panel, next-step checklist, copy/export summary, and student-friendly explanations.
- Include source/freshness notes for syllabus, score, or eligibility assumptions and avoid claiming official status without evidence.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows hub-education-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/hub-education.
```

## 154. ke-helb-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id ke-helb-fr from D to A-grade.
Route: /fr/tools/ke-helb
File: fr/tools/ke-helb/index.html
Current score: 51
Category: Education

Goal:
Turn Calculateur HELB Kenya into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against exam prep apps, score calculators, study planners, and high-quality student dashboards.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add guided inputs, topic or score breakdown, weak-area diagnosis, timetable or action plan, and related learning links.
- Show a clear result panel, next-step checklist, copy/export summary, and student-friendly explanations.
- Include source/freshness notes for syllabus, score, or eligibility assumptions and avoid claiming official status without evidence.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows ke-helb-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/ke-helb.
```

## 155. language-ha

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id language-ha from D to A-grade.
Route: /ha/harshe-da-fassara/
File: ha/harshe-da-fassara/index.html
Current score: 51
Category: Language & Translation

Goal:
Turn Harshe da Fassara a Hausa into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against leading Language & Translation tools, official references where applicable, and polished workflow-first calculators.

Requirements:
- Preserve natural Hausa with no English leakage except unavoidable technical terms. Keep wording useful for Hausa-speaking users.
- Add complete user inputs, validation, clear output, assumptions, and scenario comparison.
- Show methodology, next steps, related links, and copy/export summary.
- Include source/freshness notes and an appropriate disclaimer for the domain.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows language-ha as rank A with score >= 85, browserOk true, and no console/page errors on /ha/harshe-da-fassara/.
```

## 156. liste-colisage-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id liste-colisage-fr from D to A-grade.
Route: /fr/tools/liste-colisage
File: fr/tools/liste-colisage/index.html
Current score: 51
Category: Trade & Import

Goal:
Turn Liste de colisage into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against DHL, Freightos, customs broker tools, landed-cost calculators, and official trade guidance.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add origin/destination, product, value, freight, duty, VAT, FX, documentation, and logistics-risk inputs.
- Show landed cost, duty/tax breakdown, readiness checklist, risk notes, and copy/export summary.
- Include source/freshness notes and trade/legal disclaimer. Do not invent official rates without source/date.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows liste-colisage-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/liste-colisage.
```

## 157. recherche-code-sh-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id recherche-code-sh-fr from D to A-grade.
Route: /fr/tools/recherche-code-sh
File: fr/tools/recherche-code-sh/index.html
Current score: 51
Category: Trade & Import

Goal:
Turn Recherche de code SH douanier into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against DHL, Freightos, customs broker tools, landed-cost calculators, and official trade guidance.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add origin/destination, product, value, freight, duty, VAT, FX, documentation, and logistics-risk inputs.
- Show landed cost, duty/tax breakdown, readiness checklist, risk notes, and copy/export summary.
- Include source/freshness notes and trade/legal disclaimer. Do not invent official rates without source/date.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows recherche-code-sh-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/recherche-code-sh.
```

## 158. risque-diabete-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id risque-diabete-fr from D to A-grade.
Route: /fr/tools/risque-diabete
File: fr/tools/risque-diabete/index.html
Current score: 51
Category: Health & Wellness

Goal:
Turn Evaluation du risque de diabete into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against medically careful calculators from WebMD, NHS-style guidance pages, and polished health apps.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add precise health inputs, result ranges, uncertainty notes, privacy-first local handling, and next-step guidance.
- Show result explanation, warning signs or when-to-seek-help guidance, and copy/export summary where appropriate.
- Include a medical disclaimer and avoid overclaiming diagnosis or certainty.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows risque-diabete-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/risque-diabete.
```

## 159. salaire-minimum-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id salaire-minimum-fr from D to A-grade.
Route: /fr/tools/salaire-minimum
File: fr/tools/salaire-minimum/index.html
Current score: 51
Category: Salary, Tax & Crypto

Goal:
Build a payroll, contribution, or tax calculator for Salaire minimum, with rate assumptions, source notes, and clear breakdowns.

Competitive benchmark:
Benchmark against TaxTim, TaxCalc.ng, Bankrate, NerdWallet, official payroll references, and serious finance calculators.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add complete financial inputs, rate/period controls, country/currency context, fees or deductions, and scenario comparison.
- Show result breakdown, formula/methodology, affordability or risk notes, and copy/export summary.
- Include source/freshness notes for rates and a financial/tax disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows salaire-minimum-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/salaire-minimum.
```

## 160. solveur-algebre-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id solveur-algebre-fr from D to A-grade.
Route: /fr/tools/solveur-algebre
File: fr/tools/solveur-algebre/index.html
Current score: 51
Category: Education

Goal:
Turn Solveur d algebre into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against exam prep apps, score calculators, study planners, and high-quality student dashboards.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add guided inputs, topic or score breakdown, weak-area diagnosis, timetable or action plan, and related learning links.
- Show a clear result panel, next-step checklist, copy/export summary, and student-friendly explanations.
- Include source/freshness notes for syllabus, score, or eligibility assumptions and avoid claiming official status without evidence.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows solveur-algebre-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/solveur-algebre.
```

## 161. telecom-ha

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id telecom-ha from D to A-grade.
Route: /ha/sadarwa/
File: ha/sadarwa/index.html
Current score: 51
Category: Telecom & Mobile

Goal:
Turn Sadarwa da Wayar Hannu into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against telecom comparison sites, mobile data calculators, airtime planners, and operator self-service flows.

Requirements:
- Preserve natural Hausa with no English leakage except unavoidable technical terms. Keep wording useful for Hausa-speaking users.
- Add plan, usage, validity, price, speed/use case, family/business needs, and country/operator fields.
- Show cost per GB/minute, recommended plan, scenario comparison, and copy/export summary.
- Include source/freshness notes because operator plans change frequently.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows telecom-ha as rank A with score >= 85, browserOk true, and no console/page errors on /ha/sadarwa/.
```

## 162. calculateur-surestaries-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id calculateur-surestaries-fr from D to A-grade.
Route: /fr/tools/calculateur-surestaries
File: fr/tools/calculateur-surestaries/index.html
Current score: 52
Category: Trade & Import

Goal:
Turn Calculateur de surestaries into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against DHL, Freightos, customs broker tools, landed-cost calculators, and official trade guidance.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add origin/destination, product, value, freight, duty, VAT, FX, documentation, and logistics-risk inputs.
- Show landed cost, duty/tax breakdown, readiness checklist, risk notes, and copy/export summary.
- Include source/freshness notes and trade/legal disclaimer. Do not invent official rates without source/date.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows calculateur-surestaries-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/calculateur-surestaries.
```

## 163. central-african-republic-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id central-african-republic-sw from D to A-grade.
Route: /sw/central-african-republic/
File: sw/central-african-republic/index.html
Current score: 52
Category: Uniquely African

Goal:
Turn Zana za Jamhuri ya Afrika ya Kati 2026 - Kodi ya Mshahara na Fedha into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against leading Uniquely African tools, official references where applicable, and polished workflow-first calculators.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add complete user inputs, validation, clear output, assumptions, and scenario comparison.
- Show methodology, next steps, related links, and copy/export summary.
- Include source/freshness notes and an appropriate disclaimer for the domain.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows central-african-republic-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/central-african-republic/.
```

## 164. dimensionnement-citerne-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id dimensionnement-citerne-fr from D to A-grade.
Route: /fr/tools/dimensionnement-citerne
File: fr/tools/dimensionnement-citerne/index.html
Current score: 52
Category: Engineering & Construction

Goal:
Turn Dimensionnement de citerne d eau into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against construction material calculators, quantity-surveying tools, contractor estimate sheets, and home-improvement calculators.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add measurement inputs, unit selectors, waste/contingency controls, material and labor cost fields, and currency handling.
- Show quantity, cost, low/base/high scenarios, formula/methodology, procurement checklist, and copy/export summary.
- Include measurement assumptions, safety disclaimer, and advice to verify final quantities with a qualified local professional.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows dimensionnement-citerne-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/dimensionnement-citerne.
```

## 165. domestic-worker

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id domestic-worker from D to A-grade.
Route: /tools/domestic-worker/
File: tools/domestic-worker/index.html
Current score: 52
Category: HR & Payroll

Goal:
Turn Domestic Worker Salary Guide - All 15 African Countries into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against leading HR & Payroll tools, official references where applicable, and polished workflow-first calculators.

Requirements:
- Use clear English product copy with practical African market context where relevant.
- Add complete user inputs, validation, clear output, assumptions, and scenario comparison.
- Show methodology, next steps, related links, and copy/export summary.
- Include source/freshness notes and an appropriate disclaimer for the domain.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows domestic-worker as rank A with score >= 85, browserOk true, and no console/page errors on /tools/domestic-worker/.
```

## 166. dosage-beton-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id dosage-beton-fr from D to A-grade.
Route: /fr/tools/dosage-beton
File: fr/tools/dosage-beton/index.html
Current score: 52
Category: Engineering & Construction

Goal:
Turn Calculateur de dosage beton into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against construction material calculators, quantity-surveying tools, contractor estimate sheets, and home-improvement calculators.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add measurement inputs, unit selectors, waste/contingency controls, material and labor cost fields, and currency handling.
- Show quantity, cost, low/base/high scenarios, formula/methodology, procurement checklist, and copy/export summary.
- Include measurement assumptions, safety disclaimer, and advice to verify final quantities with a qualified local professional.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows dosage-beton-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/dosage-beton.
```

## 167. facture-proforma-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id facture-proforma-fr from D to A-grade.
Route: /fr/tools/facture-proforma
File: fr/tools/facture-proforma/index.html
Current score: 52
Category: Small Business & SME

Goal:
Turn Facture proforma into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against leading Small Business & SME tools, official references where applicable, and polished workflow-first calculators.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add complete user inputs, validation, clear output, assumptions, and scenario comparison.
- Show methodology, next steps, related links, and copy/export summary.
- Include source/freshness notes and an appropriate disclaimer for the domain.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows facture-proforma-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/facture-proforma.
```

## 168. generateur-lettre-motivation-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id generateur-lettre-motivation-fr from D to A-grade.
Route: /fr/tools/generateur-lettre-motivation
File: fr/tools/generateur-lettre-motivation/index.html
Current score: 52
Category: Career & Development

Goal:
Build a payroll, contribution, or tax calculator for Générateur de lettre de motivation, with rate assumptions, source notes, and clear breakdowns.

Competitive benchmark:
Benchmark against leading Career & Development tools, official references where applicable, and polished workflow-first calculators.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add complete user inputs, validation, clear output, assumptions, and scenario comparison.
- Show methodology, next steps, related links, and copy/export summary.
- Include source/freshness notes and an appropriate disclaimer for the domain.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows generateur-lettre-motivation-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/generateur-lettre-motivation.
```

## 169. jamb-physics-ha

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id jamb-physics-ha from D to A-grade.
Route: /ha/jamb/fisiks/
File: ha/jamb/fisiks/index.html
Current score: 52
Category: Education

Goal:
Build a student-first learning or verification workflow for JAMB Fisiks a Hausa, with diagnosis, guidance, and next steps.

Competitive benchmark:
Benchmark against exam prep apps, score calculators, study planners, and high-quality student dashboards.

Requirements:
- Preserve natural Hausa with no English leakage except unavoidable technical terms. Keep wording useful for Hausa-speaking users.
- Add guided inputs, topic or score breakdown, weak-area diagnosis, timetable or action plan, and related learning links.
- Show a clear result panel, next-step checklist, copy/export summary, and student-friendly explanations.
- Include source/freshness notes for syllabus, score, or eligibility assumptions and avoid claiming official status without evidence.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows jamb-physics-ha as rank A with score >= 85, browserOk true, and no console/page errors on /ha/jamb/fisiks/.
```

## 170. mali-na-mikopo-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id mali-na-mikopo-sw from D to A-grade.
Route: /sw/mali-na-mikopo/
File: sw/mali-na-mikopo/index.html
Current score: 52
Category: Personal Finance

Goal:
Turn Mali, Nyumba na Mikopo Afrika into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against NerdWallet, Bankrate, Mint-style planners, and practical household finance calculators.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add income, costs, debts, savings, currency, period, and scenario inputs.
- Show surplus/deficit, affordability or savings target, category breakdown, recommendation, and copy/export summary.
- Include assumptions, source/freshness notes, and financial disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows mali-na-mikopo-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/mali-na-mikopo/.
```

## 171. marge-beneficiaire-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id marge-beneficiaire-fr from D to A-grade.
Route: /fr/tools/marge-beneficiaire
File: fr/tools/marge-beneficiaire/index.html
Current score: 52
Category: VAT & Business Tax

Goal:
Turn Marge beneficiaire into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against Taxngr, TaxCalc.ng, Zoho, Wave, invoice calculators, and SME compliance tools.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add business-specific inputs, country/currency selectors, tax or fee assumptions, revenue/cost fields, and validation.
- Show result breakdown, methodology, business next steps, recordkeeping checklist, and copy/export summary.
- Include current-rate source/freshness notes and tax/business disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows marge-beneficiaire-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/marge-beneficiaire.
```

## 172. pdf-workspace-ha

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id pdf-workspace-ha from D to A-grade.
Route: /ha/kayan-aiki/wurin-aikin-pdf/
File: ha/kayan-aiki/wurin-aikin-pdf/index.html
Current score: 52
Category: Document & PDF

Goal:
Build a trustworthy document workflow for Wurin Aikin PDF, with privacy, file handling, result states, and download path.

Competitive benchmark:
Benchmark against Smallpdf, iLovePDF, PDF24, Adobe Acrobat online, and local-first document workflows.

Requirements:
- Preserve natural Hausa with no English leakage except unavoidable technical terms. Keep wording useful for Hausa-speaking users.
- Add clear upload/workflow steps, preview or file summary, processing controls, output/download path, and error states.
- Include privacy/local-processing language where true and wire downloads through existing repo patterns if downloads are involved.
- Follow docs/PDF-CATEGORY-WORKFLOW.md where relevant and add copy/export or result summary behavior.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows pdf-workspace-ha as rank A with score >= 85, browserOk true, and no console/page errors on /ha/kayan-aiki/wurin-aikin-pdf/.
```

## 173. planificateur-entreprise-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id planificateur-entreprise-fr from D to A-grade.
Route: /fr/tools/planificateur-entreprise
File: fr/tools/planificateur-entreprise/index.html
Current score: 52
Category: Small Business & SME

Goal:
Turn Planificateur entreprise into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against leading Small Business & SME tools, official references where applicable, and polished workflow-first calculators.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add complete user inputs, validation, clear output, assumptions, and scenario comparison.
- Show methodology, next steps, related links, and copy/export summary.
- Include source/freshness notes and an appropriate disclaimer for the domain.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows planificateur-entreprise-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/planificateur-entreprise.
```

## 174. sarafu-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id sarafu-sw from D to A-grade.
Route: /sw/sarafu/
File: sw/sarafu/index.html
Current score: 52
Category: Fintech & Banking

Goal:
Turn Sarafu na Ubadilishaji Afrika into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against Wise, Stripe, PayPal, loan calculators, bank fee tools, and payment comparison calculators.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add amount, fees, rate, payment method, period, country/currency, and scenario inputs.
- Show net received or total paid, fee breakdown, effective rate, risk notes, and copy/export summary.
- Include source/freshness notes for fees/rates and a finance disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows sarafu-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/sarafu/.
```

## 175. sur-plan-vs-pret-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id sur-plan-vs-pret-fr from D to A-grade.
Route: /fr/tools/sur-plan-vs-pret
File: fr/tools/sur-plan-vs-pret/index.html
Current score: 52
Category: Salary, Tax & Crypto

Goal:
Build a serious loan or financing calculator for Sur plan vs prêt, with repayment, affordability, and risk analysis.

Competitive benchmark:
Benchmark against TaxTim, TaxCalc.ng, Bankrate, NerdWallet, official payroll references, and serious finance calculators.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add complete financial inputs, rate/period controls, country/currency context, fees or deductions, and scenario comparison.
- Show result breakdown, formula/methodology, affordability or risk notes, and copy/export summary.
- Include source/freshness notes for rates and a financial/tax disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows sur-plan-vs-pret-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/sur-plan-vs-pret.
```

## 176. vat-business-tax-ha

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id vat-business-tax-ha from D to A-grade.
Route: /ha/kasuwanci-da-haraji/
File: ha/kasuwanci-da-haraji/index.html
Current score: 52
Category: VAT & Business Tax

Goal:
Build a payroll, contribution, or tax calculator for VAT da Harajin Kasuwanci, with rate assumptions, source notes, and clear breakdowns.

Competitive benchmark:
Benchmark against Taxngr, TaxCalc.ng, Zoho, Wave, invoice calculators, and SME compliance tools.

Requirements:
- Preserve natural Hausa with no English leakage except unavoidable technical terms. Keep wording useful for Hausa-speaking users.
- Add business-specific inputs, country/currency selectors, tax or fee assumptions, revenue/cost fields, and validation.
- Show result breakdown, methodology, business next steps, recordkeeping checklist, and copy/export summary.
- Include current-rate source/freshness notes and tax/business disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows vat-business-tax-ha as rank A with score >= 85, browserOk true, and no console/page errors on /ha/kasuwanci-da-haraji/.
```

## 177. yoruba-nigeria

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id yoruba-nigeria from D to A-grade.
Route: /yo/naijiria/
File: yo/naijiria/index.html
Current score: 52
Category: Uniquely African

Goal:
Turn Naijiria ni Yorùbá into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against leading Uniquely African tools, official references where applicable, and polished workflow-first calculators.

Requirements:
- Preserve natural Yoruba and avoid English leakage except unavoidable technical terms. Keep the workflow understandable for Yoruba-speaking users.
- Add complete user inputs, validation, clear output, assumptions, and scenario comparison.
- Show methodology, next steps, related links, and copy/export summary.
- Include source/freshness notes and an appropriate disclaimer for the domain.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows yoruba-nigeria as rank A with score >= 85, browserOk true, and no console/page errors on /yo/naijiria/.
```

## 178. yoruba-salary-tax

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id yoruba-salary-tax from D to A-grade.
Route: /yo/owo-osu-ati-owo-ori/
File: yo/owo-osu-ati-owo-ori/index.html
Current score: 52
Category: Salary, Tax & Crypto

Goal:
Build a payroll, contribution, or tax calculator for Owó oṣù àti owó-orí, with rate assumptions, source notes, and clear breakdowns.

Competitive benchmark:
Benchmark against TaxTim, TaxCalc.ng, Bankrate, NerdWallet, official payroll references, and serious finance calculators.

Requirements:
- Preserve natural Yoruba and avoid English leakage except unavoidable technical terms. Keep the workflow understandable for Yoruba-speaking users.
- Add complete financial inputs, rate/period controls, country/currency context, fees or deductions, and scenario comparison.
- Show result breakdown, formula/methodology, affordability or risk notes, and copy/export summary.
- Include source/freshness notes for rates and a financial/tax disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows yoruba-salary-tax as rank A with score >= 85, browserOk true, and no console/page errors on /yo/owo-osu-ati-owo-ori/.
```

## 179. yoruba-tools

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id yoruba-tools from D to A-grade.
Route: /yo/awon-ise/
File: yo/awon-ise/index.html
Current score: 52
Category: Uniquely African

Goal:
Turn Àwọn irinṣẹ Yorùbá into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against leading Uniquely African tools, official references where applicable, and polished workflow-first calculators.

Requirements:
- Preserve natural Yoruba and avoid English leakage except unavoidable technical terms. Keep the workflow understandable for Yoruba-speaking users.
- Add complete user inputs, validation, clear output, assumptions, and scenario comparison.
- Show methodology, next steps, related links, and copy/export summary.
- Include source/freshness notes and an appropriate disclaimer for the domain.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows yoruba-tools as rank A with score >= 85, browserOk true, and no console/page errors on /yo/awon-ise/.
```

## 180. biashara-na-faida-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id biashara-na-faida-sw from D to A-grade.
Route: /sw/biashara-na-faida/
File: sw/biashara-na-faida/index.html
Current score: 53
Category: VAT & Business Tax

Goal:
Turn Biashara na Faida | Kizingiti cha faida na Asilimia ya faida into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against Taxngr, TaxCalc.ng, Zoho, Wave, invoice calculators, and SME compliance tools.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add business-specific inputs, country/currency selectors, tax or fee assumptions, revenue/cost fields, and validation.
- Show result breakdown, methodology, business next steps, recordkeeping checklist, and copy/export summary.
- Include current-rate source/freshness notes and tax/business disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows biashara-na-faida-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/biashara-na-faida/.
```

## 181. business-insurance

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id business-insurance from D to A-grade.
Route: /tools/business-insurance/
File: tools/business-insurance/index.html
Current score: 53
Category: Insurance

Goal:
Build a practical insurance estimator or comparison workflow for Business Insurance Estimator, with coverage gaps and quote-readiness guidance.

Competitive benchmark:
Benchmark against insurer quote flows, comparison marketplaces, premium calculators, and coverage needs estimators.

Requirements:
- Use clear English product copy with practical African market context where relevant.
- Add risk profile, coverage amount, deductible/excess, country/currency, term, and affordability inputs.
- Show estimated premium range, coverage gap, fit score, checklist, and copy/export summary.
- Include assumptions, source/freshness notes, and insurance disclaimer that real quotes vary by insurer and underwriting.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows business-insurance as rank A with score >= 85, browserOk true, and no console/page errors on /tools/business-insurance/.
```

## 182. calcul-structure-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id calcul-structure-fr from D to A-grade.
Route: /fr/tools/calcul-structure
File: fr/tools/calcul-structure/index.html
Current score: 53
Category: Engineering & Construction

Goal:
Turn Calculateur structural into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against construction material calculators, quantity-surveying tools, contractor estimate sheets, and home-improvement calculators.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add measurement inputs, unit selectors, waste/contingency controls, material and labor cost fields, and currency handling.
- Show quantity, cost, low/base/high scenarios, formula/methodology, procurement checklist, and copy/export summary.
- Include measurement assumptions, safety disclaimer, and advice to verify final quantities with a qualified local professional.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows calcul-structure-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/calcul-structure.
```

## 183. capacite-emprunt-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id capacite-emprunt-fr from D to A-grade.
Route: /fr/tools/capacite-emprunt
File: fr/tools/capacite-emprunt/index.html
Current score: 53
Category: Salary, Tax & Crypto

Goal:
Turn Capacité d'emprunt into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against TaxTim, TaxCalc.ng, Bankrate, NerdWallet, official payroll references, and serious finance calculators.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add complete financial inputs, rate/period controls, country/currency context, fees or deductions, and scenario comparison.
- Show result breakdown, formula/methodology, affordability or risk notes, and copy/export summary.
- Include source/freshness notes for rates and a financial/tax disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows capacite-emprunt-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/capacite-emprunt.
```

## 184. electricity-tariff

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id electricity-tariff from D to A-grade.
Route: /tools/electricity-tariff/
File: tools/electricity-tariff/index.html
Current score: 53
Category: Energy & Utilities

Goal:
Build a serious cost calculator for Electricity Tariff Calculator, with transparent line items, assumptions, and practical decision support.

Competitive benchmark:
Benchmark against tariff calculators, solar sizing tools, outage cost calculators, and utility bill workbenches.

Requirements:
- Use clear English product copy with practical African market context where relevant.
- Add consumption, tariff, usage pattern, appliance/load, backup or solar options, and currency inputs.
- Show bill estimate, savings/risk scenario, payback or affordability result, and copy/export summary.
- Include source/freshness notes for tariffs and utility disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows electricity-tariff as rank A with score >= 85, browserOk true, and no console/page errors on /tools/electricity-tariff/.
```

## 185. health-ha

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id health-ha from D to A-grade.
Route: /ha/lafiya/
File: ha/lafiya/index.html
Current score: 53
Category: Health & Wellness

Goal:
Build a careful health and wellness estimator for Lafiya da Iyali a Hausa, with uncertainty, privacy, and medical disclaimers.

Competitive benchmark:
Benchmark against medically careful calculators from WebMD, NHS-style guidance pages, and polished health apps.

Requirements:
- Preserve natural Hausa with no English leakage except unavoidable technical terms. Keep wording useful for Hausa-speaking users.
- Add precise health inputs, result ranges, uncertainty notes, privacy-first local handling, and next-step guidance.
- Show result explanation, warning signs or when-to-seek-help guidance, and copy/export summary where appropriate.
- Include a medical disclaimer and avoid overclaiming diagnosis or certainty.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows health-ha as rank A with score >= 85, browserOk true, and no console/page errors on /ha/lafiya/.
```

## 186. immobilier-diaspora-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id immobilier-diaspora-fr from D to A-grade.
Route: /fr/tools/immobilier-diaspora
File: fr/tools/immobilier-diaspora/index.html
Current score: 53
Category: Salary, Tax & Crypto

Goal:
Turn Immobilier diaspora into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against TaxTim, TaxCalc.ng, Bankrate, NerdWallet, official payroll references, and serious finance calculators.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add complete financial inputs, rate/period controls, country/currency context, fees or deductions, and scenario comparison.
- Show result breakdown, formula/methodology, affordability or risk notes, and copy/export summary.
- Include source/freshness notes for rates and a financial/tax disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows immobilier-diaspora-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/immobilier-diaspora.
```

## 187. jours-feries-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id jours-feries-fr from D to A-grade.
Route: /fr/tools/jours-feries
File: fr/tools/jours-feries/index.html
Current score: 53
Category: Business & ROI

Goal:
Turn Jours fériés africains into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against ROI calculators, business planning tools, productivity calculators, and operations dashboards.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add business inputs, cost/revenue/time fields, assumptions, currency, and scenario controls.
- Show ROI, cost, break-even, payback, recommendation, action checklist, and copy/export summary.
- Include methodology, source/freshness notes for defaults, and business disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows jours-feries-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/jours-feries.
```

## 188. materiaux-construction-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id materiaux-construction-fr from D to A-grade.
Route: /fr/tools/materiaux-construction
File: fr/tools/materiaux-construction/index.html
Current score: 53
Category: Mortgage & Property

Goal:
Turn Calculateur de matériaux de construction into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against property calculators, mortgage tools, rental ROI planners, and real-estate investment workbenches.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add property-specific inputs, fees, tax/levy assumptions, maintenance or operating costs, currency, and scenario controls.
- Show total cost, monthly or annual impact, break-even or affordability result, risk notes, and copy/export summary.
- Include source/freshness notes for rates or fees and a property/finance disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows materiaux-construction-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/materiaux-construction.
```

## 189. prayer-times

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id prayer-times from D to A-grade.
Route: /tools/prayer-times/
File: tools/prayer-times/index.html
Current score: 53
Category: Religious & Cultural

Goal:
Turn Prayer Times and Qibla Planner into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against respectful event planners, religious utility tools, cultural calendars, and strong family planning calculators.

Requirements:
- Use clear English product copy with practical African market context where relevant.
- Add culturally flexible inputs, local context, practical planning outputs, scenario comparison, and copy/export summary.
- Use respectful language and avoid pretending one tradition applies to all users.
- Include assumptions, source/freshness notes where dates or guidance matter, and an appropriate cultural/religious disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows prayer-times as rank A with score >= 85, browserOk true, and no console/page errors on /tools/prayer-times/.
```

## 190. prepaid-meter

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id prepaid-meter from D to A-grade.
Route: /tools/prepaid-meter/
File: tools/prepaid-meter/index.html
Current score: 53
Category: Energy & Utilities

Goal:
Turn Prepaid Meter Calculator into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against tariff calculators, solar sizing tools, outage cost calculators, and utility bill workbenches.

Requirements:
- Use clear English product copy with practical African market context where relevant.
- Add consumption, tariff, usage pattern, appliance/load, backup or solar options, and currency inputs.
- Show bill estimate, savings/risk scenario, payback or affordability result, and copy/export summary.
- Include source/freshness notes for tariffs and utility disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows prepaid-meter as rank A with score >= 85, browserOk true, and no console/page errors on /tools/prepaid-meter/.
```

## 191. solar-roi

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id solar-roi from D to A-grade.
Route: /tools/solar-roi/
File: tools/solar-roi/index.html
Current score: 53
Category: Energy & Utilities

Goal:
Turn Solar Panel ROI Calculator into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against tariff calculators, solar sizing tools, outage cost calculators, and utility bill workbenches.

Requirements:
- Use clear English product copy with practical African market context where relevant.
- Add consumption, tariff, usage pattern, appliance/load, backup or solar options, and currency inputs.
- Show bill estimate, savings/risk scenario, payback or affordability result, and copy/export summary.
- Include source/freshness notes for tariffs and utility disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows solar-roi as rank A with score >= 85, browserOk true, and no console/page errors on /tools/solar-roi/.
```

## 192. telecom-sim-reg

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id telecom-sim-reg from D to A-grade.
Route: /telecom/sim-registration/
File: telecom/sim-registration/index.html
Current score: 53
Category: Telecom & Mobile

Goal:
Turn SIM Registration Checker into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against telecom comparison sites, mobile data calculators, airtime planners, and operator self-service flows.

Requirements:
- Use clear English product copy with practical African market context where relevant.
- Add plan, usage, validity, price, speed/use case, family/business needs, and country/operator fields.
- Show cost per GB/minute, recommended plan, scenario comparison, and copy/export summary.
- Include source/freshness notes because operator plans change frequently.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows telecom-sim-reg as rank A with score >= 85, browserOk true, and no console/page errors on /telecom/sim-registration/.
```

## 193. traditional-calendar

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id traditional-calendar from D to A-grade.
Route: /tools/traditional-calendar/
File: tools/traditional-calendar/index.html
Current score: 53
Category: Religious & Cultural

Goal:
Turn Traditional Calendar Converter into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against respectful event planners, religious utility tools, cultural calendars, and strong family planning calculators.

Requirements:
- Use clear English product copy with practical African market context where relevant.
- Add culturally flexible inputs, local context, practical planning outputs, scenario comparison, and copy/export summary.
- Use respectful language and avoid pretending one tradition applies to all users.
- Include assumptions, source/freshness notes where dates or guidance matter, and an appropriate cultural/religious disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows traditional-calendar as rank A with score >= 85, browserOk true, and no console/page errors on /tools/traditional-calendar/.
```

## 194. verificateur-cac-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id verificateur-cac-fr from D to A-grade.
Route: /fr/tools/verificateur-cac
File: fr/tools/verificateur-cac/index.html
Current score: 53
Category: Mortgage & Property

Goal:
Turn Vérificateur CAC Nigeria into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against property calculators, mortgage tools, rental ROI planners, and real-estate investment workbenches.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add property-specific inputs, fees, tax/levy assumptions, maintenance or operating costs, currency, and scenario controls.
- Show total cost, monthly or annual impact, break-even or affordability result, risk notes, and copy/export summary.
- Include source/freshness notes for rates or fees and a property/finance disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows verificateur-cac-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/verificateur-cac.
```

## 195. afya-na-bima-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id afya-na-bima-sw from D to A-grade.
Route: /sw/afya-na-bima/
File: sw/afya-na-bima/index.html
Current score: 54
Category: Insurance

Goal:
Build a practical insurance estimator or comparison workflow for Afya na Bima kwa Kiswahili, with coverage gaps and quote-readiness guidance.

Competitive benchmark:
Benchmark against insurer quote flows, comparison marketplaces, premium calculators, and coverage needs estimators.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add risk profile, coverage amount, deductible/excess, country/currency, term, and affordability inputs.
- Show estimated premium range, coverage gap, fit score, checklist, and copy/export summary.
- Include assumptions, source/freshness notes, and insurance disclaimer that real quotes vary by insurer and underwriting.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows afya-na-bima-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/afya-na-bima/.
```

## 196. agriculture-yo

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id agriculture-yo from D to A-grade.
Route: /yo/ogbin/
File: yo/ogbin/index.html
Current score: 54
Category: Agriculture

Goal:
Turn Ọ̀gbìn àti iṣẹ́ oko ni Yorùbá into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against leading Agriculture tools, official references where applicable, and polished workflow-first calculators.

Requirements:
- Preserve natural Yoruba and avoid English leakage except unavoidable technical terms. Keep the workflow understandable for Yoruba-speaking users.
- Add complete user inputs, validation, clear output, assumptions, and scenario comparison.
- Show methodology, next steps, related links, and copy/export summary.
- Include source/freshness notes and an appropriate disclaimer for the domain.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows agriculture-yo as rank A with score >= 85, browserOk true, and no console/page errors on /yo/ogbin/.
```

## 197. calculateur-marge-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id calculateur-marge-fr from D to A-grade.
Route: /fr/tools/calculateur-marge
File: fr/tools/calculateur-marge/index.html
Current score: 54
Category: VAT & Business Tax

Goal:
Turn Calculateur de marge commerciale into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against Taxngr, TaxCalc.ng, Zoho, Wave, invoice calculators, and SME compliance tools.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add business-specific inputs, country/currency selectors, tax or fee assumptions, revenue/cost fields, and validation.
- Show result breakdown, methodology, business next steps, recordkeeping checklist, and copy/export summary.
- Include current-rate source/freshness notes and tax/business disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows calculateur-marge-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/calculateur-marge.
```

## 198. calculateur-paye-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id calculateur-paye-fr from D to A-grade.
Route: /fr/tools/calculateur-paye
File: fr/tools/calculateur-paye/index.html
Current score: 54
Category: Salary, Tax & Crypto

Goal:
Build a payroll, contribution, or tax calculator for Calculateur PAYE en francais - Pages deja en ligne, with rate assumptions, source notes, and clear breakdowns.

Competitive benchmark:
Benchmark against TaxTim, TaxCalc.ng, Bankrate, NerdWallet, official payroll references, and serious finance calculators.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add complete financial inputs, rate/period controls, country/currency context, fees or deductions, and scenario comparison.
- Show result breakdown, formula/methodology, affordability or risk notes, and copy/export summary.
- Include source/freshness notes for rates and a financial/tax disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows calculateur-paye-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/calculateur-paye.
```

## 199. caution-locative-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id caution-locative-fr from D to A-grade.
Route: /fr/tools/caution-locative
File: fr/tools/caution-locative/index.html
Current score: 54
Category: Mortgage & Property

Goal:
Turn Caution locative into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against property calculators, mortgage tools, rental ROI planners, and real-estate investment workbenches.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add property-specific inputs, fees, tax/levy assumptions, maintenance or operating costs, currency, and scenario controls.
- Show total cost, monthly or annual impact, break-even or affordability result, risk notes, and copy/export summary.
- Include source/freshness notes for rates or fees and a property/finance disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows caution-locative-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/caution-locative.
```

## 200. chiffres-romains-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id chiffres-romains-fr from D to A-grade.
Route: /fr/tools/chiffres-romains
File: fr/tools/chiffres-romains/index.html
Current score: 54
Category: Education

Goal:
Turn Convertisseur de chiffres romains into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against exam prep apps, score calculators, study planners, and high-quality student dashboards.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add guided inputs, topic or score breakdown, weak-area diagnosis, timetable or action plan, and related learning links.
- Show a clear result panel, next-step checklist, copy/export summary, and student-friendly explanations.
- Include source/freshness notes for syllabus, score, or eligibility assumptions and avoid claiming official status without evidence.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows chiffres-romains-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/chiffres-romains.
```

## 201. compte-a-rebours-examen-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id compte-a-rebours-examen-fr from D to A-grade.
Route: /fr/tools/compte-a-rebours-examen
File: fr/tools/compte-a-rebours-examen/index.html
Current score: 54
Category: Education

Goal:
Build a student-first learning or verification workflow for Compte a rebours examen, with diagnosis, guidance, and next steps.

Competitive benchmark:
Benchmark against exam prep apps, score calculators, study planners, and high-quality student dashboards.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add guided inputs, topic or score breakdown, weak-area diagnosis, timetable or action plan, and related learning links.
- Show a clear result panel, next-step checklist, copy/export summary, and student-friendly explanations.
- Include source/freshness notes for syllabus, score, or eligibility assumptions and avoid claiming official status without evidence.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows compte-a-rebours-examen-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/compte-a-rebours-examen.
```

## 202. compteur-prepaye-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id compteur-prepaye-fr from D to A-grade.
Route: /fr/tools/compteur-prepaye
File: fr/tools/compteur-prepaye/index.html
Current score: 54
Category: Energy & Utilities

Goal:
Build a payroll, contribution, or tax calculator for Compteur prepaye, with rate assumptions, source notes, and clear breakdowns.

Competitive benchmark:
Benchmark against tariff calculators, solar sizing tools, outage cost calculators, and utility bill workbenches.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add consumption, tariff, usage pattern, appliance/load, backup or solar options, and currency inputs.
- Show bill estimate, savings/risk scenario, payback or affordability result, and copy/export summary.
- Include source/freshness notes for tariffs and utility disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows compteur-prepaye-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/compteur-prepaye.
```

## 203. createur-fiches-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id createur-fiches-fr from D to A-grade.
Route: /fr/tools/createur-fiches
File: fr/tools/createur-fiches/index.html
Current score: 54
Category: Education

Goal:
Turn Createur de fiches into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against exam prep apps, score calculators, study planners, and high-quality student dashboards.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add guided inputs, topic or score breakdown, weak-area diagnosis, timetable or action plan, and related learning links.
- Show a clear result panel, next-step checklist, copy/export summary, and student-friendly explanations.
- Include source/freshness notes for syllabus, score, or eligibility assumptions and avoid claiming official status without evidence.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows createur-fiches-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/createur-fiches.
```

## 204. editeur-markdown-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id editeur-markdown-fr from D to A-grade.
Route: /fr/tools/editeur-markdown
File: fr/tools/editeur-markdown/index.html
Current score: 54
Category: Business & ROI

Goal:
Turn Editeur Markdown into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against ROI calculators, business planning tools, productivity calculators, and operations dashboards.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add business inputs, cost/revenue/time fields, assumptions, currency, and scenario controls.
- Show ROI, cost, break-even, payback, recommendation, action checklist, and copy/export summary.
- Include methodology, source/freshness notes for defaults, and business disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows editeur-markdown-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/editeur-markdown.
```

## 205. education-yo

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id education-yo from D to A-grade.
Route: /yo/eko/
File: yo/eko/index.html
Current score: 54
Category: Education

Goal:
Build a student-first learning or verification workflow for Ẹ̀kọ́ ni Yorùbá, with diagnosis, guidance, and next steps.

Competitive benchmark:
Benchmark against exam prep apps, score calculators, study planners, and high-quality student dashboards.

Requirements:
- Preserve natural Yoruba and avoid English leakage except unavoidable technical terms. Keep the workflow understandable for Yoruba-speaking users.
- Add guided inputs, topic or score breakdown, weak-area diagnosis, timetable or action plan, and related learning links.
- Show a clear result panel, next-step checklist, copy/export summary, and student-friendly explanations.
- Include source/freshness notes for syllabus, score, or eligibility assumptions and avoid claiming official status without evidence.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows education-yo as rank A with score >= 85, browserOk true, and no console/page errors on /yo/eko/.
```

## 206. frais-scolarite-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id frais-scolarite-fr from D to A-grade.
Route: /fr/tools/frais-scolarite
File: fr/tools/frais-scolarite/index.html
Current score: 54
Category: Education

Goal:
Turn Frais de scolarité into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against exam prep apps, score calculators, study planners, and high-quality student dashboards.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add guided inputs, topic or score breakdown, weak-area diagnosis, timetable or action plan, and related learning links.
- Show a clear result panel, next-step checklist, copy/export summary, and student-friendly explanations.
- Include source/freshness notes for syllabus, score, or eligibility assumptions and avoid claiming official status without evidence.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows frais-scolarite-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/frais-scolarite.
```

## 207. freelancer-rate

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id freelancer-rate from D to A-grade.
Route: /tools/freelancer-rate/
File: tools/freelancer-rate/index.html
Current score: 54
Category: Small Business & SME

Goal:
Turn Freelancer Rate Card - All 15 African Countries into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against leading Small Business & SME tools, official references where applicable, and polished workflow-first calculators.

Requirements:
- Use clear English product copy with practical African market context where relevant.
- Add complete user inputs, validation, clear output, assumptions, and scenario comparison.
- Show methodology, next steps, related links, and copy/export summary.
- Include source/freshness notes and an appropriate disclaimer for the domain.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows freelancer-rate as rank A with score >= 85, browserOk true, and no console/page errors on /tools/freelancer-rate/.
```

## 208. generateur-citations-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id generateur-citations-fr from D to A-grade.
Route: /fr/tools/generateur-citations
File: fr/tools/generateur-citations/index.html
Current score: 54
Category: Education

Goal:
Turn Generateur de citations into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against exam prep apps, score calculators, study planners, and high-quality student dashboards.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add guided inputs, topic or score breakdown, weak-area diagnosis, timetable or action plan, and related learning links.
- Show a clear result panel, next-step checklist, copy/export summary, and student-friendly explanations.
- Include source/freshness notes for syllabus, score, or eligibility assumptions and avoid claiming official status without evidence.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows generateur-citations-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/generateur-citations.
```

## 209. gratuity-calculator

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id gratuity-calculator from D to A-grade.
Route: /tools/gratuity-calculator/
File: tools/gratuity-calculator/index.html
Current score: 54
Category: HR & Payroll

Goal:
Turn Gratuity & Severance Calculator - All 54 African Countries into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against leading HR & Payroll tools, official references where applicable, and polished workflow-first calculators.

Requirements:
- Use clear English product copy with practical African market context where relevant.
- Add complete user inputs, validation, clear output, assumptions, and scenario comparison.
- Show methodology, next steps, related links, and copy/export summary.
- Include source/freshness notes and an appropriate disclaimer for the domain.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows gratuity-calculator as rank A with score >= 85, browserOk true, and no console/page errors on /tools/gratuity-calculator/.
```

## 210. language-translation-yo

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id language-translation-yo from D to A-grade.
Route: /yo/ede-ati-itumo/
File: yo/ede-ati-itumo/index.html
Current score: 54
Category: Language & Translation

Goal:
Turn Èdè àti Ìtumọ̀ ni Yorùbá into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against leading Language & Translation tools, official references where applicable, and polished workflow-first calculators.

Requirements:
- Preserve natural Yoruba and avoid English leakage except unavoidable technical terms. Keep the workflow understandable for Yoruba-speaking users.
- Add complete user inputs, validation, clear output, assumptions, and scenario comparison.
- Show methodology, next steps, related links, and copy/export summary.
- Include source/freshness notes and an appropriate disclaimer for the domain.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows language-translation-yo as rank A with score >= 85, browserOk true, and no console/page errors on /yo/ede-ati-itumo/.
```

## 211. maternity-leave

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id maternity-leave from D to A-grade.
Route: /tools/maternity-leave/
File: tools/maternity-leave/index.html
Current score: 54
Category: HR & Payroll

Goal:
Turn Maternity & Paternity Leave Calculator - All 54 African Countries into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against leading HR & Payroll tools, official references where applicable, and polished workflow-first calculators.

Requirements:
- Use clear English product copy with practical African market context where relevant.
- Add complete user inputs, validation, clear output, assumptions, and scenario comparison.
- Show methodology, next steps, related links, and copy/export summary.
- Include source/freshness notes and an appropriate disclaimer for the domain.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows maternity-leave as rank A with score >= 85, browserOk true, and no console/page errors on /tools/maternity-leave/.
```

## 212. points-matric-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id points-matric-fr from D to A-grade.
Route: /fr/tools/points-matric
File: fr/tools/points-matric/index.html
Current score: 54
Category: Education

Goal:
Turn Calculateur de points Matric (SA) into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against exam prep apps, score calculators, study planners, and high-quality student dashboards.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add guided inputs, topic or score breakdown, weak-area diagnosis, timetable or action plan, and related learning links.
- Show a clear result panel, next-step checklist, copy/export summary, and student-friendly explanations.
- Include source/freshness notes for syllabus, score, or eligibility assumptions and avoid claiming official status without evidence.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows points-matric-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/points-matric.
```

## 213. propriete-intellectuelle-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id propriete-intellectuelle-fr from D to A-grade.
Route: /fr/tools/propriete-intellectuelle
File: fr/tools/propriete-intellectuelle/index.html
Current score: 54
Category: Mortgage & Property

Goal:
Turn Propriété intellectuelle Afrique into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against property calculators, mortgage tools, rental ROI planners, and real-estate investment workbenches.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add property-specific inputs, fees, tax/levy assumptions, maintenance or operating costs, currency, and scenario controls.
- Show total cost, monthly or annual impact, break-even or affordability result, risk notes, and copy/export summary.
- Include source/freshness notes for rates or fees and a property/finance disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows propriete-intellectuelle-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/propriete-intellectuelle.
```

## 214. risque-paludisme-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id risque-paludisme-fr from D to A-grade.
Route: /fr/tools/risque-paludisme
File: fr/tools/risque-paludisme/index.html
Current score: 54
Category: Health & Wellness

Goal:
Turn Evaluation du risque de paludisme into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against medically careful calculators from WebMD, NHS-style guidance pages, and polished health apps.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add precise health inputs, result ranges, uncertainty notes, privacy-first local handling, and next-step guidance.
- Show result explanation, warning signs or when-to-seek-help guidance, and copy/export summary where appropriate.
- Include a medical disclaimer and avoid overclaiming diagnosis or certainty.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows risque-paludisme-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/risque-paludisme.
```

## 215. sim-registration-ha

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id sim-registration-ha from D to A-grade.
Route: /ha/kayan-aiki/rajistar-layin-waya-nin/
File: ha/kayan-aiki/rajistar-layin-waya-nin/index.html
Current score: 54
Category: Telecom & Mobile

Goal:
Turn Rajistar Layin Waya da NIN into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against telecom comparison sites, mobile data calculators, airtime planners, and operator self-service flows.

Requirements:
- Preserve natural Hausa with no English leakage except unavoidable technical terms. Keep wording useful for Hausa-speaking users.
- Add plan, usage, validity, price, speed/use case, family/business needs, and country/operator fields.
- Show cost per GB/minute, recommended plan, scenario comparison, and copy/export summary.
- Include source/freshness notes because operator plans change frequently.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows sim-registration-ha as rank A with score >= 85, browserOk true, and no console/page errors on /ha/kayan-aiki/rajistar-layin-waya-nin/.
```

## 216. sim-registration-yo

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id sim-registration-yo from D to A-grade.
Route: /yo/awon-ise/rajista-sim-nin/
File: yo/awon-ise/rajista-sim-nin/index.html
Current score: 54
Category: Telecom & Mobile

Goal:
Turn Ìforúkọsílẹ̀ SIM, NIN ati BVN into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against telecom comparison sites, mobile data calculators, airtime planners, and operator self-service flows.

Requirements:
- Preserve natural Yoruba and avoid English leakage except unavoidable technical terms. Keep the workflow understandable for Yoruba-speaking users.
- Add plan, usage, validity, price, speed/use case, family/business needs, and country/operator fields.
- Show cost per GB/minute, recommended plan, scenario comparison, and copy/export summary.
- Include source/freshness notes because operator plans change frequently.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows sim-registration-yo as rank A with score >= 85, browserOk true, and no console/page errors on /yo/awon-ise/rajista-sim-nin/.
```

## 217. telecom-yo

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id telecom-yo from D to A-grade.
Route: /yo/ibaraenisoro/
File: yo/ibaraenisoro/index.html
Current score: 54
Category: Telecom & Mobile

Goal:
Turn Ìbáraẹnisọrọ ni Yorùbá into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against telecom comparison sites, mobile data calculators, airtime planners, and operator self-service flows.

Requirements:
- Preserve natural Yoruba and avoid English leakage except unavoidable technical terms. Keep the workflow understandable for Yoruba-speaking users.
- Add plan, usage, validity, price, speed/use case, family/business needs, and country/operator fields.
- Show cost per GB/minute, recommended plan, scenario comparison, and copy/export summary.
- Include source/freshness notes because operator plans change frequently.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows telecom-yo as rank A with score >= 85, browserOk true, and no console/page errors on /yo/ibaraenisoro/.
```

## 218. work-permit-cost

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id work-permit-cost from D to A-grade.
Route: /tools/work-permit-cost/
File: tools/work-permit-cost/index.html
Current score: 54
Category: Government & Civic

Goal:
Build a serious cost calculator for Work Permit Cost Guide - All 54 African Countries, with transparent line items, assumptions, and practical decision support.

Competitive benchmark:
Benchmark against leading Government & Civic tools, official references where applicable, and polished workflow-first calculators.

Requirements:
- Use clear English product copy with practical African market context where relevant.
- Add complete user inputs, validation, clear output, assumptions, and scenario comparison.
- Show methodology, next steps, related links, and copy/export summary.
- Include source/freshness notes and an appropriate disclaimer for the domain.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows work-permit-cost as rank A with score >= 85, browserOk true, and no console/page errors on /tools/work-permit-cost/.
```

## 219. zana-gharama-ya-kukatika-umeme-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id zana-gharama-ya-kukatika-umeme-sw from D to A-grade.
Route: /sw/zana/gharama-ya-kukatika-umeme/
File: sw/zana/gharama-ya-kukatika-umeme/index.html
Current score: 54
Category: Energy & Utilities

Goal:
Turn Gharama ya Kukatika Umeme into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against tariff calculators, solar sizing tools, outage cost calculators, and utility bill workbenches.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add consumption, tariff, usage pattern, appliance/load, backup or solar options, and currency inputs.
- Show bill estimate, savings/risk scenario, payback or affordability result, and copy/export summary.
- Include source/freshness notes for tariffs and utility disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows zana-gharama-ya-kukatika-umeme-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/zana/gharama-ya-kukatika-umeme/.
```

## 220. zana-kikokotoo-bili-ya-maji-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id zana-kikokotoo-bili-ya-maji-sw from D to A-grade.
Route: /sw/zana/kikokotoo-bili-ya-maji/
File: sw/zana/kikokotoo-bili-ya-maji/index.html
Current score: 54
Category: Energy & Utilities

Goal:
Turn Kikokotoo Bili ya Maji into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against tariff calculators, solar sizing tools, outage cost calculators, and utility bill workbenches.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add consumption, tariff, usage pattern, appliance/load, backup or solar options, and currency inputs.
- Show bill estimate, savings/risk scenario, payback or affordability result, and copy/export summary.
- Include source/freshness notes for tariffs and utility disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows zana-kikokotoo-bili-ya-maji-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/zana/kikokotoo-bili-ya-maji/.
```

## 221. zana-kikokotoo-luku-ya-umeme-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id zana-kikokotoo-luku-ya-umeme-sw from D to A-grade.
Route: /sw/zana/kikokotoo-luku-ya-umeme/
File: sw/zana/kikokotoo-luku-ya-umeme/index.html
Current score: 54
Category: Energy & Utilities

Goal:
Turn Kikokotoo LUKU ya Umeme into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against tariff calculators, solar sizing tools, outage cost calculators, and utility bill workbenches.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add consumption, tariff, usage pattern, appliance/load, backup or solar options, and currency inputs.
- Show bill estimate, savings/risk scenario, payback or affordability result, and copy/export summary.
- Include source/freshness notes for tariffs and utility disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows zana-kikokotoo-luku-ya-umeme-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/zana/kikokotoo-luku-ya-umeme/.
```

## 222. zana-paygo-solar-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id zana-paygo-solar-sw from D to A-grade.
Route: /sw/zana/paygo-solar/
File: sw/zana/paygo-solar/index.html
Current score: 54
Category: Energy & Utilities

Goal:
Turn PayGo Solar into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against tariff calculators, solar sizing tools, outage cost calculators, and utility bill workbenches.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add consumption, tariff, usage pattern, appliance/load, backup or solar options, and currency inputs.
- Show bill estimate, savings/risk scenario, payback or affordability result, and copy/export summary.
- Include source/freshness notes for tariffs and utility disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows zana-paygo-solar-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/zana/paygo-solar/.
```

## 223. zana-solar-dhidi-ya-generator-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id zana-solar-dhidi-ya-generator-sw from D to A-grade.
Route: /sw/zana/solar-dhidi-ya-generator/
File: sw/zana/solar-dhidi-ya-generator/index.html
Current score: 54
Category: Energy & Utilities

Goal:
Turn Solar dhidi ya Generator into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against tariff calculators, solar sizing tools, outage cost calculators, and utility bill workbenches.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add consumption, tariff, usage pattern, appliance/load, backup or solar options, and currency inputs.
- Show bill estimate, savings/risk scenario, payback or affordability result, and copy/export summary.
- Include source/freshness notes for tariffs and utility disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows zana-solar-dhidi-ya-generator-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/zana/solar-dhidi-ya-generator/.
```

## 224. zana-ukaguzi-wa-bili-ya-umeme-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id zana-ukaguzi-wa-bili-ya-umeme-sw from D to A-grade.
Route: /sw/zana/ukaguzi-wa-bili-ya-umeme/
File: sw/zana/ukaguzi-wa-bili-ya-umeme/index.html
Current score: 54
Category: Energy & Utilities

Goal:
Turn Ukaguzi wa Bili ya Umeme into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against tariff calculators, solar sizing tools, outage cost calculators, and utility bill workbenches.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add consumption, tariff, usage pattern, appliance/load, backup or solar options, and currency inputs.
- Show bill estimate, savings/risk scenario, payback or affordability result, and copy/export summary.
- Include source/freshness notes for tariffs and utility disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows zana-ukaguzi-wa-bili-ya-umeme-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/zana/ukaguzi-wa-bili-ya-umeme/.
```

## 225. zana-za-elimu-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id zana-za-elimu-sw from D to A-grade.
Route: /sw/zana-za-elimu/
File: sw/zana-za-elimu/index.html
Current score: 54
Category: Education

Goal:
Turn Zana za Elimu kwa Kiswahili into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against exam prep apps, score calculators, study planners, and high-quality student dashboards.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add guided inputs, topic or score breakdown, weak-area diagnosis, timetable or action plan, and related learning links.
- Show a clear result panel, next-step checklist, copy/export summary, and student-friendly explanations.
- Include source/freshness notes for syllabus, score, or eligibility assumptions and avoid claiming official status without evidence.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows zana-za-elimu-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/zana-za-elimu/.
```

## 226. bac-a-sable-sql-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id bac-a-sable-sql-fr from D to A-grade.
Route: /fr/tools/bac-a-sable-sql
File: fr/tools/bac-a-sable-sql/index.html
Current score: 55
Category: Developer Tools

Goal:
Turn Bac a sable SQL into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against DevToys, CyberChef, JSONLint, Code Beautify, MDN examples, and focused developer utilities.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add direct input, transform/validate controls, sample data, clear output, copy/download behavior, and error states.
- Show changed character or validation details where relevant and keep everything local-first.
- Include privacy/local-processing note, keyboard-friendly controls, and practical developer examples.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows bac-a-sable-sql-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/bac-a-sable-sql.
```

## 227. budget-50-30-20-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id budget-50-30-20-fr from D to A-grade.
Route: /fr/tools/budget-50-30-20
File: fr/tools/budget-50-30-20/index.html
Current score: 55
Category: Personal Finance

Goal:
Build a serious cost calculator for Calculateur budget 50/30/20, with transparent line items, assumptions, and practical decision support.

Competitive benchmark:
Benchmark against NerdWallet, Bankrate, Mint-style planners, and practical household finance calculators.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add income, costs, debts, savings, currency, period, and scenario inputs.
- Show surplus/deficit, affordability or savings target, category breakdown, recommendation, and copy/export summary.
- Include assumptions, source/freshness notes, and financial disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows budget-50-30-20-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/budget-50-30-20.
```

## 228. business-registration-yo

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id business-registration-yo from D to A-grade.
Route: /yo/awon-ise/forukosile-owo-ise/
File: yo/awon-ise/forukosile-owo-ise/index.html
Current score: 55
Category: Mortgage & Property

Goal:
Turn Ìforúkọsílẹ̀ iṣẹ́ into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against property calculators, mortgage tools, rental ROI planners, and real-estate investment workbenches.

Requirements:
- Preserve natural Yoruba and avoid English leakage except unavoidable technical terms. Keep the workflow understandable for Yoruba-speaking users.
- Add property-specific inputs, fees, tax/levy assumptions, maintenance or operating costs, currency, and scenario controls.
- Show total cost, monthly or annual impact, break-even or affordability result, risk notes, and copy/export summary.
- Include source/freshness notes for rates or fees and a property/finance disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows business-registration-yo as rank A with score >= 85, browserOk true, and no console/page errors on /yo/awon-ise/forukosile-owo-ise/.
```

## 229. calculateur-credit-documentaire-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id calculateur-credit-documentaire-fr from D to A-grade.
Route: /fr/tools/calculateur-credit-documentaire
File: fr/tools/calculateur-credit-documentaire/index.html
Current score: 55
Category: Trade & Import

Goal:
Build a serious loan or financing calculator for Calculateur credit documentaire, with repayment, affordability, and risk analysis.

Competitive benchmark:
Benchmark against DHL, Freightos, customs broker tools, landed-cost calculators, and official trade guidance.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add origin/destination, product, value, freight, duty, VAT, FX, documentation, and logistics-risk inputs.
- Show landed cost, duty/tax breakdown, readiness checklist, risk notes, and copy/export summary.
- Include source/freshness notes and trade/legal disclaimer. Do not invent official rates without source/date.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows calculateur-credit-documentaire-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/calculateur-credit-documentaire.
```

## 230. calculateur-hypothecaire-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id calculateur-hypothecaire-fr from D to A-grade.
Route: /fr/tools/calculateur-hypothecaire
File: fr/tools/calculateur-hypothecaire/index.html
Current score: 55
Category: Salary, Tax & Crypto

Goal:
Turn Calculateur hypothécaire into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against TaxTim, TaxCalc.ng, Bankrate, NerdWallet, official payroll references, and serious finance calculators.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add complete financial inputs, rate/period controls, country/currency context, fees or deductions, and scenario comparison.
- Show result breakdown, formula/methodology, affordability or risk notes, and copy/export summary.
- Include source/freshness notes for rates and a financial/tax disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows calculateur-hypothecaire-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/calculateur-hypothecaire.
```

## 231. car-price-intelligence

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id car-price-intelligence from D to A-grade.
Route: /cars/
File: cars/index.html
Current score: 55
Category: Transport & Logistics

Goal:
Build a serious cost calculator for African Car Price Directory, with transparent line items, assumptions, and practical decision support.

Competitive benchmark:
Benchmark against leading Transport & Logistics tools, official references where applicable, and polished workflow-first calculators.

Requirements:
- Use clear English product copy with practical African market context where relevant.
- Add complete user inputs, validation, clear output, assumptions, and scenario comparison.
- Show methodology, next steps, related links, and copy/export summary.
- Include source/freshness notes and an appropriate disclaimer for the domain.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows car-price-intelligence as rank A with score >= 85, browserOk true, and no console/page errors on /cars/.
```

## 232. comparateur-salaires-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id comparateur-salaires-fr from D to A-grade.
Route: /fr/tools/comparateur-salaires
File: fr/tools/comparateur-salaires/index.html
Current score: 55
Category: Salary, Tax & Crypto

Goal:
Build a payroll, contribution, or tax calculator for Comparateur de salaires, with rate assumptions, source notes, and clear breakdowns.

Competitive benchmark:
Benchmark against TaxTim, TaxCalc.ng, Bankrate, NerdWallet, official payroll references, and serious finance calculators.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add complete financial inputs, rate/period controls, country/currency context, fees or deductions, and scenario comparison.
- Show result breakdown, formula/methodology, affordability or risk notes, and copy/export summary.
- Include source/freshness notes for rates and a financial/tax disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows comparateur-salaires-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/comparateur-salaires.
```

## 233. cout-cipc-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id cout-cipc-fr from D to A-grade.
Route: /fr/tools/cout-cipc
File: fr/tools/cout-cipc/index.html
Current score: 55
Category: Mortgage & Property

Goal:
Build a serious cost calculator for Coût d’enregistrement CIPC (SA), with transparent line items, assumptions, and practical decision support.

Competitive benchmark:
Benchmark against property calculators, mortgage tools, rental ROI planners, and real-estate investment workbenches.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add property-specific inputs, fees, tax/levy assumptions, maintenance or operating costs, currency, and scenario controls.
- Show total cost, monthly or annual impact, break-even or affordability result, risk notes, and copy/export summary.
- Include source/freshness notes for rates or fees and a property/finance disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows cout-cipc-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/cout-cipc.
```

## 234. cout-renovation-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id cout-renovation-fr from D to A-grade.
Route: /fr/tools/cout-renovation
File: fr/tools/cout-renovation/index.html
Current score: 55
Category: Engineering & Construction

Goal:
Build a serious cost calculator for Cout renovation, with transparent line items, assumptions, and practical decision support.

Competitive benchmark:
Benchmark against construction material calculators, quantity-surveying tools, contractor estimate sheets, and home-improvement calculators.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add measurement inputs, unit selectors, waste/contingency controls, material and labor cost fields, and currency handling.
- Show quantity, cost, low/base/high scenarios, formula/methodology, procurement checklist, and copy/export summary.
- Include measurement assumptions, safety disclaimer, and advice to verify final quantities with a qualified local professional.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows cout-renovation-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/cout-renovation.
```

## 235. pdf-bates-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id pdf-bates-fr from D to A-grade.
Route: /fr/tools/numerotation-bates-pdf
File: fr/tools/numerotation-bates-pdf/index.html
Current score: 55
Category: Document & PDF

Goal:
Build a trustworthy document workflow for Numérotation Bates PDF, with privacy, file handling, result states, and download path.

Competitive benchmark:
Benchmark against Smallpdf, iLovePDF, PDF24, Adobe Acrobat online, and local-first document workflows.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add clear upload/workflow steps, preview or file summary, processing controls, output/download path, and error states.
- Include privacy/local-processing language where true and wire downloads through existing repo patterns if downloads are involved.
- Follow docs/PDF-CATEGORY-WORKFLOW.md where relevant and add copy/export or result summary behavior.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows pdf-bates-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/numerotation-bates-pdf.
```

## 236. pdf-ocr-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id pdf-ocr-fr from D to A-grade.
Route: /fr/tools/ocr-pdf
File: fr/tools/ocr-pdf/index.html
Current score: 55
Category: Document & PDF

Goal:
Build a trustworthy document workflow for OCR PDF, with privacy, file handling, result states, and download path.

Competitive benchmark:
Benchmark against Smallpdf, iLovePDF, PDF24, Adobe Acrobat online, and local-first document workflows.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add clear upload/workflow steps, preview or file summary, processing controls, output/download path, and error states.
- Include privacy/local-processing language where true and wire downloads through existing repo patterns if downloads are involved.
- Follow docs/PDF-CATEGORY-WORKFLOW.md where relevant and add copy/export or result summary behavior.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows pdf-ocr-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/ocr-pdf.
```

## 237. pdf-reorder-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id pdf-reorder-fr from D to A-grade.
Route: /fr/tools/reorganiser-pdf
File: fr/tools/reorganiser-pdf/index.html
Current score: 55
Category: Document & PDF

Goal:
Build a trustworthy document workflow for Réorganiser les pages PDF, with privacy, file handling, result states, and download path.

Competitive benchmark:
Benchmark against Smallpdf, iLovePDF, PDF24, Adobe Acrobat online, and local-first document workflows.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add clear upload/workflow steps, preview or file summary, processing controls, output/download path, and error states.
- Include privacy/local-processing language where true and wire downloads through existing repo patterns if downloads are involved.
- Follow docs/PDF-CATEGORY-WORKFLOW.md where relevant and add copy/export or result summary behavior.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows pdf-reorder-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/reorganiser-pdf.
```

## 238. pdf-sign-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id pdf-sign-fr from D to A-grade.
Route: /fr/tools/signer-pdf
File: fr/tools/signer-pdf/index.html
Current score: 55
Category: Document & PDF

Goal:
Build a trustworthy document workflow for Signer un PDF, with privacy, file handling, result states, and download path.

Competitive benchmark:
Benchmark against Smallpdf, iLovePDF, PDF24, Adobe Acrobat online, and local-first document workflows.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add clear upload/workflow steps, preview or file summary, processing controls, output/download path, and error states.
- Include privacy/local-processing language where true and wire downloads through existing repo patterns if downloads are involved.
- Follow docs/PDF-CATEGORY-WORKFLOW.md where relevant and add copy/export or result summary behavior.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows pdf-sign-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/signer-pdf.
```

## 239. pdf-watermark-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id pdf-watermark-fr from D to A-grade.
Route: /fr/tools/filigrane-pdf
File: fr/tools/filigrane-pdf/index.html
Current score: 55
Category: Document & PDF

Goal:
Build a polished visual workflow for Filigrane PDF, with live preview, controls, and export behavior.

Competitive benchmark:
Benchmark against Smallpdf, iLovePDF, PDF24, Adobe Acrobat online, and local-first document workflows.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add clear upload/workflow steps, preview or file summary, processing controls, output/download path, and error states.
- Include privacy/local-processing language where true and wire downloads through existing repo patterns if downloads are involved.
- Follow docs/PDF-CATEGORY-WORKFLOW.md where relevant and add copy/export or result summary behavior.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows pdf-watermark-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/filigrane-pdf.
```

## 240. rendement-locatif-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id rendement-locatif-fr from D to A-grade.
Route: /fr/tools/rendement-locatif
File: fr/tools/rendement-locatif/index.html
Current score: 55
Category: Mortgage & Property

Goal:
Turn Rendement locatif into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against property calculators, mortgage tools, rental ROI planners, and real-estate investment workbenches.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add property-specific inputs, fees, tax/levy assumptions, maintenance or operating costs, currency, and scenario controls.
- Show total cost, monthly or annual impact, break-even or affordability result, risk notes, and copy/export summary.
- Include source/freshness notes for rates or fees and a property/finance disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows rendement-locatif-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/rendement-locatif.
```

## 241. suivi-notes-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id suivi-notes-fr from D to A-grade.
Route: /fr/tools/suivi-notes
File: fr/tools/suivi-notes/index.html
Current score: 55
Category: Education

Goal:
Turn Suivi des notes into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against exam prep apps, score calculators, study planners, and high-quality student dashboards.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add guided inputs, topic or score breakdown, weak-area diagnosis, timetable or action plan, and related learning links.
- Show a clear result panel, next-step checklist, copy/export summary, and student-friendly explanations.
- Include source/freshness notes for syllabus, score, or eligibility assumptions and avoid claiming official status without evidence.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows suivi-notes-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/suivi-notes.
```

## 242. tableau-periodique-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id tableau-periodique-fr from D to A-grade.
Route: /fr/tools/tableau-periodique
File: fr/tools/tableau-periodique/index.html
Current score: 55
Category: Education

Goal:
Turn Tableau periodique des elements into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against exam prep apps, score calculators, study planners, and high-quality student dashboards.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add guided inputs, topic or score breakdown, weak-area diagnosis, timetable or action plan, and related learning links.
- Show a clear result panel, next-step checklist, copy/export summary, and student-friendly explanations.
- Include source/freshness notes for syllabus, score, or eligibility assumptions and avoid claiming official status without evidence.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows tableau-periodique-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/tableau-periodique.
```

## 243. waec-neco-calculator-yo

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id waec-neco-calculator-yo from D to A-grade.
Route: /yo/awon-ise/kalkuletan-waec-neco/
File: yo/awon-ise/kalkuletan-waec-neco/index.html
Current score: 55
Category: Education

Goal:
Turn Kalkuletan WAEC/NECO into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against exam prep apps, score calculators, study planners, and high-quality student dashboards.

Requirements:
- Preserve natural Yoruba and avoid English leakage except unavoidable technical terms. Keep the workflow understandable for Yoruba-speaking users.
- Add guided inputs, topic or score breakdown, weak-area diagnosis, timetable or action plan, and related learning links.
- Show a clear result panel, next-step checklist, copy/export summary, and student-friendly explanations.
- Include source/freshness notes for syllabus, score, or eligibility assumptions and avoid claiming official status without evidence.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows waec-neco-calculator-yo as rank A with score >= 85, browserOk true, and no console/page errors on /yo/awon-ise/kalkuletan-waec-neco/.
```

## 244. yoruba-vat-business-tax

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id yoruba-vat-business-tax from D to A-grade.
Route: /yo/owo-ori-owo-ise/
File: yo/owo-ori-owo-ise/index.html
Current score: 55
Category: VAT & Business Tax

Goal:
Build a payroll, contribution, or tax calculator for VAT àti owó-orí iṣẹ́, with rate assumptions, source notes, and clear breakdowns.

Competitive benchmark:
Benchmark against Taxngr, TaxCalc.ng, Zoho, Wave, invoice calculators, and SME compliance tools.

Requirements:
- Preserve natural Yoruba and avoid English leakage except unavoidable technical terms. Keep the workflow understandable for Yoruba-speaking users.
- Add business-specific inputs, country/currency selectors, tax or fee assumptions, revenue/cost fields, and validation.
- Show result breakdown, methodology, business next steps, recordkeeping checklist, and copy/export summary.
- Include current-rate source/freshness notes and tax/business disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows yoruba-vat-business-tax as rank A with score >= 85, browserOk true, and no console/page errors on /yo/owo-ori-owo-ise/.
```

## 245. zana-mwongozo-tin-central-african-republic-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id zana-mwongozo-tin-central-african-republic-sw from D to A-grade.
Route: /sw/zana/mwongozo-tin/central-african-republic/
File: sw/zana/mwongozo-tin/central-african-republic/index.html
Current score: 55
Category: VAT & Business Tax

Goal:
Turn Jamhuri ya Afrika ya Kati NIF | Mwongozo wa TIN kwa Kiswahili into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against Taxngr, TaxCalc.ng, Zoho, Wave, invoice calculators, and SME compliance tools.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add business-specific inputs, country/currency selectors, tax or fee assumptions, revenue/cost fields, and validation.
- Show result breakdown, methodology, business next steps, recordkeeping checklist, and copy/export summary.
- Include current-rate source/freshness notes and tax/business disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows zana-mwongozo-tin-central-african-republic-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/zana/mwongozo-tin/central-african-republic/.
```

## 246. zana-mwongozo-tin-chad-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id zana-mwongozo-tin-chad-sw from D to A-grade.
Route: /sw/zana/mwongozo-tin/chad/
File: sw/zana/mwongozo-tin/chad/index.html
Current score: 55
Category: VAT & Business Tax

Goal:
Turn Chadi NIF | Mwongozo wa TIN kwa Kiswahili into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against Taxngr, TaxCalc.ng, Zoho, Wave, invoice calculators, and SME compliance tools.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add business-specific inputs, country/currency selectors, tax or fee assumptions, revenue/cost fields, and validation.
- Show result breakdown, methodology, business next steps, recordkeeping checklist, and copy/export summary.
- Include current-rate source/freshness notes and tax/business disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows zana-mwongozo-tin-chad-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/zana/mwongozo-tin/chad/.
```

## 247. zana-mwongozo-tin-comoros-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id zana-mwongozo-tin-comoros-sw from D to A-grade.
Route: /sw/zana/mwongozo-tin/comoros/
File: sw/zana/mwongozo-tin/comoros/index.html
Current score: 55
Category: VAT & Business Tax

Goal:
Turn Comoro NIF | Mwongozo wa TIN kwa Kiswahili into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against Taxngr, TaxCalc.ng, Zoho, Wave, invoice calculators, and SME compliance tools.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add business-specific inputs, country/currency selectors, tax or fee assumptions, revenue/cost fields, and validation.
- Show result breakdown, methodology, business next steps, recordkeeping checklist, and copy/export summary.
- Include current-rate source/freshness notes and tax/business disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows zana-mwongozo-tin-comoros-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/zana/mwongozo-tin/comoros/.
```

## 248. zana-mwongozo-tin-djibouti-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id zana-mwongozo-tin-djibouti-sw from D to A-grade.
Route: /sw/zana/mwongozo-tin/djibouti/
File: sw/zana/mwongozo-tin/djibouti/index.html
Current score: 55
Category: VAT & Business Tax

Goal:
Turn Djibouti NIF | Mwongozo wa TIN kwa Kiswahili into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against Taxngr, TaxCalc.ng, Zoho, Wave, invoice calculators, and SME compliance tools.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add business-specific inputs, country/currency selectors, tax or fee assumptions, revenue/cost fields, and validation.
- Show result breakdown, methodology, business next steps, recordkeeping checklist, and copy/export summary.
- Include current-rate source/freshness notes and tax/business disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows zana-mwongozo-tin-djibouti-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/zana/mwongozo-tin/djibouti/.
```

## 249. zana-mwongozo-tin-equatorial-guinea-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id zana-mwongozo-tin-equatorial-guinea-sw from D to A-grade.
Route: /sw/zana/mwongozo-tin/equatorial-guinea/
File: sw/zana/mwongozo-tin/equatorial-guinea/index.html
Current score: 55
Category: VAT & Business Tax

Goal:
Turn Guinea ya Ikweta NIF | Mwongozo wa TIN kwa Kiswahili into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against Taxngr, TaxCalc.ng, Zoho, Wave, invoice calculators, and SME compliance tools.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add business-specific inputs, country/currency selectors, tax or fee assumptions, revenue/cost fields, and validation.
- Show result breakdown, methodology, business next steps, recordkeeping checklist, and copy/export summary.
- Include current-rate source/freshness notes and tax/business disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows zana-mwongozo-tin-equatorial-guinea-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/zana/mwongozo-tin/equatorial-guinea/.
```

## 250. zana-mwongozo-tin-eritrea-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id zana-mwongozo-tin-eritrea-sw from D to A-grade.
Route: /sw/zana/mwongozo-tin/eritrea/
File: sw/zana/mwongozo-tin/eritrea/index.html
Current score: 55
Category: VAT & Business Tax

Goal:
Turn Eritrea TIN | Mwongozo wa TIN kwa Kiswahili into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against Taxngr, TaxCalc.ng, Zoho, Wave, invoice calculators, and SME compliance tools.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add business-specific inputs, country/currency selectors, tax or fee assumptions, revenue/cost fields, and validation.
- Show result breakdown, methodology, business next steps, recordkeeping checklist, and copy/export summary.
- Include current-rate source/freshness notes and tax/business disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows zana-mwongozo-tin-eritrea-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/zana/mwongozo-tin/eritrea/.
```

## 251. zana-mwongozo-tin-guinea-bissau-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id zana-mwongozo-tin-guinea-bissau-sw from D to A-grade.
Route: /sw/zana/mwongozo-tin/guinea-bissau/
File: sw/zana/mwongozo-tin/guinea-bissau/index.html
Current score: 55
Category: VAT & Business Tax

Goal:
Turn Guinea-Bissau NIF | Mwongozo wa TIN kwa Kiswahili into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against Taxngr, TaxCalc.ng, Zoho, Wave, invoice calculators, and SME compliance tools.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add business-specific inputs, country/currency selectors, tax or fee assumptions, revenue/cost fields, and validation.
- Show result breakdown, methodology, business next steps, recordkeeping checklist, and copy/export summary.
- Include current-rate source/freshness notes and tax/business disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows zana-mwongozo-tin-guinea-bissau-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/zana/mwongozo-tin/guinea-bissau/.
```

## 252. zana-mwongozo-tin-libya-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id zana-mwongozo-tin-libya-sw from D to A-grade.
Route: /sw/zana/mwongozo-tin/libya/
File: sw/zana/mwongozo-tin/libya/index.html
Current score: 55
Category: VAT & Business Tax

Goal:
Turn Libya Namba ya kodi | Mwongozo wa TIN kwa Kiswahili into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against Taxngr, TaxCalc.ng, Zoho, Wave, invoice calculators, and SME compliance tools.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add business-specific inputs, country/currency selectors, tax or fee assumptions, revenue/cost fields, and validation.
- Show result breakdown, methodology, business next steps, recordkeeping checklist, and copy/export summary.
- Include current-rate source/freshness notes and tax/business disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows zana-mwongozo-tin-libya-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/zana/mwongozo-tin/libya/.
```

## 253. zana-mwongozo-tin-mauritania-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id zana-mwongozo-tin-mauritania-sw from D to A-grade.
Route: /sw/zana/mwongozo-tin/mauritania/
File: sw/zana/mwongozo-tin/mauritania/index.html
Current score: 55
Category: VAT & Business Tax

Goal:
Turn Mauritania NIF | Mwongozo wa TIN kwa Kiswahili into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against Taxngr, TaxCalc.ng, Zoho, Wave, invoice calculators, and SME compliance tools.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add business-specific inputs, country/currency selectors, tax or fee assumptions, revenue/cost fields, and validation.
- Show result breakdown, methodology, business next steps, recordkeeping checklist, and copy/export summary.
- Include current-rate source/freshness notes and tax/business disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows zana-mwongozo-tin-mauritania-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/zana/mwongozo-tin/mauritania/.
```

## 254. zana-mwongozo-tin-niger-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id zana-mwongozo-tin-niger-sw from D to A-grade.
Route: /sw/zana/mwongozo-tin/niger/
File: sw/zana/mwongozo-tin/niger/index.html
Current score: 55
Category: VAT & Business Tax

Goal:
Turn Niger NIF | Mwongozo wa TIN kwa Kiswahili into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against Taxngr, TaxCalc.ng, Zoho, Wave, invoice calculators, and SME compliance tools.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add business-specific inputs, country/currency selectors, tax or fee assumptions, revenue/cost fields, and validation.
- Show result breakdown, methodology, business next steps, recordkeeping checklist, and copy/export summary.
- Include current-rate source/freshness notes and tax/business disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows zana-mwongozo-tin-niger-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/zana/mwongozo-tin/niger/.
```

## 255. zana-mwongozo-tin-sao-tome-and-principe-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id zana-mwongozo-tin-sao-tome-and-principe-sw from D to A-grade.
Route: /sw/zana/mwongozo-tin/sao-tome-and-principe/
File: sw/zana/mwongozo-tin/sao-tome-and-principe/index.html
Current score: 55
Category: VAT & Business Tax

Goal:
Turn Sao Tome na Principe NIF | Mwongozo wa TIN kwa Kiswahili into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against Taxngr, TaxCalc.ng, Zoho, Wave, invoice calculators, and SME compliance tools.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add business-specific inputs, country/currency selectors, tax or fee assumptions, revenue/cost fields, and validation.
- Show result breakdown, methodology, business next steps, recordkeeping checklist, and copy/export summary.
- Include current-rate source/freshness notes and tax/business disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows zana-mwongozo-tin-sao-tome-and-principe-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/zana/mwongozo-tin/sao-tome-and-principe/.
```

## 256. zana-mwongozo-tin-somalia-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id zana-mwongozo-tin-somalia-sw from D to A-grade.
Route: /sw/zana/mwongozo-tin/somalia/
File: sw/zana/mwongozo-tin/somalia/index.html
Current score: 55
Category: VAT & Business Tax

Goal:
Turn Somalia TIN | Mwongozo wa TIN kwa Kiswahili into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against Taxngr, TaxCalc.ng, Zoho, Wave, invoice calculators, and SME compliance tools.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add business-specific inputs, country/currency selectors, tax or fee assumptions, revenue/cost fields, and validation.
- Show result breakdown, methodology, business next steps, recordkeeping checklist, and copy/export summary.
- Include current-rate source/freshness notes and tax/business disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows zana-mwongozo-tin-somalia-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/zana/mwongozo-tin/somalia/.
```

## 257. zana-mwongozo-tin-south-sudan-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id zana-mwongozo-tin-south-sudan-sw from D to A-grade.
Route: /sw/zana/mwongozo-tin/south-sudan/
File: sw/zana/mwongozo-tin/south-sudan/index.html
Current score: 55
Category: VAT & Business Tax

Goal:
Turn Sudan Kusini TIN | Mwongozo wa TIN kwa Kiswahili into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against Taxngr, TaxCalc.ng, Zoho, Wave, invoice calculators, and SME compliance tools.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add business-specific inputs, country/currency selectors, tax or fee assumptions, revenue/cost fields, and validation.
- Show result breakdown, methodology, business next steps, recordkeeping checklist, and copy/export summary.
- Include current-rate source/freshness notes and tax/business disclaimer.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows zana-mwongozo-tin-south-sudan-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/zana/mwongozo-tin/south-sudan/.
```

## 258. burundi-sw

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id burundi-sw from D to A-grade.
Route: /sw/burundi/
File: sw/burundi/index.html
Current score: 56
Category: Uniquely African

Goal:
Turn Vikokotoo Burundi 2026 - Kodi ya Mshahara na Fedha into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against leading Uniquely African tools, official references where applicable, and polished workflow-first calculators.

Requirements:
- Preserve natural Swahili with no English leakage. Keep labels, helper text, and results clear for Swahili-speaking users.
- Add complete user inputs, validation, clear output, assumptions, and scenario comparison.
- Show methodology, next steps, related links, and copy/export summary.
- Include source/freshness notes and an appropriate disclaimer for the domain.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows burundi-sw as rank A with score >= 85, browserOk true, and no console/page errors on /sw/burundi/.
```

## 259. calculateur-jamb-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id calculateur-jamb-fr from D to A-grade.
Route: /fr/tools/calculateur-jamb
File: fr/tools/calculateur-jamb/index.html
Current score: 56
Category: Education

Goal:
Build a student-first learning or verification workflow for Calculateur JAMB, with diagnosis, guidance, and next steps.

Competitive benchmark:
Benchmark against exam prep apps, score calculators, study planners, and high-quality student dashboards.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add guided inputs, topic or score breakdown, weak-area diagnosis, timetable or action plan, and related learning links.
- Show a clear result panel, next-step checklist, copy/export summary, and student-friendly explanations.
- Include source/freshness notes for syllabus, score, or eligibility assumptions and avoid claiming official status without evidence.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows calculateur-jamb-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/calculateur-jamb.
```

## 260. calculateur-waec-fr

```text
Work in C:\Users\Oza\Documents\afrotools.

Upgrade tool id calculateur-waec-fr from D to A-grade.
Route: /fr/tools/calculateur-waec
File: fr/tools/calculateur-waec/index.html
Current score: 56
Category: Education

Goal:
Turn Calculateur WAEC et NECO into a complete, workflow-first tool for the exact user problem implied by the tool name.

Competitive benchmark:
Benchmark against exam prep apps, score calculators, study planners, and high-quality student dashboards.

Requirements:
- Preserve natural French with no English leakage. Use French labels, helper text, methodology, disclaimers, and output copy.
- Add guided inputs, topic or score breakdown, weak-area diagnosis, timetable or action plan, and related learning links.
- Show a clear result panel, next-step checklist, copy/export summary, and student-friendly explanations.
- Include source/freshness notes for syllabus, score, or eligibility assumptions and avoid claiming official status without evidence.
- Repair the source page only unless a shared source helper is clearly responsible. Do not hand-edit dist/ or generated artifacts.
- Keep the page visually consistent with AfroTools shared CSS, accessible on mobile, and free of overlapping text or controls.

Validation and approval:
- Run npm run audit.
- Run npm run check-links.
- Run npm run tools:quality:browser -- --concurrency=6 --timeout=7000.
- Approve only if reports/tool-quality-ranking.json shows calculateur-waec-fr as rank A with score >= 85, browserOk true, and no console/page errors on /fr/tools/calculateur-waec.
```
