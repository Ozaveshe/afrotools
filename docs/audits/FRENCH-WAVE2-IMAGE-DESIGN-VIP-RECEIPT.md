# French Wave 2 — Image & Design VIP Receipt

Date: 2026-07-28
Branch: `codex/fr-wave2-image-design-repair`
Scope: French Image & Design only
Starting integration SHA: `bdde135c9cdce085591da152ddb1097830667c77`

## Acceptance

| Measure | Accepted | Left |
|---|---:|---:|
| Category hub | 1 | 0 |
| Canonical French app equivalents | 19 | 0 |
| Browser workflow outputs reopened | 19 | 0 |
| Canonical artwork | 19 | 0 |

The 19 native candidates are accepted because each route received app-specific workflow, output, privacy, accessibility, responsive, dark-mode and SEO proof. Candidate status alone was not used as acceptance.

## Product repairs

- Replaced three preparation shells with complete native French applications:
  - `/fr/tools/recadrer-image/`: image import, free/fixed-ratio crop, exact coordinates and dimensions, rotation, horizontal flip, preview, and PNG/JPEG/WebP export.
  - `/fr/tools/supprimer-arriere-plan/`: local edge and colour-key removal, optional BodyPix person segmentation, background replacement, fallback handling, and PNG/JPEG/WebP export.
  - `/fr/tools/palette-couleurs/`: 46 curated palettes, 230 colours, French category filters, HEX copy, palette CSS, full CSS and JSON exports.
- Made QR generation use the repository-owned QR runtime instead of a remote library and fixed initialization ordering.
- Reconciled the French hub to exactly 19 Image & Design apps; removed its self-row and unrelated locale records from the count.
- Corrected the Image en texte registry ownership from Document & PDF to Image & Design and connected registry rows to their English source IDs and shared artwork.
- Repaired six invalid English comparison links without making English the primary workflow.
- Removed hidden English keyword scorecards and stale copy that presented French as a lesser bridge to an “outil anglais complet”.
- Fixed mobile overflow on Image en texte, Créateur de logo, Carte sociale and Créateur de flyer.
- Fixed accessible names on generated colour controls and completed manual/system dark treatment on older app surfaces.

## App-by-app output proof

All files below were generated through the French route with synthetic inputs, read from the browser download, and reopened where the output is an image.

| English owner | French route | Accepted workflow output |
|---|---|---|
| `image-compress` | `/fr/tools/compresser-image/` | JPEG, 1200×630, 22,975 bytes |
| `image-resize` | `/fr/tools/redimensionner-image/` | PNG, 600×315, 38,205 bytes |
| `qr-generator` | `/fr/tools/generateur-qr/` | PNG, 240×240 |
| `background-remover` | `/fr/tools/supprimer-arriere-plan/` | Transparent PNG, 1200×630, 92,241 bytes |
| `passport-photo` | `/fr/tools/photo-identite/` | PNG, 413×531, 28,081 bytes |
| `image-crop` | `/fr/tools/recadrer-image/` | PNG, 630×630, 42,217 bytes |
| `color-picker` | `/fr/tools/selecteur-couleur/` | PNG, 640×320, 12,168 bytes |
| `favicon-generator` | `/fr/tools/generateur-favicon/` | PNG, 32×32, 875 bytes |
| `image-to-text` | `/fr/tools/image-en-texte/` | UTF-8 TXT, 41 bytes |
| `meme-generator` | `/fr/tools/generateur-memes/` | PNG, 320×320 |
| `logo-maker` | `/fr/tools/createur-logo/` | PNG, 1920×1080, 102,634 bytes |
| `image-filters` | `/fr/tools/filtres-image/` | PNG, 1200×630, 85,964 bytes |
| `social-card` | `/fr/tools/carte-sociale/` | PNG, 1200×630, 558,562 bytes |
| `certificate-maker` | `/fr/tools/createur-certificat/` | PNG, 1400×990, 144,141 bytes |
| `flyer-maker` | `/fr/tools/createur-flyer/` | PNG, 1240×1754, 1,638,798 bytes |
| `thumbnail-maker` | `/fr/tools/createur-miniatures/` | PNG, 1280×720, 616,957 bytes |
| `watermark-bulk` | `/fr/tools/filigrane-images/` | PNG, 1200×630, 109,553 bytes |
| `image-format-convert` | `/fr/tools/convertir-format-image/` | PNG, 1200×630, 92,241 bytes |
| `colour-palette` | `/fr/tools/palette-couleurs/` | JSON, 10,011 bytes; 46 palettes / 230 colours |

## Browser and accessibility proof

- 57 route/viewport combinations passed:
  - 19 routes at 320px in explicit light mode.
  - 19 routes at 375px in explicit dark mode while the system preference remained light.
  - 19 routes at standards-correct 200% reflow: a nominal 1280px viewport exposes a 640 CSS-pixel layout viewport, independently using system dark mode.
- Final matrix: zero document or main-content overflow, zero page errors, zero console errors, `lang="fr"` on every route, and no unfocusable enabled control.
- The hub rendered 19 cards, `19` total, `19` live, `0` pending, with zero mobile overflow.
- Main-form label checks found no unlabeled inputs, selects or textareas.
- French visible-runtime, metadata and schema scan found no residual workflow labels such as Ready, Download, Upload, Copy, Save, Reset, Result, Loading, Error or Batch workflow.
- Reproducible browser specification: `tests/e2e/french-image-design-wave2.spec.js`.
- Raw 57-case and 19-output evidence: `reports/fr-wave2-image-design-browser-evidence.json`.

## SEO, GEO and privacy proof

- Every route has a French title, 80–180 character description, exact self-canonical, reciprocal English/French alternates, `og:locale="fr_FR"` and WebApplication JSON-LD with `inLanguage: "fr"`.
- No internal links are broken, and the repository hreflang contract is reciprocal and indexable.
- Image processing, canvas rendering and exports stay in the browser. Shared consent-controlled metadata analytics may issue page-view or measurement requests, but the scoped workflows do not transmit selected image bytes, filenames, entered/generated content or app payloads. The browser proof inspects every request URL and body for synthetic private markers, filenames, base64 prefixes and PNG signatures; it found zero private payload leaks.
- Background removal’s optional person mode downloads TensorFlow.js and BodyPix from jsDelivr but does not upload the selected image. The page discloses this, and the deterministic edge/colour modes remain local fallback paths.

## Validation

- Focused 19-app workflow and reopened-output browser run: passed 19/19.
- Focused responsive/dark/200%/keyboard/console browser matrix: passed 57/57.
- `node .../@playwright/test/cli.js test tests/e2e/french-image-design-wave2.spec.js --workers=1`: passed, 2/2 suites; raw evidence contains 57/57 matrix rows and 19/19 parsed or reopened primary outputs.
- Focused metadata/artwork/local-network static checks: passed 19/19.
- `npm run audit`: passed; two unrelated pre-existing `africa-tools.com` page gaps remain.
- `npm run check-links`: passed, 126,163 links across 10,837 HTML files.
- `npm run validate:hreflang`: passed, 30,495 relationships / 5,147 equivalence groups.
- `npm run localization:check`: passed, 10,660 pages.
- `npm run lint`: passed.
- `npm run type-check`: passed.
- `git diff --check`: passed.

## Carried risk and boundaries

- Optional BodyPix person segmentation needs network access to jsDelivr and is not an offline guarantee; local edge and colour-key modes are the fail-safe.
- Automated output proof used synthetic images and text. It does not certify photographic cutout quality for every hair texture, lighting condition or complex background; the UI explicitly requires visual inspection.
- This category pass did not edit the master French ledger, generate sitemaps/localized output, merge, or deploy.
