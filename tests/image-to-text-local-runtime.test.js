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

test('every advertised image OCR language has its bundled matching model and vendor gate entry', () => {
  const zlib = require('node:zlib');
  const page = fs.readFileSync(path.join(root, 'tools/image-to-text/index.html'), 'utf8');
  const languageSelect = /<select[^>]*id="ocrLanguage"[^>]*>([\s\S]*?)<\/select>/.exec(page);
  assert.ok(languageSelect, 'actual OCR language selector exists');
  const languages = new Set([...languageSelect[1].matchAll(/<option value="([a-z+]+)"/g)].flatMap(match => match[1].split('+')));
  assert.ok(languages.has('amh'), 'Amharic remains advertised');
  const gate = fs.readFileSync(path.join(root, 'scripts/verify-pdf-category-gate.js'), 'utf8');
  for (const language of languages) {
    const relative = `assets/vendor/tesseract/lang/${language}.traineddata.gz`;
    assert.ok(fs.existsSync(path.join(root, relative)), `${language} model missing`);
    const model = fs.readFileSync(path.join(root, relative));
    assert.ok(zlib.gunzipSync(model).length > 1024, `${language} model gzip is readable`);
    if (language === 'amh') {
      assert.equal(require('node:crypto').createHash('sha256').update(model).digest('hex'), '371bd62defb707d4bba71886011b4708e2b4831ff427a7e487b1acfbff264568', 'Amharic bytes match the integrity-verified official package member');
    }
    assert.ok(gate.includes(`'${relative}'`), `${language} missing from release vendor gate`);
  }
});
