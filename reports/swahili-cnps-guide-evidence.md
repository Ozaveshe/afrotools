# Swahili CNPS Côte d’Ivoire guide parity evidence

Checked: 2026-08-09

Lane base: `8f4d170bd6af95f7646a42cb9cd87c6a65552052`

English id: `cnps-guide`

## Exact ownership

- English owner: `/tools/cnps-guide/` (`tools/cnps-guide/index.html`).
- Native Swahili owner: `/sw/zana/mwongozo-wa-cnps/` (`sw/zana/mwongozo-wa-cnps/index.html`).
- Existing French reciprocal owner: `/fr/tools/guide-de-la-cnps-en-cote-d-ivoire/`.
- All three owners keep the exact English, French, Swahili, and x-default hreflang cluster. English remains x-default.
- English and Swahili use the existing real `assets/img/og-default.png` artwork; no missing or fabricated image path was introduced.

## Country and agency boundary

This guide covers only Côte d’Ivoire and the Caisse Nationale de Prévoyance Sociale de Côte d’Ivoire. A similarly named CNPS or social-security institution in another country stops the workflow. It does not reuse Côte d’Ivoire tasks, rates, forms, schedules, or RSTI rules for another jurisdiction.

The guide does not register an employer or worker, decide benefit eligibility or approval, calculate an official contribution, access a live account, file a declaration or DISA, or take a payment. It has no field for a CNPS number, identity, family records, salary, payroll file, password, contribution call, or payment data.

## Complete local workflow

The shared DOM-free engine and native English/Swahili workspace cover seven exact tasks:

1. Employer affiliation.
2. Worker declaration.
3. Contribution branches.
4. Contribution bases and ceilings.
5. Declaration and remittance.
6. Annual DISA.
7. Independent-worker RSTI.

Every task produces a four-step checklist, official task route, source state, and privacy boundary. Country/agency mismatch, unknown remittance band, unconfirmed sector risk, or unconfirmed RSTI identity stops before an official route is offered. Employers with 20 or more workers receive the official-page monthly schedule; those below 20 receive the quarterly schedule. No amount or official liability is calculated.

The workspace supports local save/load, reset, progress tracking, copy, JSON/TXT/PDF export, and JSON import/reopen. All exports are ungated and generated locally. There is no AI or other network send.

## Official source review

The following Côte d’Ivoire CNPS primary sources were checked on 2026-08-09:

- Employer rules, contribution shares, first-day worker declaration, worker-count schedules, remittance and DISA: https://www.cnps.ci/employeur/
- January 2023 floor and branch-specific ceilings notice: https://www.cnps.ci/wp-content/uploads/2023/01/NOUVEAU-PLAFOND-DES-COTISATIONS-SOCIALES-DE-LA-CNPS.pdf
- Current downloadable forms: https://www.cnps.ci/services-en-ligne/formulaires-telechargeables/
- Current official guides: https://www.cnps.ci/nos-guides/
- e-DISA guidance: https://www.cnps.ci/services-en-ligne/e-disa/
- Independent-worker legal and regulatory index: https://www.cnps.ci/services-en-ligne/textes-legaux-et-reglementaires/
- Independent-worker route: https://www.cnps.ci/independant/
- Official e-CNPS portal: https://e.cnps.ci/connexion

The specific January 2023 notice is treated as the controlling published source for the 75,000 FCFA monthly floor, 3,375,000 FCFA retirement ceiling, and 75,000 FCFA ceiling for family, maternity, and work-accident/occupational-disease branches. The guide explicitly warns that the general employer page still shows legacy values. The reviewed source pack expires after 90 days unless the user confirms a fresh official-page review.

## Surface preservation

| Surface | Bytes before | Bytes after | Visible words before | Visible words after | H2 before/after | Controls before/after | Actions before/after |
|---|---:|---:|---:|---:|---:|---:|---:|
| English | 15,824 | 20,638 | 711 | 890 | 9 / 10 | 0 / 20 | 0 / 8 |
| Swahili | 11,180 | 15,983 | 628 | 810 | 8 / 9 | 0 / 20 | 0 / 8 |

No editorial guide, contribution table, FAQ/schema, internal link, or official-source section was removed. The workspace was inserted before the existing guide.

## Verification

- `node --test tests/cnps-guide-parity.test.js`: **9/9 passed**.
- `node scripts/build-source-registry.js --only-source-ids=cnps-ci-guide-source --as-of=2026-08-09 --check`: **passed**.
- `node scripts/build-i18n.js --validate`: **all four locale key contracts passed**.
- `npm run lint`: **passed**.
- `npm run type-check`: **passed**.
- `tests/e2e/sw-cnps-guide.spec.js`, Chromium, one worker: **5/5 passed**.
  - Full English and Swahili remittance workflows.
  - JSON parsed and reopened with checklist state preserved.
  - TXT decoded and content-checked.
  - PDF signature and extracted text parsed with `pdf-parse`.
  - Country/agency, schedule, sector-risk, and RSTI fail-closed states.
  - Invalid-form constraints, reset, and local save/load.
  - No unexpected network egress, console errors, or page errors.
  - 320px and 375px, 200% root text, light/dark themes, reduced motion, keyboard focus, accessible names, and no horizontal overflow.
- `git diff --check`: **passed**.
- `git diff --diff-filter=D --summary`: **zero physical deletions**.

## Scope boundary

No coordinator acceptance ledger, AI route map, locale coverage, sitemap, redirect, service worker, broad generated output, push, PR, merge, deploy, Supabase state, or live system was changed.
