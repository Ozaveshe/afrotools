# V3 Accessibility Before

Command: `node scripts/comprehensive-quality-crawl.js`

Evidence:

- `audit-results/v3-accessibility-before-crawl.txt`
- `audit-results/v3-accessibility-before-crawl.json`

Before fixes:

- Pages audited: 8501
- Accessibility issue pages: 699
- Total accessibility issues: 2406
- `input_label`: 2381
- `button_name`: 22
- `iframe_title`: 2
- `missing_lang`: 1

Main causes:

- Reusable and generated forms had inputs/selects without explicit accessible names.
- The crawl counted controls inside JS template strings as real DOM controls.
- The crawl did not recognize wrapped labels as valid label associations.
- A small number of older PDF/editor/app shell icon buttons had no accessible name.
- `cabo-verde/index.html` had missing language metadata.
