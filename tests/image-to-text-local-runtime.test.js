const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

test('image-to-text OCR runtime and fallback stay on bundled assets', () => {
  const page = fs.readFileSync(path.join(root, 'tools/image-to-text/index.html'), 'utf8');
  const studio = fs.readFileSync(path.join(root, 'assets/js/lib/image-to-text-studio.js'), 'utf8');
  const localConfig = fs.readFileSync(path.join(root, 'assets/js/lib/image-to-text-ocr-local.js'), 'utf8');
  const combined = `${page}\n${studio}\n${localConfig}`;

  assert.doesNotMatch(combined, /cdn\.jsdelivr\.net\/npm\/tesseract/i);
  assert.match(page, /\/assets\/vendor\/tesseract\/tesseract\.min\.js/);
  assert.match(studio, /\/assets\/vendor\/tesseract\/tesseract\.min\.js/);
  assert.match(localConfig, /\/assets\/vendor\/tesseract\/worker\.min\.js/);
  assert.match(localConfig, /\/assets\/vendor\/tesseract\/core/);
  assert.match(localConfig, /\/assets\/vendor\/tesseract\/lang/);
  assert.match(localConfig, /workerBlobURL:\s*false/);
});
