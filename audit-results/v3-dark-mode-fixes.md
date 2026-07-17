# V3 Dark Mode Fixes

## Before

Command: `node scripts/dark-mode-visual-audit.js --label=v3-before`

Evidence:

- `audit-results/v3-dark-mode-before.md`
- `audit-results/v3-dark-mode-before.json`
- `audit-results/dark-mode-screenshots/`

Before summary:

- Runs: 72
- Runs with issues: 51
- Total issues: 239
- `text_contrast_light`: 197
- `text_contrast_dark`: 24
- `console_error`: 18

## Fixes

- `tools/unit-converter/index.html`: added dark tokens for cards, controls, result areas, and copy buttons.
- `sw/zana/kubadilisha-vipimo/index.html`: added dark tokens for Swahili converter cards, controls, result areas, copy buttons, and related links.
- `fr/tools/assurance-auto/index.html`: added dark calculator/form/status/table/link guardrails.
- `nigeria/ng-salary-tax.html`: added dark helper/result support for scenario and answer sections.
- `assets/css/vat-calculator.css`: added data-theme dark guardrails for VAT cards, tabs, inputs, results, badges, details, and info panels.
- `assets/css/design-system.css`: added shared VAT prefix/stat label guardrails.
- `assets/css/money-page-commercial.css`: added dark section/card guardrails.
- `assets/css/seo-clusters.css`: added dark cluster/card/answer/FAQ guardrails.
- `scripts/apply-v3-dark-mode-fixes.js`: captured the repeatable dark-mode repair pattern.

## After

Command: `node scripts/dark-mode-visual-audit.js --label=v3-final`

Evidence:

- `audit-results/v3-dark-mode-after.md`
- `audit-results/v3-dark-mode-after.json`
- `audit-results/v3-final-dark-mode-run.txt`

After summary:

- Runs: 72
- Runs with issues: 36
- Total issues: 215
- `text_contrast_dark`: 0
- `text_contrast_light`: 197
- `console_error`: 18

Release interpretation:

- Critical dark-mode readability issues on the sampled core templates are closed.
- Remaining visual-audit issues are light-mode contrast heuristics and static/local console noise, not dark-mode blockers.
