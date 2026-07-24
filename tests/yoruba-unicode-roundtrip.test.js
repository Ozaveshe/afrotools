'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const localization = require('../assets/js/lib/localization');
const platform = require('../scripts/lib/localization-platform');

const ROOT = path.resolve(__dirname, '..');
const catalogPath = path.join(ROOT, 'lang', 'yo.json');
const bytes = fs.readFileSync(catalogPath);
const source = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
const catalog = JSON.parse(source);

function strings(value, output) {
  if (typeof value === 'string') output.push(value);
  else if (Array.isArray(value)) value.forEach((item) => strings(item, output));
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => strings(item, output));
  return output;
}

const authored = strings(catalog, []);
assert.ok(authored.length > 0, 'Yoruba catalog must contain user-facing strings');
for (const value of authored) {
  assert.strictEqual(value, value.normalize('NFC'), 'Yoruba catalog values must remain NFC');
  assert.ok(!value.includes('\uFFFD'), 'Yoruba catalog values must not contain replacement characters');
}

const jsonRoundTrip = JSON.parse(JSON.stringify(catalog));
assert.deepStrictEqual(jsonRoundTrip, catalog, 'JSON serialization must preserve every Yoruba catalog value');

const manifest = platform.loadLocaleManifest();
const catalogs = platform.loadCatalogs(manifest);
const runtime = localization.create({ manifest, catalogs, locale: 'yo' });
const runtimeValue = runtime.t('navigation.language').value;
assert.strictEqual(runtimeValue, catalog.navigation.language, 'browser runtime must preserve the source catalog value');

const query = new URLSearchParams({ q: runtimeValue }).toString();
assert.strictEqual(new URLSearchParams(query).get('q'), runtimeValue, 'URL encoding must round-trip Yoruba display text');

const csv = localization.toUnicodeCsv([[catalog.navigation.language, catalog.navigation.changeLanguage]]);
assert.ok(csv.startsWith('\uFEFF'), 'Unicode CSV must include a UTF-8 BOM');
assert.strictEqual(csv.slice(1), csv.slice(1).normalize('NFC'), 'Unicode CSV payload must remain NFC');

console.log('Yoruba Unicode JSON, runtime, URL and CSV round trips passed');
