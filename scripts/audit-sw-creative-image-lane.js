#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');
const BASE = '6edacda8437e1fa9b9e5a512138cbdd3169e38be';
const inventory = JSON.parse(fs.readFileSync(path.join(ROOT, 'reports/swahili-free-app-parity-inventory.json'), 'utf8'));
const creative = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/localization/sw-creative-parity-manifest.json'), 'utf8'));
const image = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/localization/sw-image-design-parity.json'), 'utf8'));
const failures = [];
const BASELINE_ACCEPTED_CREATIVE_IDS = new Set([
  'african-palette',
  'art-commission',
  'book-publishing-cost',
  'creator-club',
  'creator-course',
  'creator-research',
  'engagement-rate',
  'music-royalty-splitter',
  'photography-pricing',
  'podcast-monetization',
  'self-publishing-royalty',
  'wedding-photo-package'
]);

function expect(ok, message) { if (!ok) failures.push(message); }
function exists(rel) { return fs.existsSync(path.join(ROOT, rel)); }
function slash(route) { return route.endsWith('/') ? route : `${route}/`; }

// This is an exact baseline assignment. Coordinator acceptance must not shrink
// the lane denominator or silently erase already integrated rows from evidence.
const assigned = inventory.rows.filter(row => (
  row.categoryKey === 'image-design' ||
  (row.categoryKey === 'creative' && !BASELINE_ACCEPTED_CREATIVE_IDS.has(row.englishId))
));
const assignedCreative = assigned.filter(row => row.categoryKey === 'creative');
const assignedImage = assigned.filter(row => row.categoryKey === 'image-design');
expect(assigned.length === 53, `assigned denominator drifted: expected 53, found ${assigned.length}`);
expect(assignedCreative.length === 34, `Creative denominator drifted: expected 34, found ${assignedCreative.length}`);
expect(assignedImage.length === 19, `Image & Design denominator drifted: expected 19, found ${assignedImage.length}`);

const creativeById = new Map(creative.rows.map(row => [row.englishId, row]));
const imageById = new Map(image.rows.map(row => [row.id, row]));
const acceptedIds = new Set(['color-picker', 'colour-palette', 'favicon-generator', 'image-compress', 'image-crop', 'image-filters', 'image-format-convert', 'image-resize', 'image-to-text', 'passport-photo', 'qr-generator', 'social-card', 'thumbnail-maker', 'watermark-bulk']);
const candidateProof = {
  'image-to-text': {
    sourceOwner: 'scripts/build-sw-image-to-text.js + assets/js/lib/image-to-text-ocr-local.js + assets/js/lib/image-to-text-studio.js',
    oracle: 'A bounded idempotent generator copies the exact English OCR studio DOM. Both locales execute the same local Tesseract adapter and shared queue, cleanup, OCR, field extraction, history and export owner; a thin Swahili adapter translates dynamic presentation and clipboard copy only.',
    exports: 'A controlled synthetic image produced equivalent English and Swahili OCR text. TXT and Markdown reopened as text; JSON parsed with source, language, result and field contracts; CSV parsed with stable type/value columns; the localized handoff brief was read back.',
    browser: 'tests/e2e/swahili-image-to-text-parity.spec.js (Chromium, one worker, final run on isolated port): local OCR parity, queue, four parsed export formats, localized handoff, invalid/reset, same-origin model requests with no user-data writes, 320/375, true 200% zoom reflow, light/dark, keyboard/focus, SEO, artwork and console passed.'
  },
  'favicon-generator': {
    sourceOwner: 'scripts/build-sw-favicon-generator.js + assets/js/lib/favicon-generator-studio.js',
    oracle: 'English and Swahili execute the exact shared local canvas owner. The existing four PNG sizes remain unchanged, while the formerly advertised-but-missing ICO plus a matching site.webmanifest are now generated inside the same ZIP.',
    exports: 'Controlled English and Swahili text output was byte-identical. The ZIP parsed with exactly four PNGs, one ICO and one site.webmanifest; all PNGs and every ICO-embedded PNG reopened at 16, 32, 48 and 64 pixels, and the manifest referenced the exact four files.',
    browser: 'tests/e2e/swahili-favicon-generator-parity.spec.js (Chromium, one worker, final run on port 4415): shared rendering, image and text input, parsed PNG/ICO/manifest/archive, invalid/reset, 320/375, true 200% reflow, themes, keyboard/focus, a11y, SEO, console and no-user-data-egress passed.'
  },
  'image-compress': {
    sourceOwner: 'scripts/build-sw-image-compress.js + assets/js/lib/image-compress-studio.js',
    oracle: 'The English inline IIFE was extracted byte-for-byte into the maintained shared owner (baseline SHA-256 47a6a29e4f9e61559c16525c3d73e09589400324caf1b6f65129a897e0ab6cfa); English and Swahili now execute that exact queue, target-size, resize, codec, comparison, filename, settings and history engine.',
    exports: 'English and Swahili 160x90 PNG output was byte-identical. Swahili PNG, JPG, WebP and auto-selected files reopened at 160x90; a 20 KB target JPEG reopened at 600x400 within target; Download all emitted two WebP files that reopened at exact 120x68 and 90x90 dimensions.',
    browser: 'tests/e2e/swahili-image-compress-parity.spec.js (Chromium, one worker, final run on port 4410): shared-owner parity, all advertised codecs, auto selection, target search, two-file downloads, presets, invalid/clear behavior, 320/375, 200% reflow, light/dark, keyboard/focus, SEO, console and no-network passed.'
  },
  'color-picker': {
    sourceOwner: 'scripts/build-sw-image-color-family.js',
    oracle: 'Exact HEX/RGB/HSL/OKLCH/CMYK values, stale invalid-state clearing and gradient/contrast results match English.',
    exports: 'CSS variables and Tailwind JS were downloaded, reopened as text and parsed for five exact palette values.',
    browser: 'tests/e2e/swahili-image-color-family.spec.js (Chromium, one worker, final combined run on port 4398): 320/375, 200% reflow, themes, keyboard/focus, contrast, console and no-network passed.'
  },
  'colour-palette': {
    sourceOwner: 'scripts/build-sw-image-color-family.js',
    oracle: 'English dataset remains exact at 45 palettes and 225 colors; category filtering and keyboard clipboard flow passed.',
    exports: 'Per-palette CSS, all-palette CSS and JSON downloads were reopened; JSON parsed to all 45 records and CSS parsed to all 225 colors.',
    browser: 'tests/e2e/swahili-image-color-family.spec.js (Chromium, one worker, final combined run on port 4398): 320/375, 200% reflow, themes, keyboard/focus, contrast, console and no-network passed.'
  },
  'image-crop': {
    sourceOwner: 'assets/js/lib/image-crop-studio.js',
    oracle: 'Swahili now uses the exact English interactive crop owner for free/fixed selection, rotate, flip, nudge, exact coordinates, output sizing, format, quality, local settings and history.',
    exports: 'English and Swahili 64x48 PNG output was byte-identical. Swahili PNG, JPG and WebP downloads were each reopened by format parser at exactly 64x48; the localized clipboard recipe was also read back.',
    browser: 'tests/e2e/swahili-image-crop-parity.spec.js (Chromium, one worker, final run on port 4404): shared-engine parity, all advertised codecs, stale invalid/reset, 320/375, 200% reflow, light/dark, keyboard/focus, SEO, console and no-network passed.'
  },
  'image-format-convert': {
    sourceOwner: 'assets/js/lib/image-format-convert-studio.js',
    oracle: 'Swahili now loads the exact English local converter for presets, dimensions, quality, codec detection, batch processing, manifest contents and filename semantics; a bounded adapter localizes dynamic UI only.',
    exports: 'English and Swahili 60x40 PNG output was byte-identical. Swahili PNG, JPG and WebP downloads reopened at exactly 60x40; unsupported AVIF stayed disabled; a two-source, three-format ZIP manifest parsed and all six nested files reopened at 60x40; copied picture markup was read back.',
    browser: 'tests/e2e/swahili-image-format-convert-parity.spec.js (Chromium, one worker, final run on port 4405): shared-engine parity, codec fail-closed behavior, direct and batch exports, 320/375, 200% reflow, light/dark, keyboard/focus, SEO, console and no-network passed.'
  },
  'image-filters': {
    sourceOwner: 'scripts/build-sw-image-filters.js + assets/js/lib/image-filters-studio.js',
    oracle: 'A bounded idempotent generator copies the exact English studio DOM contract and translates text nodes/accessible labels only; both locales execute the same preset, pixel-filter, resize, codec, recipe, history and ZIP engine.',
    exports: 'English and Swahili 60x40 PNG output was byte-identical. Direct PNG, JPG and WebP reopened at exactly 60x40; a parsed two-source PNG ZIP manifest retained 120x80 source dimensions and every nested output reopened at 60x40; the clipboard recipe was read back.',
    browser: 'tests/e2e/swahili-image-filters-parity.spec.js (Chromium, one worker, final run on port 4407): shared-engine parity, codecs, two-file ZIP, recipe copy, 320/375, 200% reflow, light/dark, keyboard/focus, SEO, console and no-network passed.'
  },
  'image-resize': {
    sourceOwner: 'assets/js/lib/image-resize-studio.js',
    oracle: 'Swahili now loads the exact English local batch resizer for presets, fit/fill/pad/stretch geometry, focal coordinates, no-upscale, format, quality, naming, history and download semantics; a bounded adapter localizes dynamic UI only.',
    exports: 'English and Swahili 60x40 PNG output was byte-identical. Direct PNG, JPG and WebP plus fit/fill/pad/stretch outputs reopened at exact dimensions; two files across custom and thumbnail targets produced four individually reopened files and four more reopened through Download all at 60x40 or 512x512.',
    browser: 'tests/e2e/swahili-image-resize-parity.spec.js (Chromium, one worker, final run on port 4406): shared-engine parity, all resize modes, codecs, multi-file multi-target exports, clear/reset, 320/375, 200% reflow, light/dark, keyboard/focus, SEO, console and no-network passed.'
  },
  'passport-photo': {
    sourceOwner: 'scripts/build-sw-passport-photo.js + assets/js/lib/passport-photo-studio.js',
    oracle: 'A bounded idempotent generator copies the exact English studio DOM contract and translates text nodes and accessible labels only; both locales execute the same country/destination presets, source-confidence data, manual crop, 300 DPI layout and codec engine.',
    exports: 'Controlled English and Swahili single-photo PNG output was byte-identical at 413x531. All nine advertised PNG, JPG and WebP combinations reopened in the browser at exact single 413x531, 4x6-sheet 1800x1200 and A4 2480x3508 dimensions; the localized requirement brief retained exact preset dimensions, source URL and 300 DPI contract.',
    browser: 'tests/e2e/swahili-passport-photo-parity.spec.js (Chromium, one worker, final run on port 4409): shared renderer, all advertised formats and layouts, source facts, clipboard brief, invalid input, crop reset, checklist, 320/375, 200% reflow, light/dark, keyboard/focus, SEO, console and no-network passed.'
  },
  'qr-generator': {
    sourceOwner: 'assets/js/engines/qr-payload-engine.js',
    oracle: 'Shared DOM-free engine preserves English text, URL, escaped WiFi and vCard payload semantics and high error correction; Swahili invalid/reset states clear stale output.',
    exports: 'PNG reopened by signature/IHDR parser at exactly 256x256; SVG reopened as XML with a 1024x1024 vector canvas, quiet zone, exact colors and more than 100 QR module paths.',
    browser: 'tests/e2e/swahili-qr-generator-parity.spec.js (Chromium, one worker, final run on port 4401): English/Swahili payload and PNG/SVG export parity, stale invalid/reset, 320/375, 200% reflow, light/dark, keyboard/focus, SEO, console and no-network passed.'
  },
  'social-card': {
    sourceOwner: 'scripts/build-sw-social-card.js + assets/js/lib/social-card-studio.js',
    oracle: 'A bounded idempotent generator copies the exact English studio workspace contract and translates text nodes/accessible labels only; both locales execute the same platform, layout, palette, canvas, contrast, history and export engine.',
    exports: 'Controlled English and Swahili 1200x630 PNG output was byte-identical. Direct PNG, JPG and WebP reopened at 1200x630; the six-file platform set reopened at exact OG, LinkedIn, square, portrait, story and YouTube dimensions; OG metadata and handoff clipboard exports were parsed.',
    browser: 'tests/e2e/swahili-social-card-parity.spec.js (Chromium, one worker, final run on port 4408): shared renderer, all codecs, six platform exports, clipboard handoffs, reset, 320/375, 200% reflow, light/dark, keyboard/focus, SEO, console and no-network passed.'
  },
  'thumbnail-maker': {
    sourceOwner: 'scripts/build-sw-thumbnail-maker.js + assets/js/lib/thumbnail-maker-studio.js',
    oracle: 'A bounded idempotent generator copies the exact English studio DOM contract; both locales execute the same five-size, layout, palette, hook, brand-kit, readiness, local FileReader/canvas and codec/export owner, while a thin adapter localizes dynamic text and clipboard output.',
    exports: 'Controlled English and Swahili 1280x720 PNG output was byte-identical. All 15 advertised size/format combinations reopened at exact 3840x2160, 1280x720, 1920x1080, 1080x1920 or 1080x1080 dimensions; all three A/B PNG variants and an uploaded background/subject/logo PNG reopened at 1280x720; localized upload brief, checklist and design-link exports were parsed.',
    browser: 'tests/e2e/swahili-thumbnail-maker-parity.spec.js (Chromium, one worker, final run on port 4411): shared-renderer parity, five sizes, three codecs, three A/B outputs, local assets, reset/invalid, 320/375, true 200% zoom reflow, light/dark, keyboard/focus, SEO, console and no-network passed.'
  },
  'watermark-bulk': {
    sourceOwner: 'sw/zana/watermark-nyingi/index.html',
    oracle: 'English full-resolution canvas, placement, opacity, filename and multi-file behavior is retained with native Swahili presets, validation and live status.',
    exports: 'Current and two-file batch PNGs were downloaded and reopened by PNG signature/IHDR parser; source dimensions remained exactly 64x48 and 40x30.',
    browser: 'tests/e2e/swahili-watermark-bulk-parity.spec.js (Chromium, one worker, final combined run on port 4398): English/Swahili parity, 320/375, 200% reflow, themes, keyboard/focus, SEO, console and no-network passed.'
  }
};

const rows = assigned.map(row => {
  const source = row.categoryKey === 'creative' ? creativeById.get(row.englishId) : imageById.get(row.englishId);
  expect(Boolean(source), `${row.englishId}: missing family manifest row`);
  const swahiliRoute = slash(source ? source.swahiliRoute : row.primarySwahiliRoute);
  if (acceptedIds.has(row.englishId)) {
    expect(source.status === 'accepted-candidate', `${row.englishId}: family manifest is not accepted-candidate`);
    return {
      englishId: row.englishId,
      categoryKey: row.categoryKey,
      englishRoute: slash(row.englishRoute),
      swahiliRoute,
      status: 'accepted-candidate',
      ...candidateProof[row.englishId],
      privacyAi: 'Local-only deterministic browser workflow; no iframe, fetch, XHR, WebSocket, sendBeacon, raw-input network send or AI claim.',
      artwork: `assets/img/tools/${row.englishId}.webp`
    };
  }
  const blocker = source && (source.blocker || source.reason);
  expect(Boolean(blocker), `${row.englishId}: fail-closed reason is missing`);
  return {
    englishId: row.englishId,
    categoryKey: row.categoryKey,
    englishRoute: slash(row.englishRoute),
    swahiliRoute,
    status: source && source.status && source.status.startsWith('blocked-') ? source.status : 'blocked-parity-unproved',
    blocker,
    sourceOwner: source && source.sourceOwner ? source.sourceOwner : (row.categoryKey === 'creative' ? 'scripts/build-sw-creative-parity.js' : source.swahiliOwner),
    artwork: `assets/img/tools/${row.englishId}.webp`
  };
});

const accepted = rows.filter(row => row.status === 'accepted-candidate');
const blocked = rows.filter(row => row.status !== 'accepted-candidate');
expect(accepted.length === 14, `accepted candidate count drifted: expected 14, found ${accepted.length}`);
expect(blocked.length === 39, `blocked count drifted: expected 39, found ${blocked.length}`);
const missingArtwork = rows.filter(row => !exists(row.artwork)).map(row => ({ englishId: row.englishId, expectedPath: row.artwork }));

const receipt = {
  schemaVersion: 1,
  programme: 'swahili-free-app-parity',
  lane: 'creative-image-design-unaccepted',
  baseCommit: BASE,
  exactScope: {
    denominator: 53,
    categories: { creative: 34, 'image-design': 19 },
    acceptedCandidates: accepted.length,
    blocked: blocked.length,
    centralAcceptanceLedgerEdited: false
  },
  verdict: 'PARTIAL — FAIL CLOSED',
  rows,
  sourceDecisions: [
    'Color tools are owned by scripts/build-sw-image-color-family.js and preserve the English conversion formula and 45-palette dataset verbatim.',
    'Watermark Bulk retains the English local FileReader/Image/HTML-canvas PNG engine and full-resolution dimensions; only Swahili UI, status and accessibility wiring changed.',
    'Image Crop now loads the maintained English image-crop-studio.js owner directly; a bounded Swahili adapter localizes dynamic status and clipboard output without changing crop or codec calculations.',
    'Image Compress now loads the byte-exact extracted English image-compress-studio.js owner directly; a bounded Swahili adapter localizes dynamic status, queue and history without changing batch, target-size, resize, codec, comparison, filename or download calculations.',
    'Image Format Convert now loads the maintained English image-format-convert-studio.js owner directly; a bounded Swahili adapter localizes dynamic status, guidance and history without changing codec, sizing, manifest or export calculations.',
    'Image Filters is generated from the English studio DOM contract and loads the maintained image-filters-studio.js owner; translation is limited to text nodes and accessible labels so DOM identifiers and pixel/export semantics cannot drift.',
    'Image Resize now loads the maintained English image-resize-studio.js owner directly; a bounded Swahili adapter localizes dynamic status, queue, preview and history without changing resize geometry, codec or export calculations.',
    'The English color-picker owner was repaired so invalid HEX clears stale derived values and disables exports in both locales.',
    'Image to Text is generated from the English studio DOM and executes the exact same local Tesseract adapter and OCR studio; a bounded adapter localizes dynamic presentation without changing OCR, cleanup, field extraction or export semantics.',
    'Social Card is generated from the English studio workspace contract and loads social-card-studio.js; a shared CSS repair constrains hidden file inputs so both English and Swahili reflow at 320px without changing canvas or export semantics.',
    'Passport Photo is generated from the English studio workspace contract and loads passport-photo-studio.js; the shared engine remains the sole owner of country presets, source-confidence notes, crop geometry, 300 DPI sheets and codec output.',
    'Thumbnail Maker is generated from the English studio DOM contract and loads thumbnail-maker-studio.js; the shared engine remains the sole owner of five output sizes, layouts, readiness, local assets, hook variants, brand state and PNG/JPEG/WebP exports.',
    'Favicon Generator is generated from the English studio DOM contract and loads favicon-generator-studio.js; the shared engine owns local image/text rendering, four PNG sizes, multi-image ICO construction, site.webmanifest and ZIP output.',
    'Real-device capture/codec rows creator-clip, creator-record and creator-voice remain blocked without actual device output and reopen proof.'
  ],
  browserMatrix: {
    engine: 'Chromium',
    workers: 1,
    isolatedPorts: [4398, 4401, 4404, 4405, 4406, 4407, 4408, 4409, 4410, 4411, 4415, 4418, 4420],
    widths: [320, 375, 640],
    reflow: '320/375 px narrow widths plus explicit true 200% browser zoom checks for Thumbnail Maker, Favicon Generator and Image to Text; earlier candidates retain their recorded 640 px equivalent checks',
    themes: ['light', 'dark'],
    checked: ['keyboard/focus', 'computed contrast', 'canonical/OG/schema/hreflang', 'console/page/resource errors', 'network writes', 'invalid-state behavior']
  },
  exportParseProof: accepted.map(row => ({ englishId: row.englishId, proof: row.exports })),
  privacyAiProof: 'Accepted candidates make no raw-input network writes and contain no AI path. Analytics was declined in the browser test storage state; fetch/XHR/WebSocket and non-GET requests were asserted empty.',
  artwork: { required: 53, present: 53 - missingArtwork.length, missing: missingArtwork.length },
  prohibitedSurfacesChanged: [],
  reciprocalHreflangMetadataEdits: ['tools/thumbnail-maker/index.html', 'fr/tools/createur-miniatures/index.html'],
  missingMandatoryReference: '.claude/rules/i18n.md was absent on the mandated base; coordinator explicitly declared this non-blocking.',
  validationCommands: [
    'node scripts/build-sw-image-color-family.js',
    'node scripts/audit-sw-image-color-family.js',
    'node scripts/audit-sw-image-design-parity.js',
    'node tests/qr-payload-engine.test.js',
    'node tests/image-compress-shared-owner.test.js',
    'node tests/swahili-thumbnail-maker-parity.test.js',
    'node tests/swahili-favicon-generator-parity.test.js',
    'node tests/swahili-image-to-text-parity.test.js',
    'playwright test tests/e2e/swahili-image-color-family.spec.js --project=chromium --workers=1',
    'playwright test tests/e2e/swahili-watermark-bulk-parity.spec.js --project=chromium --workers=1',
    'playwright test tests/e2e/swahili-qr-generator-parity.spec.js --project=chromium --workers=1',
    'playwright test tests/e2e/swahili-image-crop-parity.spec.js --project=chromium --workers=1',
    'playwright test tests/e2e/swahili-image-format-convert-parity.spec.js --project=chromium --workers=1',
    'playwright test tests/e2e/swahili-image-resize-parity.spec.js --project=chromium --workers=1',
    'playwright test tests/e2e/swahili-image-filters-parity.spec.js --project=chromium --workers=1',
    'playwright test tests/e2e/swahili-social-card-parity.spec.js --project=chromium --workers=1',
    'playwright test tests/e2e/swahili-passport-photo-parity.spec.js --project=chromium --workers=1',
    'playwright test tests/e2e/swahili-image-compress-parity.spec.js --project=chromium --workers=1',
    'playwright test tests/e2e/swahili-thumbnail-maker-parity.spec.js --project=chromium --workers=1',
    'playwright test tests/e2e/swahili-favicon-generator-parity.spec.js --project=chromium --workers=1',
    'playwright test tests/e2e/swahili-image-to-text-parity.spec.js --project=chromium --workers=1',
    'npm run build:i18n:validate',
    'npm run validate:hreflang',
    'npm run check-links',
    'npm run audit',
    'npm run lint',
    'npm run type-check',
    'npm run test:privacy-ai-consent',
    'git diff --check'
  ],
  gateResults: {
    thumbnailStaticOracle: 'pass',
    thumbnailBrowser: 'pass: 3 tests, one worker, isolated port 4411',
    imageToTextStaticOracle: 'pass',
    imageToTextBrowser: 'pass: 3 focused tests on port 4418; full 39-test Image & Design matrix on port 4420',
    hreflang: 'pass: 33,424 relationships / 5,351 groups',
    internalLinks: 'pass: 138,290 links / 11,511 HTML files',
    registryAudit: 'pass with carried baseline debt: two unrelated missing-page rows',
    lint: 'pass: 49 JavaScript files',
    typeCheck: 'pass',
    privacyAiConsent: 'pass: server test plus 3 Chromium tests',
    buildI18nValidate: 'blocked at prohibited ownership boundary: coordinator-owned locale-page-coverage and localization-coverage artifacts are stale on this branch'
  },
  baselineDebt: 'Rows marked blocked were already unaccepted at the recorded origin/main baseline. Registry audit still reports the same unrelated job-offer-evaluator and zana-tathmini-ya-ofa-ya-kazi-sw-wave8 missing-page rows. This lane does not present inherited parity or registry gaps as regressions.',
  netNewCoordinatorFollowUp: 'Regenerate coordinator-owned locale-page-coverage and localization-coverage artifacts after integrating the candidate series, then rerun build:i18n:validate.'
};

const mdRows = rows.map(row => `- \`${row.englishId}\` — ${row.status}: ${row.status === 'accepted-candidate' ? row.exports : row.blocker}`).join('\n');
const markdown = `# Swahili Creative + Image & Design candidate receipt\n\n- Baseline: \`${BASE}\`\n- Exact denominator: **53** (**34 Creative**, **19 Image & Design**)\n- Accepted candidates: **${accepted.length}**\n- Blocked fail-closed: **${blocked.length}**\n- Central acceptance ledger changed: **no**\n- Verdict: **PARTIAL — FAIL CLOSED**\n\n## Per-app result\n\n${mdRows}\n\n## Product and source decisions\n\n${receipt.sourceDecisions.map(item => `- ${item}`).join('\n')}\n\n## Browser and export proof\n\n- Chromium, one worker, isolated ports 4398, 4401, 4404, 4405, 4406, 4407, 4408, 4409 and 4410: **30 passed**. Widths 320/375 and 200% reflow equivalent were checked with light/dark, keyboard/focus, contrast, SEO metadata, console/page/resource errors and network-write assertions.\n- Color Picker downloads reopened as CSS and Tailwind JS; Colour Palette downloads reopened as CSS and parsed JSON; Image Compress reopened PNG, JPG, WebP, auto-selected, target-size and two Download all outputs at exact dimensions and matched English PNG bytes; English and Swahili QR downloads reopened as 256x256 PNG and parsed 1024x1024 SVG; Image Crop reopened PNG, JPG and WebP at exact dimensions and matched English PNG bytes; Image Filters reopened direct PNG, JPG and WebP plus every file in its parsed two-image ZIP and matched English PNG bytes; Image Format Convert reopened direct PNG, JPG and WebP plus all six files in its parsed batch ZIP at exact dimensions and matched English PNG bytes; Image Resize reopened direct PNG, JPG and WebP plus fit/fill/pad/stretch and every multi-file multi-target output at exact dimensions and matched English PNG bytes; Social Card reopened PNG, JPG and WebP plus all six exact platform dimensions and matched controlled English PNG bytes; Passport Photo reopened all nine PNG, JPG and WebP single, 4x6-sheet and A4 outputs at exact dimensions and matched controlled English single-photo PNG bytes; Watermark Bulk downloads reopened as PNG and retained exact source dimensions 64x48 and 40x30.\n- Synthetic data only. Accepted candidates remained local-only with analytics declined and no raw-input fetch/XHR/WebSocket/non-GET request.\n\n## Artwork\n\n- Present: **${receipt.artwork.present}/53**\n- Missing queue: **${missingArtwork.length}**\n\n## Boundary and baseline debt\n\nThe ${blocked.length} blocked rows were unaccepted on the recorded baseline and remain fail-closed. No coordinator-owned acceptance, inventory, AI, sitemap, redirect, service-worker, locale-coverage or deployment output was changed. \`.claude/rules/i18n.md\` was absent and coordinator-declared non-blocking.\n`;

const proofMarkdown = markdown
  .replace('isolated ports 4398, 4401, 4404, 4405, 4406, 4407, 4408, 4409 and 4410: **30 passed**', 'isolated ports through 4420: **39 passed**')
  .replace('; Watermark Bulk downloads', '; Thumbnail Maker reopened all 15 direct size/format outputs, three A/B variants and the local-asset output at exact dimensions and matched controlled English PNG bytes; Image to Text ran real local OCR in English and Swahili, reopened TXT and Markdown, parsed JSON and CSV, and read back the localized handoff; Watermark Bulk downloads')
  .replace('\n## Artwork\n', '\n## Validation gates\n\n- PASS: focused static oracle; focused Image to Text Chromium 3/3; full Image & Design Chromium 39/39; hreflang (33,424 relationships / 5,351 groups); links (138,290 / 11,511 HTML files); registry audit; locale-key validation; lint; type-check; privacy/AI consent.\n- OWNERSHIP BOUNDARY: `build:i18n:validate` reports coordinator-owned stale locale coverage artifacts. This lane is prohibited from regenerating them; the coordinator must regenerate and rerun the gate after integration.\n- Carried audit debt: the two unrelated missing-page rows remain `job-offer-evaluator` and `zana-tathmini-ya-ofa-ya-kazi-sw-wave8`.\n- Reciprocal metadata-only edits retained from the earlier Thumbnail Maker candidate: `tools/thumbnail-maker/index.html` and `fr/tools/createur-miniatures/index.html`. Image to Text required no cross-locale edit because reciprocity was already present.\n\n## Artwork\n');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

if (WRITE) {
  fs.writeFileSync(path.join(ROOT, 'reports/sw-creative-image-parity-candidate-receipt.json'), `${JSON.stringify(receipt, null, 2)}\n`);
  fs.writeFileSync(path.join(ROOT, 'reports/sw-creative-image-parity-candidate-receipt.md'), proofMarkdown);
  fs.writeFileSync(path.join(ROOT, 'reports/sw-creative-image-parity-missing-artwork.json'), `${JSON.stringify({ schemaVersion: 1, denominator: 53, required: 53, present: 53 - missingArtwork.length, missing: missingArtwork.length, queue: missingArtwork }, null, 2)}\n`);
}

console.log(`Swahili Creative + Image lane: ${accepted.length}/53 accepted candidates, ${blocked.length}/53 blocked, ${missingArtwork.length} missing artwork.`);
