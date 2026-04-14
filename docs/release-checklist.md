# Release Checklist

## Choose Checks By Change Type

### Content or page-only changes

- `npm run check-links`

### Registry, navigation, cards, or discovery changes

- `npm run check-links`
- `npm run audit`

### SEO or metadata changes

- `npm run seo:report`
- Run the narrower SEO script that matches the change if needed

### i18n changes

- `npm run build:i18n:validate`
- `npm run validate:hreflang`

### Car catalog or pricing data changes

- `npm run cars:catalog:refresh`

### Full rebuild or shared asset changes

- `npm run build`
- `npm test`

## Manual Review

- Confirm the touched route renders cleanly.
- Confirm there are no accidental edits to generated files.
- Confirm docs or skills were updated if the workflow changed.
- Confirm any legacy dashboard or cockpit links still point to valid targets.