# v5 43e6f10 Landed Commit Classification

## Scope

Commit: `43e6f10 chore: ship automation and quality audit updates`

Observed from `git show --stat`, `git show --name-status`, and `git diff 43e6f10^ 43e6f10 --name-only`.

- Changed files: 8,746
- Diff size: 3,410,063 insertions, 125,236 deletions
- Classification source: `audit-results/v5-43e6f10-classification.json`

## Classification

| Group | Count | Decision | Notes |
| --- | ---: | --- | --- |
| Core source code | 15 | Keep, but should have been split | Includes workflow changes, `package.json`, registry data, Netlify functions, and shared component JS. These are reviewable only as a separate source commit. |
| Styles | 8 | Keep | Includes global/mobile/dark-mode style fixes in `assets/css/design-system.css`, `global.css`, `theme-dark.css`, `tokens.css`, `vat-calculator.css`, and related category CSS. These support the v3 mobile/dark-mode claims. |
| Scripts | 20 | Keep and split | Includes crawl, mobile audit, dark-mode audit, accessibility fixers, copy audit, registry pruning, bundle update, and source-truth automation scripts. Product-quality scripts and automation/source-ledger scripts should be separate commits. |
| Tests | 4 | Keep | Adds product-quality Playwright coverage and automation smoke coverage. These are directly tied to the v3/v4 QA claims. |
| Content/localization/static HTML | 8,437 | Safe only if treated as generated/post-processed output | This is the main reviewability problem. It appears to be generated or post-processed site output across English, localized, country, category, and tool pages. It should not be reviewed as hand-authored page edits. |
| Generated output | 3 | Keep if regenerated from current source | `data/search-index.json`, `data/tool-directory.json`, and `service-worker.js` are expected generated artifacts if this repo commits them. |
| Audit artifacts | 176 | Keep as evidence, separate from product code | Useful for release evidence, but should not be mixed with source fixes in a normal review. |
| Screenshots/reports | 72 | Keep as evidence or external artifact | Dark-mode screenshots are useful audit proof, but belong in a separate evidence commit or artifact store. |
| Minified/generated assets | 6 | Keep only with source parity | Minified CSS/JS must match their source files and should be regenerated, not hand-edited. |
| Suspicious/unrelated work | 5 | Needs human review | `data/audits/public-claim-registry.json`, `data/automation/automation-registry.json`, `data/scholarships/official-sources.json`, `docs/AUTOMATION-REGISTRY.md`, and `llms-full.txt` are not obviously required for the v3 mobile/dark/accessibility fixes. |

## Bottom Line

`43e6f10` contains real v3 quality work, but it also bundled generated output, audit evidence, automation/source-truth work, and suspicious carryover. It should not be used as a model for future release packaging. Because it already landed and current verification is green, the safer path is not a blind revert. The safer path is follow-up cleanup and manual owner review of the unrelated/suspicious areas.
