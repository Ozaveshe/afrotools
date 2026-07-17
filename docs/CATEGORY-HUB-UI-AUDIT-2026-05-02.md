# Category Hub UI Audit - 2026-05-02

## Scope

Scanned top-level category and hub pages with `index.html`, focusing on visible hero/banner legibility, product clarity, source-file maintainability, and mobile-safe layout patterns.

## Beautified In This Pass

- `agriculture/index.html`
- `assets/css/agriculture-hub-polish.css`
- `telecom/index.html`
- `assets/css/telecom-hub-polish.css`

The Agriculture hub was selected because it was clean in the worktree, already had a taxonomy-backed product model, and needed a more user-facing first viewport. Telecom followed because it had high-visibility mojibake icons, weak first-action routing, and a hero that needed a more useful decision cockpit.

## High-Priority UI Work

1. Hero and banner contrast pass
   - Many dark heroes use low-opacity white text for breadcrumbs, subtitles, and metadata.
   - Common risky patterns include `rgba(255,255,255,.35)`, `.55`, and `.65` on dark gradients.
   - Start with `api/`, `tanzania/`, country hubs using `.hub-hero`, and older category hubs with custom hero CSS.

2. Mojibake and broken icon cleanup
   - Several pages show mojibake/broken emoji strings in visible cards and headings.
   - Highest visibility examples found in `telecom/`, `energy/`, `transport/`, `afrowork/`, and some translated/category surfaces.
   - Prefer inline SVG, existing tool images, or plain text labels over emoji where the page already has encoding risk.

3. Category hub composition standard
   - Many hubs are still large card grids with weak routing logic.
   - Standardize a pattern: hero value prop, first-action workflow strip, flagship tools, use-case lanes, full registry/listing, FAQ.
   - Agriculture is now a useful reference for this direction.

4. Visual asset pass
   - Several hubs rely entirely on gradients and text.
   - Add relevant first-viewport images where the category benefits from real visual context: agriculture, transport, cars, documents, health, education, energy.
   - Avoid decorative blobs or abstract SVG-only hero art.

5. Design-system alignment
   - Some pages load only tokens/global or custom CSS.
   - Pull `assets/css/design-system.css` in before page CSS for high-value category hubs.
   - Replace one-off hardcoded colors with design tokens or scoped category variables.

6. Mobile layout and text containment
   - Scan compact hero badges, stat bars, and card titles for overflow.
   - Replace fixed four-column stat bars with responsive grids.
   - Keep actions at comfortable tap sizes and avoid tiny low-contrast metadata.

## Recommended Next Hubs

- `telecom/`: first pass complete. Remaining work is deeper per-tool routing and browser screenshot verification after a broader category pass.
- `energy/`: strong product direction already started, but visible encoding problems and mixed CSS layers need cleanup.
- `transport/`: high-value category with many visible tools; needs workflow lanes, better visual hierarchy, and encoding cleanup.
- `language/`: large hub with strong potential; needs visual polish and stronger first-viewport clarity.
- Country hubs using shared `.hub-hero`: run a batch contrast fix for breadcrumbs, subtitles, and stat chips after one manual reference pass.

## Validation Notes

- Use `npm run audit` for registry safety after category hub edits.
- Use `npm run check-links` only when routing changes; it is currently noisy with unrelated legacy failures.
- Prefer source pages and CSS. Do not patch `dist/`, minified bundles, or generated sitemap output for visual fixes.
