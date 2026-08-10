# Swahili PAYE surgical parity evidence

- Frozen base: `2f5fb8988ddd40e28eb17123fe653b18ff0801c3`
- Branch: `codex/sw-final-finance-eng-transport-20260809`
- Bounded scope: 13 PAYE owners only
- Acceptance: **13/13 routes accepted; 0 PAYE routes left**
- Deferred unchanged scope: pension, business planner, four guides, AfroDraft, AfroPlan, architectural fee, PAYE directory, and car intelligence
- Physical deletions: **0**
- Release actions: no push, PR, merge, deploy, sitemap, coverage ledger, AI map, redirect, service worker, or broad generated-output change

## Product implementation

The 13 Swahili pages preserve the frozen-base editorial, FAQ, schema, and internal-link surface. The generator replaces only the obsolete calculator/workflow region and removes the legacy lead modal and calculator scripts. Each owner now exposes:

The readable calculation owner is `engines/src/sw-final-paye-engine.js`; `engines/sw-final-paye-engine.js` is its generated minified public runtime. Page behavior is wired by `assets/js/pages/sw-final-paye.js`, and `scripts/build-sw-final-paye.js` owns the surgical 13-page output.

- gross salary, monthly/annual period conversion, and five salary presets;
- country-specific option branches;
- calculate, invalid-input handling, reset, and net-to-gross search;
- gross, taxable income, tax, contribution, and net breakdown plus an accessible stacked chart;
- local copy, save, reopen, print, and deterministic explanation;
- parsed/reopened JSON, CSV, TXT, and PDF exports without registration or email capture;
- optional AI explanation disabled until explicit consent, with a minimal numeric payload and complete local fallback;
- official source, formula-review date, freshness state, planning boundary, preserved FAQ, schema, and internal links.

Country option branches are preserved as follows: Nigeria has NTA/PITA, pension, NHF, NHIS, rent, life-assurance, and mortgage-interest branches; South Africa has age, retirement, medical-members, and UIF branches; Morocco has CNSS and AMO; Tunisia has CNSS and the capped salary deduction; Madagascar has CNaPS and dependants; Sierra Leone has NASSIT and secondary employment; the other seven profiles expose the applicable employee-contribution toggle.

## Formula reconciliation

The first adversarial comparison found **6/13 incorrect profiles**. Nigeria, South Africa, Morocco, Tunisia, Madagascar, and Sierra Leone were corrected against the actual English owners and cited authority contracts. Sixteen fixed parity fixtures cover all 13 profiles plus the material optional branches; all pass.

Tunisia follows the Ministry of Finance table reviewed 2026-08-09: 0% through TND 5,000; 26% from TND 5,000.001 to 20,000; 28% from TND 20,000.001 to 30,000; 32% from TND 30,000.001 to 50,000; and 35% above TND 50,000. The Ministry's 10% salary deduction capped at TND 2,000 per year is implemented. The obsolete 34% band, split 5,000-10,000 and 10,000-20,000 bands, and generic TND 1,200 personal deduction were removed from the Swahili owner. CNSS 9.18% is visibly identified as a planning assumption requiring payroll confirmation.

## Deliberately removed controls

- email/name/Netlify lead capture, hidden bot fields, and email-gated PDF actions;
- consentless chat sends and unsafe salary/profile payloads;
- duplicate sliders, duplicate chart toggles, dead modal actions, and legacy scripts that competed with the maintained engine;
- the obsolete share action, replaced by local copy, print, and four portable exports.

These removals explain lower raw control counts on some routes; they do not remove legitimate calculation branches or outputs.

## Content and feature retention

Visible non-script word retention by owner:

| ID | Before | After | Retained |
|---|---:|---:|---:|
| ng-paye | 1,511 | 1,439 | 95.2% |
| za-paye | 1,516 | 1,330 | 87.7% |
| ma-paye | 986 | 903 | 91.6% |
| dz-paye | 1,022 | 954 | 93.3% |
| tn-paye | 924 | 887 | 96.0% |
| ly-paye | 877 | 825 | 94.1% |
| sd-paye | 852 | 830 | 97.4% |
| mz-paye | 985 | 922 | 93.6% |
| na-paye | 859 | 777 | 90.5% |
| mg-paye | 774 | 678 | 87.6% |
| cd-paye | 701 | 704 | 100.4% |
| cg-paye | 749 | 750 | 100.1% |
| sl-paye | 1,281 | 1,156 | 90.2% |

Every page has at least as many H2 sections, links, and schema blocks as its frozen-base owner. The detailed machine-readable before/after metrics are in `reports/sw-final-paye-static-receipt.json`.

## Source and freshness ledger

| Owner | Primary authority/source | Formula review |
|---|---|---:|
| Nigeria | https://www.nrs.gov.ng/uploads/NIGERIA_TAX_ADMINISTRATION_ACT_2025_8c945071a7.pdf | 2026-03-01 |
| South Africa | https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/ | 2026-01-01 |
| Morocco | https://www.finances.gov.ma/Publication/dgi/2025/CGI-2026-FR.pdf | 2025-01-01 |
| Algeria | https://www.mfdgi.gov.dz/ | 2026-04-06 |
| Tunisia | https://www.finances.gov.tn/fr/apercu-general-sur-la-fiscalite | 2026-08-09 |
| Libya | https://mof.gov.ly/ | 2026-08-09 |
| Sudan | https://tax.gov.sd/en/tax-laws/ | 2026-01-01 |
| Mozambique | https://www.at.gov.mz/por/Comercio-Internacional/Procedimento-Fiscais/Taxas-IRPS | 2026-04-06 |
| Namibia | https://www.itas.namra.org.na/ | 2026-01-01 |
| Madagascar | https://www.impots.mg/explorer?path=/legislation/Codes%20et%20Manuels/CDI-LFI%202026.pdf | 2026-03-28 |
| DR Congo | https://dgi.gouv.cd/teledeclaration/ | 2026-04-06 |
| Republic of Congo | https://impots.gouv.cg/portail-client-web/public/accueil.xhtml | 2026-03-28 |
| Sierra Leone | https://nra.gov.sl/ | 2026-04-01 |

Rows older than 90 days render `data-source-status="stale"` and instruct the user to confirm current official rates. Authority reachability checked on 2026-08-09 is explicitly not treated as substantive rate verification.

## Validation

- `node scripts/build-sw-final-paye.js --check` — 13/13 owners and 13/13 reciprocal pairs current.
- `node tests/sw-final-paye.test.js` — 13/13 owners and 16/16 formula fixtures pass.
- focused one-worker Chromium — 15/15 tests pass: all 13 workflows, portable export reopen/parse, invalid/reset, privacy, consent payload, 320/375/effective-200% layout, themes, keyboard, console, resources, SEO, schema, and artwork.
- Repository i18n, hreflang, links, lint, type, whitespace, and zero-deletion gates are recorded in the coordinator handoff.
