# Analytics-led UX continuation — 2 October 2026

## Priority evidence

Authenticated GA4 Pages and screens report for AfroTools property `528083834`,
4 September–1 October 2026, All Users, 100% of available data. The report showed
4,127 page views and 1,853 active users across 1,000 reported page paths.
These are visits, not proof of completed tool use, customer demand, or a mobile funnel.

| Page path | Views | Active users |
| --- | ---: | ---: |
| `/` | 235 | 100 |
| `/tools/market-days/` | 127 | 100 |
| `/tools/naira-to-words/` | 101 | 37 |
| `/tools/amount-words-gh/` | 93 | 47 |
| `/tools/lobola-calculator/` | 71 | 42 |
| `/uganda/ug-paye` | 61 | 41 |
| `/tools/afcon-predictor/` | 54 | 42 |
| `/dashboard/` | 53 | 21 |
| `/tools/afrokitchen/` | 46 | 11 |
| `/eswatini/sz-paye` | 45 | 25 |

Existing kitchen, PDF, Atlas, and publisher work retains its ownership. This batch
addresses two independently reproduced issues on frequently visited routes.

## Reproduced issues and changes

### Lobola

On the live 390px page, summary actions started approximately 4,010px below the
result container; the planner started at approximately 1,090px. Users had to pass
the livestock illustration and several result sections before keeping a summary.

- Put the planning budget and existing summary actions before the illustration and supporting sections.
- Use two columns for compact mobile metrics and actions, with wrapping labels and at least 44px controls.
- Add an Edit amounts button that focuses and reveals the existing base amount field.
- Use native disclosures for secondary country links and introductory explanation.
- Keep the cultural disclaimer visible before the planner.
- Add the main landmark and a semantic planner heading; retain the shared theme and focus styles.

Native browser verification at 390px measured actions approximately 339px below
the result and the planner at approximately 698px. Narrow Safari rendering and
long button labels were corrected during testing. The existing calculation,
validation, copy/share, save, TXT, and print script is byte-identical to the base
apart from the new focus-only edit shortcut.

### Eswatini PAYE

The live ENPF deduction toggle and tax-band disclosure were clickable `div`
elements with neither a keyboard stop nor an announced state.

- Replace them with native buttons.
- Synchronize `aria-pressed` with the pension toggle and `aria-expanded` with the bands disclosure.
- Connect the disclosure to its panel and retain visible keyboard focus.

The protected inline calculation script remains byte-identical to the baseline.
State announcements are updated by the native buttons' HTML event handlers.
This preserves the reviewed formula digest while making both controls keyboard usable.

Tax bands, deduction formulas, source evidence, calculation modes, annual/monthly
presentation, and optional AI behavior are preserved. Checks use synthetic salary
values and block third-party requests; they do not re-certify the tax rules.

## Validation

- PASS: 18 Lobola layout/workflow cases across Chromium, Firefox and WebKit at 320px, 390px and 1280px, light/dark themes. Checks cover text clipping, bounded controls, result/action distance, keyboard disclosures/editing, current TXT download, large amounts, and axe checks for the touched result region.
- PASS: 22 existing Lobola validation/export/failure/race/parsed-PDF regressions in Chromium.
- PASS: 6 Eswatini browser checks for keyboard controls, annual/monthly and gross/net consistency, Swahili continuity, and English/French source evidence.
- PASS: 4 additional Eswatini keyboard cases in Firefox and WebKit, light/dark themes.
- PASS: Lobola cluster contract and 2 Eswatini verification unit checks.
- PASS: calculation-quality gate — 798 artifacts, 417/417 fixtures, no stale dataset warnings; the reviewed Eswatini formula digest is unchanged.
- PASS: link audit — 151,511 internal links across 11,933 HTML files.
- Release artifact, security, and production evidence are recorded in the publisher handoff separately.

Automated axe checks cover the changed result region, not a site-wide accessibility certification.
Static mobile risk findings require browser reproduction before source changes.
The full static scan covered 11,857 HTML files and flagged 2,604 for browser triage.
These include generated translations and templates, not just public routes. The
focused scan covered 13 high-priority pages. Its homepage collapse flag did not
reproduce at 700px: the rendered hero collapsed without overflow, and keyboard
search reached the Lobola calculator. A zero static score does not prove runtime accessibility,
as the Eswatini keyboard issue demonstrates.
No routes, canonicals, hreflang targets, analytics event names, tax assumptions,
private-data transmission, or account/export gates are introduced by this batch.
