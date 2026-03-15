# AfroTools — Tool Audit Log

**Generated:** 2026-03-15
**Source of truth:** `/assets/js/components/tool-registry.js`
**Image directory:** `/assets/img/tools/`

---

## Summary

| Metric | Count |
|---|---|
| Total tools in registry | 368 |
| Live tools | 185 (includes 1 duplicate: `malaria-risk` appears on lines 265 and 389) |
| Planned tools | 160 |
| Queued tools | 23 |
| Tools with card images (.webp) | 43 |
| Tools with SVG placeholders | _(to be filled by another agent)_ |
| Live tools missing .webp images | ~142 (185 live minus 43 with images) |

---

## Image Audit

### Existing .webp Images (43 files in `/assets/img/tools/`)

| # | Filename | Used in homepage HTML | Matching registry ID |
|---|---|---|---|
| 1 | ao-paye.webp | No | ao-paye |
| 2 | bf-paye.webp | No | bf-paye |
| 3 | bi-paye.webp | No | bi-paye |
| 4 | bj-paye.webp | No | bj-paye |
| 5 | bmi-calculator.webp | No | bmi-calculator |
| 6 | bw-paye.webp | No | bw-paye |
| 7 | cf-paye.webp | No | cf-paye |
| 8 | cg-paye.webp | No | cg-paye |
| 9 | ci-paye.webp | No | ci-paye |
| 10 | cm-paye.webp | No | cm-paye |
| 11 | currency-converter.webp | Yes (homepage) | currency-converter |
| 12 | cv-builder.webp | Yes (homepage) | cv-builder |
| 13 | cv-paye.webp | No | cv-paye |
| 14 | dj-paye.webp | No | dj-paye |
| 15 | dz-paye.webp | No | dz-paye |
| 16 | eg-paye.webp | Yes (homepage) | eg-paye |
| 17 | er-paye.webp | No | er-paye |
| 18 | et-paye.webp | No | et-paye |
| 19 | fuel-cost.webp | No | fuel-cost |
| 20 | ga-paye.webp | No | ga-paye |
| 21 | gh-paye.webp | Yes (homepage) | gh-paye |
| 22 | gm-paye.webp | No | gm-paye |
| 23 | gn-paye.webp | No | gn-paye |
| 24 | gq-paye.webp | No | gq-paye |
| 25 | gw-paye.webp | No | gw-paye |
| 26 | image-compress.webp | No | image-compress |
| 27 | import-duty.webp | Yes (homepage) | import-duty |
| 28 | invoice-generator.webp | Yes (homepage) | invoice-generator |
| 29 | japa-calculator.webp | Yes (homepage) | japa-calculator |
| 30 | ke-paye.webp | Yes (homepage) | ke-paye |
| 31 | km-paye.webp | No | km-paye |
| 32 | mobile-money-fees.webp | Yes (homepage) | mobile-money-fees |
| 33 | ng-paye.webp | Yes (homepage) | ng-paye |
| 34 | pdf-workspace.webp | Yes (homepage) | pdf-workspace |
| 35 | qr-generator.webp | No | qr-generator |
| 36 | remittance-compare.webp | Yes (homepage) | remittance-compare |
| 37 | rw-paye.webp | No | rw-paye |
| 38 | sz-paye.webp | No | sz-paye |
| 39 | td-paye.webp | No | td-paye |
| 40 | tz-paye.webp | Yes (homepage) | tz-paye |
| 41 | vat-calculator.webp | Yes (homepage) | vat-calculator |
| 42 | waec-calculator.webp | Yes (homepage) | waec-calculator |
| 43 | za-paye.webp | Yes (homepage) | za-paye |

### PAYE Tools — Image Coverage

**With .webp images (22 countries):**
ao, bf, bi, bj, bw, cf, cg, ci, cm, cv, dj, dz, eg, er, et, ga, gh, gm, gn, gq, gw, ke, km, ng, rw, sz, td, tz, za

**Without .webp images (24 countries — all live in registry):**
cd (DR Congo), km (Comoros has image), lr (Liberia), ls (Lesotho), ly (Libya), ma (Morocco), mg (Madagascar), ml (Mali), mr (Mauritania), mu (Mauritius), mw (Malawi), na (Namibia), ne (Niger), sc (Seychelles), sd (Sudan), sl (Sierra Leone), sn (Senegal), so (Somalia), ss (South Sudan), st (Sao Tome), tg (Togo), ug (Uganda), zm (Zambia), zw (Zimbabwe)

### Utility Tools — Image Coverage

**With .webp images (11 tools):**
bmi-calculator, currency-converter, cv-builder, fuel-cost, image-compress, import-duty, invoice-generator, japa-calculator, mobile-money-fees, pdf-workspace, qr-generator, remittance-compare, vat-calculator, waec-calculator

**Major live utility tools WITHOUT .webp images (sample):**
medical-report, background-remover, passport-photo, solar-calculator, floor-plan, boq-generator, afrodraft, scientific-calc, gpa-calculator, citation-generator, flashcard-maker, exam-countdown, jamb-aggregate, lobola-calculator, electricity-estimator, generator-fuel, ajo-chama, profit-margin, markup-calc, break-even, pomodoro, unit-converter, fuel-tracker, afrorates, and many more (~60+ live /tools/* entries)

---

## Broken Image References

**None found.** All `<img>` tags referencing `/assets/img/tools/` across the codebase use the `.webp` extension and point to files that exist on disk. No `.png` or `.jpg` mismatches were detected.

Image references appear only in:
- `/index.html` (16 images — 6 PAYE + 1 PDF Workspace + 9 utility tools)
- `/afrotools-deploy/index.html` (same 16 images — mirrored copy)

All 16 referenced images resolve to valid files in `/assets/img/tools/`.

---

## Registry vs Pages — Mismatches

### Live Tools With NO HTML Page on Disk

The following tools are marked `status: 'live'` in the registry but have no corresponding `index.html` (or `.html` file) at their `href` path:

| Tool ID | Name | href | Notes |
|---|---|---|---|
| periodic-table | Interactive Periodic Table | /tools/periodic-table | No directory or file found |
| algebra-solver | Algebra Equation Solver | /tools/algebra-solver | No directory or file found |
| matric-points | Matric APS Score Calculator | /tools/matric-points | No directory or file found |
| statistics-calc | Statistics Calculator | /tools/statistics-calc | No directory or file found |
| burial-cost | Funeral Cost Estimator | /tools/burial-cost | No directory or file found |
| school-fees | School Fees Planner | /tools/school-fees | No directory or file found |

### Pages on Disk NOT in the Registry

The following tool pages exist in `/tools/` but have no entry in `tool-registry.js`:

| Directory | Page Exists |
|---|---|
| /tools/mortgage-affordability/ | index.html |
| /tools/rent-vs-buy/ | index.html |
| /tools/property-roi/ | index.html |
| /tools/property-transfer-cost/ | index.html |
| /tools/home-loan-eligibility/ | index.html |
| /tools/home-renovation-cost/ | index.html |
| /tools/first-home-buyer/ | index.html |
| /tools/tithe-offering-calculator/ | index.html |

Note: `mortgage-calculator`, `stamp-duty`, and `rental-yield` exist on disk AND in the registry but are marked `status: 'planned'`, not `'live'`.

### Duplicate Registry Entries

| Tool ID | Lines | Issue |
|---|---|---|
| malaria-risk | Lines 265 and 389 | Appears twice with status 'live' (different phase labels: LIVE vs Phase 5) |
| rental-yield | Lines 361 and 414 | Appears twice with status 'planned' (Phase 4 and Phase 5) |

---

## Recommendations

### High Priority
1. **Create missing pages** for 6 live tools: `periodic-table`, `algebra-solver`, `matric-points`, `statistics-calc`, `burial-cost`, `school-fees` -- these are marked live but have no HTML page.
2. **Add registry entries** for 8 orphan pages: `mortgage-affordability`, `rent-vs-buy`, `property-roi`, `property-transfer-cost`, `home-loan-eligibility`, `home-renovation-cost`, `first-home-buyer`, `tithe-offering-calculator`.
3. **Remove duplicate entries** for `malaria-risk` (line 389) and `rental-yield` (line 414).

### Medium Priority
4. **Generate .webp card images** for the 24 PAYE countries currently missing them (cd, lr, ls, ly, ma, mg, ml, mr, mu, mw, na, ne, sc, sd, sl, sn, so, ss, st, tg, ug, zm, zw).
5. **Generate .webp card images** for high-traffic utility tools without images (medical-report, background-remover, solar-calculator, afrodraft, etc.).

### Low Priority
6. **Audit planned/queued tools** (183 total) for any that should be promoted to live.
7. **Consider adding card images** to the all-tools page and dashboard dynamically from the registry, rather than hard-coding img tags.

---

## Appendix: HTML Image Reference Inventory

All 16 unique `<img src="/assets/img/tools/...">` references found in the codebase:

| File | Image | Exists |
|---|---|---|
| /index.html | ng-paye.webp | Yes |
| /index.html | ke-paye.webp | Yes |
| /index.html | gh-paye.webp | Yes |
| /index.html | za-paye.webp | Yes |
| /index.html | eg-paye.webp | Yes |
| /index.html | tz-paye.webp | Yes |
| /index.html | pdf-workspace.webp | Yes |
| /index.html | currency-converter.webp | Yes |
| /index.html | vat-calculator.webp | Yes |
| /index.html | cv-builder.webp | Yes |
| /index.html | invoice-generator.webp | Yes |
| /index.html | remittance-compare.webp | Yes |
| /index.html | import-duty.webp | Yes |
| /index.html | japa-calculator.webp | Yes |
| /index.html | waec-calculator.webp | Yes |
| /index.html | mobile-money-fees.webp | Yes |

(The same 16 images are duplicated in `/afrotools-deploy/index.html`.)
