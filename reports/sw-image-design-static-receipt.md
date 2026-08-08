# Swahili Image & Design candidate receipt

- Base: `6edacda8437e1fa9b9e5a512138cbdd3169e38be`
- Exact English denominator: **19**
- Accepted candidates: **7**
- Fail-closed rows: **12**
- Central ledger edits: **0**
- Verdict: **CANDIDATE COMPLETE**
- Artwork present: **19/19**

## Accepted candidates

- `image-resize` — `/sw/zana/kubadilisha-ukubwa-wa-picha/`: tests/e2e/swahili-image-resize-parity.spec.js: English and Swahili share the exact local batch resizer and produced byte-identical 60x40 PNG output; Swahili PNG, JPG and WebP reopened at exact dimensions; fit, fill, pad and stretch outputs reopened; two synthetic files across two targets produced four reopened downloads at exact 60x40 or 512x512, including Download all; clear/reset, 320/375px, 200% reflow, light/dark, keyboard/focus, SEO, console and no-network checks passed.
- `qr-generator` — `/sw/zana/kitengeneza-qr/`: tests/e2e/swahili-qr-generator-parity.spec.js: shared text/URL/WiFi/vCard payload semantics and escaping passed; invalid/reset states clear output; PNG reopened at 256x256 and SVG parsed as a 1024x1024 vector; 320/375px, 200% reflow, themes, keyboard/focus, SEO, console and no-network checks passed.
- `image-crop` — `/sw/zana/kukata-picha/`: tests/e2e/swahili-image-crop-parity.spec.js: English and Swahili share the exact interactive crop engine and produced byte-identical PNG output; Swahili selection, rotate/flip/reset, local history and localized recipe passed; PNG, JPG and WebP reopened at exact 64x48 dimensions; 320/375px, 200% reflow, light/dark, keyboard/focus, SEO, console and no-network checks passed.
- `color-picker` — `/sw/zana/kichagua-rangi/`: tests/e2e/swahili-image-color-family.spec.js: exact conversions, invalid clearing, CSS/Tailwind downloads parsed, 320/375px, 200% reflow, themes, keyboard/focus, contrast, console and network checks passed.
- `watermark-bulk` — `/sw/zana/watermark-nyingi/`: tests/e2e/swahili-watermark-bulk-parity.spec.js: two synthetic images, full-resolution current and batch PNG downloads parsed and reopened at 64x48 and 40x30; 320/375px, 200% reflow, themes, keyboard/focus, SEO, console and no-network checks passed.
- `image-format-convert` — `/sw/zana/kubadilisha-format-ya-picha/`: tests/e2e/swahili-image-format-convert-parity.spec.js: English and Swahili share the exact local converter and produced byte-identical 60x40 PNG output; Swahili PNG, JPG and WebP files reopened at exact 60x40 dimensions; unsupported AVIF remained disabled; the two-file, three-format ZIP manifest parsed and every nested output reopened; picture markup, 320/375px, 200% reflow, light/dark, keyboard/focus, SEO, console and no-network checks passed.
- `colour-palette` — `/sw/zana/paleti-ya-rangi/`: tests/e2e/swahili-image-color-family.spec.js: all 45 palettes and 225 colors retained; CSS and JSON downloads parsed, filtering/copy, 320/375px, 200% reflow, themes, keyboard/focus, contrast, console and network checks passed.

## Fail-closed rows

- `image-compress` — blocked-feature-parity: The Swahili inline owner handles one image only and does not reproduce the English batch queue, target-size loop, comparison, manifest, or shared studio contract.
- `background-remover` — blocked-english-fallback: The route is an explicit preparation page that hands off to the English studio; no native remover workflow exists.
- `passport-photo` — blocked-feature-parity: The Swahili canvas owner is narrower than passport-photo-studio.js and lacks the English crop, preset, sheet, validation, and export proof surface.
- `favicon-generator` — blocked-missing-route: No physical Swahili route or native favicon/ZIP owner exists on the coordinator base.
- `image-to-text` — blocked-feature-parity: The route performs local OCR but does not reuse the English local OCR/studio owners or reproduce their source, language, clearing, and export contracts.
- `meme-generator` — blocked-missing-route: No physical Swahili route or native meme canvas/export owner exists on the coordinator base.
- `logo-maker` — blocked-feature-parity: The reduced inline canvas does not reproduce the English logo templates, editing surface, quality boundaries, and export contract.
- `image-filters` — blocked-feature-parity: The reduced inline owner does not reuse image-filters-studio.js or reproduce English batch, preset, ZIP, manifest, and export behavior.
- `social-card` — blocked-feature-parity: The route has a local canvas draft but not the English social-card-studio.js templates, dimensions, validation, and export contract.
- `certificate-maker` — blocked-english-fallback: The route is an explicit preparation page that hands off to the English certificate workflow; no native PDF/image export owner exists.
- `flyer-maker` — blocked-feature-parity: The reduced inline canvas does not reuse flyer-maker-studio.js or reproduce the English templates, asset controls, exact dimensions, and export behavior.
- `thumbnail-maker` — blocked-missing-route: No physical Swahili route or native thumbnail studio owner exists on the coordinator base.

## Validation

- Focused static, source-owner, browser, export, inventory, localization, hreflang, links, lint, type and artwork checks are recorded in the combined lane receipt.
- Chromium passed with one worker on isolated ports. Every advertised candidate export was parsed or reopened.

## Boundary

No central acceptance ledger, AI route map, sitemap, dist, redirects, other locale, deployment, or live service was changed. Candidate acceptance is lane evidence for coordinator review; it is not central or production acceptance.
