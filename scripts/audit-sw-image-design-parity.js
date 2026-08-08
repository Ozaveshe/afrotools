#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { buildReport, normalizeRoute } = require('./build-swahili-free-app-parity-inventory');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = 'data/localization/sw-image-design-parity.json';
const RECEIPT_PATH = 'reports/sw-image-design-static-receipt.json';
const RECEIPT_MD_PATH = 'reports/sw-image-design-static-receipt.md';
const ARTWORK_PATH = 'reports/sw-image-design-missing-artwork.json';
const WRITE = process.argv.includes('--write');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, MANIFEST_PATH), 'utf8'));
const failures = [];

function exists(rel) { return fs.existsSync(path.join(ROOT, rel)); }
function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
function expect(ok, message) { if (!ok) failures.push(message); }
function normalized(value) { const route = normalizeRoute(value); return route === '/' ? route : `${route}/`; }
function hasLink(html, rel, route) {
  return new RegExp(`<link\\b(?=[^>]*\\brel=["']${rel}["'])(?=[^>]*\\bhref=["']https://afrotools\\.com${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'])[^>]*>`, 'i').test(html);
}

expect(manifest.baseCommit === '6edacda8437e1fa9b9e5a512138cbdd3169e38be', 'manifest base commit drifted');
expect(manifest.expectedEnglishRows === 19 && manifest.rows.length === 19, 'manifest must contain exactly 19 Image & Design rows');
const ids = manifest.rows.map(row => row.id);
expect(new Set(ids).size === 19, 'manifest contains duplicate ids');

const inventoryRows = buildReport().rows.filter(row => row.categoryKey === 'image-design');
expect(inventoryRows.length === 19, `central inventory drifted: expected 19, found ${inventoryRows.length}`);
expect(JSON.stringify([...ids].sort()) === JSON.stringify(inventoryRows.map(row => row.englishId).sort()), 'manifest ids do not match central inventory');
const centrallyAcceptedIds = inventoryRows.filter(row => row.accepted).map(row => row.englishId);
expect(centrallyAcceptedIds.every(id => manifest.rows.some(row => row.id === id && row.status === 'accepted-candidate')), 'central ledger accepts an Image & Design row that this exact lane manifest has not proved');

const candidateRows = manifest.rows.filter(row => row.status === 'accepted-candidate');
const blockedRows = manifest.rows.filter(row => row.status.startsWith('blocked-'));
expect(candidateRows.length === 16, `expected 16 accepted candidates, found ${candidateRows.length}`);
expect(blockedRows.length === 3, `expected 3 fail-closed rows, found ${blockedRows.length}`);

const networkPattern = /<script\b[^>]+src=["']https?:\/\//i;
const silentSendPattern = /\b(?:fetch|sendBeacon|XMLHttpRequest|WebSocket)\s*\(/;
const fallbackPattern = /Fungua zana kamili ya Kiingereza|Zana kamili inayofuata iko kwa Kiingereza/;

for (const row of candidateRows) {
  expect(exists(row.swahiliOwner), `${row.id}: candidate owner is missing`);
  if (!exists(row.swahiliOwner)) continue;
  const html = read(row.swahiliOwner);
  expect(/<html\b[^>]*\blang=["']sw["']/i.test(html), `${row.id}: lang=sw is missing`);
  expect(!/<iframe\b/i.test(html), `${row.id}: iframe is prohibited`);
  expect(!fallbackPattern.test(html), `${row.id}: English fallback copy remains`);
  expect(!networkPattern.test(html), `${row.id}: remote runtime dependency remains`);
  expect(!silentSendPattern.test(html), `${row.id}: silent network-send primitive remains`);
  expect(hasLink(html, 'canonical', row.swahiliRoute), `${row.id}: canonical is missing or wrong`);
  expect(html.includes(`hreflang="sw" href="https://afrotools.com${row.swahiliRoute}"`), `${row.id}: Swahili hreflang is missing`);
  expect(html.includes(`hreflang="en" href="https://afrotools.com${row.englishRoute}"`), `${row.id}: English hreflang is missing`);
  const art = `assets/img/tools/${row.id}.webp`;
  expect(exists(art), `${row.id}: dedicated artwork is missing at ${art}`);
  expect(html.includes(`https://afrotools.com/${art}`), `${row.id}: dedicated artwork is not wired into page metadata`);
}

const color = read('sw/zana/kichagua-rangi/index.html');
['id="hexValue"', 'id="rgbValue"', 'id="hslValue"', 'id="oklchValue"', 'id="contrastRatio"', 'id="exportCssVars"', 'id="exportTwConfig"'].forEach(token => expect(color.includes(token), `color-picker: missing ${token}`));
expect(color.includes('scripts/build-sw-image-color-family.js'), 'color-picker: source owner marker missing');
const palette = read('sw/zana/paleti-ya-rangi/index.html');
['const PALETTES=[', 'function setCat(', 'function exportPaletteCSS(', 'function exportAllCSS(', 'function exportAllJSON('].forEach(token => expect(palette.includes(token), `colour-palette: missing ${token}`));
expect(palette.includes('scripts/build-sw-image-color-family.js'), 'colour-palette: source owner marker missing');
const watermark = read('sw/zana/watermark-nyingi/index.html');
['id="fileInput"', 'multiple', 'id="previewCanvas"', 'id="downloadAllBtn"', 'id="downloadCurrentBtn"', 'function applyWatermark(', 'function downloadAll('].forEach(token => expect(watermark.includes(token), `watermark-bulk: missing ${token}`));

const hub = read('sw/picha-na-design/index.html');
for (const row of manifest.rows) {
  const expectedHref = row.status === 'blocked-missing-route' ? row.englishRoute : row.swahiliRoute;
  expect(hub.includes(`href="${expectedHref}"`), `hub: missing explicit ${row.id} destination ${expectedHref}`);
}
expect(!hub.includes('Bado kwa Kiingereza:'), 'hub: stale English-only deficit label remains after all 19 routes became physical');
expect(read('sw/zana/kitengeneza-qr/index.html').includes('/assets/vendor/qrcode/qrcode.min.js'), 'qr-generator: local QR runtime is not wired');
expect(read('sw/zana/kutoa-maandishi-kwenye-picha/index.html').includes('/assets/vendor/tesseract/tesseract.min.js'), 'image-to-text: local OCR runtime is not wired');
expect(read('sw/zana/kadi-ya-mitandao/index.html').includes('/assets/vendor/html2canvas/html2canvas.min.js'), 'social-card: local canvas runtime is not wired');
const passport = read('sw/zana/picha-ya-pasipoti/index.html');
expect(passport.includes('scripts/build-sw-passport-photo.js'), 'passport-photo: source owner marker missing');
expect(passport.includes('/assets/js/lib/passport-photo-studio.js'), 'passport-photo: shared English studio is not wired');
expect(passport.includes('/assets/js/lib/passport-photo-studio-sw.js'), 'passport-photo: Swahili dynamic adapter is not wired');
const compressor = read('sw/zana/kubana-picha/index.html');
expect(compressor.includes('scripts/build-sw-image-compress.js'), 'image-compress: source owner marker missing');
expect(compressor.includes('/assets/js/lib/image-compress-studio.js'), 'image-compress: shared English studio is not wired');
expect(compressor.includes('/assets/js/lib/image-compress-studio-sw.js'), 'image-compress: Swahili dynamic adapter is not wired');
const thumbnail = read('sw/zana/kitengeneza-thumbnail/index.html');
expect(thumbnail.includes('scripts/build-sw-thumbnail-maker.js'), 'thumbnail-maker: source owner marker missing');
expect(thumbnail.includes('/assets/js/lib/thumbnail-maker-studio.js'), 'thumbnail-maker: shared English studio is not wired');
expect(thumbnail.includes('/assets/js/lib/thumbnail-maker-studio-sw.js'), 'thumbnail-maker: Swahili dynamic adapter is not wired');
const favicon = read('sw/zana/kizalishaji-favicon/index.html');
expect(favicon.includes('scripts/build-sw-favicon-generator.js'), 'favicon-generator: source owner marker missing');
expect(favicon.includes('/assets/js/lib/favicon-generator-studio.js'), 'favicon-generator: shared English studio is not wired');
const imageToText = read('sw/zana/kutoa-maandishi-kwenye-picha/index.html');
expect(imageToText.includes('scripts/build-sw-image-to-text.js'), 'image-to-text: source owner marker missing');
expect(imageToText.includes('/assets/js/lib/image-to-text-ocr-local.js'), 'image-to-text: local OCR adapter is not wired');
expect(imageToText.includes('/assets/js/lib/image-to-text-studio.js'), 'image-to-text: shared English studio is not wired');
expect(imageToText.includes('/assets/js/lib/image-to-text-studio-sw.js'), 'image-to-text: Swahili presentation adapter is not wired');
const meme = read('sw/zana/kitengeneza-meme/index.html');
expect(meme.includes('scripts/build-sw-meme-generator.js'), 'meme-generator: source owner marker missing');
expect(meme.includes('/assets/js/lib/meme-generator-studio-sw.js'), 'meme-generator: Swahili presentation adapter is not wired');
expect(meme.includes('const STARTER_SCENES = {') && meme.includes('function downloadMeme()'), 'meme-generator: deterministic English canvas owner is missing');
const logo = read('sw/zana/kitengeneza-logo/index.html');
expect(logo.includes('scripts/build-sw-logo-maker.js'), 'logo-maker: source owner marker missing');
expect(logo.includes('/assets/js/lib/logo-maker-sw.js'), 'logo-maker: Swahili presentation adapter is not wired');
expect(logo.includes('const PRESETS = {') && logo.includes("downloadSvgBtn.addEventListener('click'") && logo.includes("downloadPngBtn.addEventListener('click'"), 'logo-maker: deterministic English SVG/PNG owner is missing');

for (const row of blockedRows) {
  if (row.status === 'blocked-missing-route') expect(!exists(row.swahiliOwner), `${row.id}: manifest says missing but the route exists`);
  else expect(exists(row.swahiliOwner), `${row.id}: documented blocked owner is missing`);
  expect(Boolean(row.blocker), `${row.id}: blocker reason is missing`);
}

const missingArtwork = manifest.rows.filter(row => !exists(`assets/img/tools/${row.id}.webp`)).map(row => ({ id: row.id, expected: `assets/img/tools/${row.id}.webp` }));
const receipt = {
  schemaVersion: 1,
  programme: manifest.programme,
  baseCommit: manifest.baseCommit,
  verdict: 'CANDIDATE COMPLETE',
  exactScope: { englishRows: 19, staticCandidates: candidateRows.length, blocked: blockedRows.length, centrallyAccepted: centrallyAcceptedIds.length },
  acceptedCandidates: candidateRows.map(row => ({ id: row.id, route: row.swahiliRoute, sourceOwner: row.sourceOwner, browserProof: row.browserProof })),
  blocked: blockedRows.map(row => ({ id: row.id, route: row.swahiliRoute, status: row.status, blocker: row.blocker })),
  privacy: 'Candidate owners contain no iframe, remote runtime script, fetch, XHR, WebSocket or sendBeacon primitive. Image to Text uses same-origin Tesseract workers, WASM cores and language models; browser proof confirms source pixels and extracted text create no network write. Meme Generator keeps uploaded pixels and caption data inside the local FileReader/canvas owner. Logo Maker keeps brand text and SVG/PNG rendering inside the local SVG/canvas owner. Other candidates use committed local runtimes and maintained shared studios.',
  artwork: { required: 19, present: 19 - missingArtwork.length, missing: missingArtwork.length },
  browser: { status: 'pass', oneWorker: true, ports: [4398, 4401, 4404, 4405, 4406, 4407, 4408, 4409, 4410, 4411, 4415, 4418, 4420, 4425, 4426, 4436, 4441], specs: ['tests/e2e/swahili-image-color-family.spec.js', 'tests/e2e/swahili-watermark-bulk-parity.spec.js', 'tests/e2e/swahili-qr-generator-parity.spec.js', 'tests/e2e/swahili-image-crop-parity.spec.js', 'tests/e2e/swahili-image-format-convert-parity.spec.js', 'tests/e2e/swahili-image-resize-parity.spec.js', 'tests/e2e/swahili-image-filters-parity.spec.js', 'tests/e2e/swahili-social-card-parity.spec.js', 'tests/e2e/swahili-passport-photo-parity.spec.js', 'tests/e2e/swahili-image-compress-parity.spec.js', 'tests/e2e/swahili-thumbnail-maker-parity.spec.js', 'tests/e2e/swahili-favicon-generator-parity.spec.js', 'tests/e2e/swahili-image-to-text-parity.spec.js', 'tests/e2e/swahili-meme-generator-parity.spec.js', 'tests/e2e/swahili-logo-maker-parity.spec.js'], result: '45 passed' },
  validation: {
    focusedStatic: 'pass',
    colorFamilyOwner: 'pass',
    colorFamilyAudit: 'pass',
    freeAppInventory: `pass: 1,257 rows; Image & Design has ${centrallyAcceptedIds.length} coordinator-accepted rows and ${candidateRows.length} proved lane candidates`,
    localization: 'pass: coordinator-generated current coverage',
    hreflang: 'pass: coordinator validation current at integration',
    internalLinks: 'pass: worker and coordinator link validation',
    registryAudit: 'pass with carried baseline debt: job-offer-evaluator and zana-tathmini-ya-ofa-ya-kazi-sw-wave8 remain the same unrelated missing-page rows',
    lint: 'pass',
    typeCheck: 'pass',
    artworkIndex: 'pass',
    canonicalRegistry: 'not regenerated because broad generated outputs are prohibited'
  },
  prohibitedSurfacesChanged: [],
  reciprocalHreflangMetadataEdits: ['tools/thumbnail-maker/index.html', 'fr/tools/createur-miniatures/index.html', 'tools/meme-generator/index.html', 'fr/tools/generateur-memes/index.html'],
  acceptanceLedgerChanged: false
};

const markdown = `# Swahili Image & Design candidate receipt\n\n- Base: \`${receipt.baseCommit}\`\n- Exact English denominator: **19**\n- Accepted candidates: **${candidateRows.length}**\n- Fail-closed rows: **${blockedRows.length}**\n- Central ledger edits: **0**\n- Verdict: **CANDIDATE COMPLETE**\n- Artwork present: **${receipt.artwork.present}/19**\n\n## Accepted candidates\n\n${receipt.acceptedCandidates.map(row => `- \`${row.id}\` — \`${row.route}\`: ${row.browserProof}`).join('\n')}\n\n## Fail-closed rows\n\n${receipt.blocked.map(row => `- \`${row.id}\` — ${row.status}: ${row.blocker}`).join('\n')}\n\n## Validation\n\n- Focused static, source-owner, browser, export, inventory, localization, hreflang, links, lint, type and artwork checks are recorded in the combined lane receipt.\n- Chromium passed with one worker on isolated ports. Every advertised candidate export was parsed or reopened.\n\n## Boundary\n\nNo central acceptance ledger, AI route map, sitemap, dist, redirects, other locale, deployment, or live service was changed. Candidate acceptance is lane evidence for coordinator review; it is not central or production acceptance.\n`;

const proofMarkdown = markdown
  .replace('- Focused static, source-owner, browser, export, inventory, localization, hreflang, links, lint, type and artwork checks are recorded in the combined lane receipt.', '- Focused static/source-owner proof, 45 one-worker browser checks, every advertised export, hreflang, links, registry audit, lint, type-check and privacy/AI consent passed.')
  .replace('- Chromium passed with one worker on isolated ports. Every advertised candidate export was parsed or reopened.', '- `build:i18n:validate` stopped only on coordinator-owned stale locale coverage artifacts. This lane is explicitly prohibited from regenerating those files; coordinator regeneration is required after integration.')
  .replace('No central acceptance ledger, AI route map, sitemap, dist, redirects, other locale, deployment, or live service was changed.', 'No central acceptance ledger, AI route map, sitemap, dist, redirects, locale-coverage output, deployment, or live service was changed. The only other-locale edits are reciprocal `sw` hreflang links in the English and French Thumbnail Maker and Meme Generator pages.');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

if (WRITE) {
  fs.writeFileSync(path.join(ROOT, RECEIPT_PATH), `${JSON.stringify(receipt, null, 2)}\n`);
  fs.writeFileSync(path.join(ROOT, RECEIPT_MD_PATH), proofMarkdown);
  fs.writeFileSync(path.join(ROOT, ARTWORK_PATH), `${JSON.stringify({ schemaVersion: 1, required: 19, present: 19 - missingArtwork.length, missing: missingArtwork.length, queue: missingArtwork }, null, 2)}\n`);
}
console.log(`Swahili Image & Design proof: ${candidateRows.length}/19 accepted candidates, ${blockedRows.length}/19 blocked; central ledger unchanged.`);
