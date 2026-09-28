# Related document cards: reuse text-free artwork

Date: 2026-09-26. Fetched origin/main: `b9591cd19424eee477db576b6d95459da686e4ec`. Coordinator-requested baseline: `d5fdb6764f2c556919f4b42a46d6eb4b23c2f7af`. Isolated branch: `codex/document-related-icons-20260926`.

## User-facing change

Related cards for CV Builder, Invoice Generator and PDF Editor now use the existing text-free document glyph consistently in English, French and Swahili. The previous thumbnails embedded English text despite native card labels. The shared renderer chooses the trusted glyph before creating an image element, so these cards request neither those English images nor the large localized PNGs.

The glyph is the exact 227-byte SVG already owned by `assets/js/lib/category-icons.js`; a source test verifies equivalence. The renderer keeps one copied constant with an explicit owner reference, without a new utility dependency or image asset. The currentColor stroke follows the existing theme token. The icon is decorative/aria-hidden; native anchor names, visible labels, descriptions, routes, focus and card dimensions remain unchanged. The same selection handles SSR tool IDs and lazy resolved image IDs. The whitelist covers only the three identities in EN/FR/SW, including language-region tags.

## Changed files

- `assets/js/components/related-tools.js`: bounded glyph selection/rendering and 48px icon styling.
- `assets/js/components/related-tools.min.js`: generated with the existing minification owner.
- `tests/related-document-artwork.test.js`: exact owner equivalence and text-free/self-contained SVG check.
- `tests/e2e/related-document-artwork.spec.js`: actual native routes, mobile theme/layout/network/ARIA/focus checks and source/minified lazy-alias coverage.
- This report.

No image, localized page/catalog, SEO image manifest, discovery metadata or route is changed. Other cards retain their existing image and error fallback behavior. An independent in-memory comparison against d5fdb676 confirmed identical visual markup (whitespace normalized) for all 1,082 other image-index identities across EN/FR/SW: 3,246 comparisons.

## Validation

PASS:

- `node scripts/minify.js --only=assets/js/components/related-tools.js` — one JS pair; no unrelated generated diff.
- `node tests/related-document-artwork.test.js`.
- `node --check` on source, generated component and browser spec; `git diff --check`.
- Chromium: **11/11 passed in 39.3s**, one worker on isolated source server port4524. Five new artwork cases plus six existing actual native recommendation cases. Command: `node <canonical-node_modules>/@playwright/test/cli.js test tests/e2e/related-document-artwork.spec.js tests/e2e/related-document-language-parity.spec.js --grep 'document recommendation icons|resolved aliases use reviewed|native rendered document recommendations' --workers=1 --output=../evidence/final-browser` with NODE_PATH pointing to canonical dependencies and PLAYWRIGHT_BASE_URL=http://127.0.0.1:4524.

Actual EN/FR/SW form-filler pages were inspected at 320px/390px in both light and dark themes. All twelve states have 48px icons and the existing 112px mobile header height (desktop remains120px). Measured icon contrast: 4.34:1 light, 10.05:1 dark. Selected cards made zero English/localized image requests and produced zero page errors. Native card accessible names/hrefs/visible names and keyboard focus passed. Existing actual form-filler and watermark recommendation cases also passed all six locales/routes and target-link requests. Two isolated lazy cases cover source/minified components, aliased IDs and unchanged unrelated SVG-to-WebP-to-monogram fallback.

Twelve screenshots and three detailed JSON proofs are retained privately in `../evidence/final-browser/`, with `../final-artwork-tests.log` and `../evidence/summary.json`. Six screenshots were visually inspected (every locale in light320 and dark390); other two state combinations per locale have automated geometry/contrast proof and retained screenshots. Existing fixed navbar/newsletter overlays remain visible in the screenshots; they were not hidden or changed. Other document thumbnails still include inherited English artwork and are outside this three-identity scope.

Initial new tests caught incorrect test assumptions, not product regressions: mobile header height is112 rather than the desktop120, and Swahili names must come from the maintained app catalog. Those expectations were corrected; initial failure traces remain under `../evidence/artwork-browser/`. The final run used a distinct evidence directory.

## Payload and limits

Generated component grows from19,371 to20,206 bytes (+835 raw bytes). A visible set of these three cards avoids25,024 raw image-file bytes and three image requests before caching/compression; this is a size comparison, not a network benchmark. No0.9–1.7MB French PNG is connected to small related cards.

No user data, document contents, account writes, analytics event changes or external image generation/editing. Actual-route checks abort cross-origin network requests; lazy-component cases are explicitly synthetic offline fixtures. No full build, deploy artifact audit, broad151 suite, main push or deployment was performed. This is a separately reviewable future candidate; the coordinator's frozen release stays untouched.

Rollback: revert this scoped commit. No flag, storage migration or image deletion is involved.
