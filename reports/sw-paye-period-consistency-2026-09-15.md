# Swahili PAYE period consistency

## Repair boundary

Owner: `assets/js/pages/sw-final-paye.js`, shared by 13 Swahili PAYE calculators. Engines, tax profiles, source dates and acceptance ledgers are unchanged.

- The calculated result now records its selected input period. Display, copy, local explanation and JSON/CSV/TXT/PDF exports use that same period. Exports retain `calculationPeriod` to distinguish the underlying profile basis.
- Editing the period control without recalculating does not relabel the previous result. Legacy saved calculations recover the period from their saved inputs.
- Invalid gross input and reset clear the result, breakdown, chart and previous explanation.
- A new valid calculation clears previous explanation text. Consented AI requests retain canonical calculation values and now disclose their explicit `period`.
- Morocco's already calculated CNSS and AMO values are displayed separately and included in exports. No contribution calculation was introduced.

## Reproduced before repair

At `/sw/morocco/kikokotoo-kodi-mshahara/`, monthly gross 10,000 showed net MAD 7,706.77, but Copy returned unlabeled net MAD 92,481.18 and local explanation described gross MAD 120,000. TXT exported annual figures. Algeria and Tunisia also exported annual values after monthly selection.

After a valid result, submitting gross 0 cleared only the headline; the old breakdown and chart remained visible.

## Separate unresolved source-owner divergence

Browser comparison of annual gross 120,000 with default deductions:

| Country | English net | Swahili net |
|---|---:|---:|
| Morocco | MAD 92,852 (rounded display) | MAD 92,481.18 |
| Algeria | DZD 109,200 | DZD 109,200 |
| Tunisia | TND 117,000 | TND 75,939.60 |

English Morocco `morocco/ma-paye.html` computes a different CNSS cap and omits employee AMO; the CNSS toggle also changes displayed rows without disabling its deduction. English Tunisia `tunisia/tn-paye.html` models CNPS 2.5% while the Swahili `engines/src/sw-final-paye-engine.js` profile models CNSS 9.18% and a salary deduction. These are observed implementation differences, not findings about current tax law. Official-source review is required before selecting or changing a calculation owner. No rates were aligned blindly.

Swahili still lacks the English employer-cost and per-band presentation. No sector selector exists in either of the reviewed English or Swahili forms. These remain separate scope.

## Verification

- `node -c assets/js/pages/sw-final-paye.js`
- `node tests/sw-final-paye.test.js` (existing engine/source contracts)
- Chromium `tests/e2e/sw-paye-period-consistency.spec.js`: annual versus monthly totals for Morocco, Algeria and Tunisia; copied text; local explanation; reopened JSON/CSV/TXT and parsed PDF; saved-result period; invalid-state clearing; 320px layout.
- Chromium `tests/e2e/sw-final-paye.spec.js`: regression workflows across all 13 shared-owner countries plus consent and reflow checks.
- `git diff --check`

The 13-country regression run passed 12 calculation/export workflows but failed Sierra Leone's existing no-POST assertion. A read-only Playwright route override serving the pre-change `HEAD:assets/js/pages/sw-final-paye.js` reproduced POSTs to `analytics.google.com/g/collect`, `stats.g.doubleclick.net/g/collect`, and `www.google.com/measurement/conversion` with analytics consent set to declined. No salary values were observed in those requests. The assertion is preserved and this remains a separate baseline analytics issue. The subsequently skipped AI-consent and 13-owner reflow checks were run separately and passed.

The old Node `pdf-parse` parser reported `bad XRef entry` even for a fresh PDF generated independently by the vendored pdf-lib library. Download verification therefore uses the repository's vendored PDF.js browser parser to extract and assert the actual period and totals, in addition to reopening bytes and validating the xref marker. No PDF generator workaround or new dependency was added.

No deployment, official-source refresh or central acceptance change was performed. Repository verification does not establish production state.

Final focused run: 4/4 Chromium tests passed (three period/export workflows plus AI consent and explicit period). Existing clipboard handling still announces success when clipboard access fails; this baseline feedback issue remains outside this repair.
