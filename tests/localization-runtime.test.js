const assert = require('assert');

const runtimeApi = require('../assets/js/lib/localization');
const localeApi = require('../scripts/lib/localization-platform');
const workflowExport = require('../assets/js/ai/workflow-export');

const manifest = localeApi.loadLocaleManifest();
const catalogs = localeApi.loadCatalogs(manifest);

for (const locale of ['en', 'fr', 'sw', 'yo', 'ha']) {
  const runtime = runtimeApi.create({ manifest, catalogs, locale });
  const translated = runtime.t('states.loading');
  assert.strictEqual(translated.locale, locale);
  assert.strictEqual(translated.sourceLocale, locale);
  assert.strictEqual(translated.state, 'native');
  assert.ok(translated.value);

  const number = runtime.formatNumber(1234567.89);
  assert.strictEqual(number, new Intl.NumberFormat(localeApi.getLocale(manifest, locale).formatting.localeTag).format(1234567.89));

  const currency = runtime.formatCurrency(1234.5, locale === 'fr' ? 'XOF' : locale === 'sw' ? 'KES' : 'NGN');
  assert.ok(currency && !currency.includes('NaN'));

  const date = runtime.formatDate('2026-07-11T00:00:00Z', { timeZone: 'UTC' });
  assert.ok(date);

  assert.ok(runtime.formatPercent(0.125).includes('12'));
  assert.ok(runtime.formatUnit(5, 'kilometer'));
  assert.ok(runtime.formatRelativeTime(-2, 'day'));
  assert.ok(runtime.formatList(['A', 'B', 'C']));
  assert.ok(runtime.pluralCategory(2));
}

const french = runtimeApi.create({ manifest, catalogs, locale: 'fr' });
const missing = french.t('missing.key');
assert.strictEqual(missing.state, 'missing');
assert.strictEqual(missing.sourceLocale, null);

const explicitFallback = french.t('missing.key', {}, { allowFallback: true, fallback: 'Fallback text' });
assert.strictEqual(explicitFallback.state, 'explicit-fallback');
assert.strictEqual(explicitFallback.value, 'Fallback text');

const interpolated = french.t('validation.minLength', { count: 3 });
assert.ok(interpolated.value.includes('3'));
assert.ok(!interpolated.value.includes('{count}'));

const decomposed = 'Yoru\u0300ba\u0301';
assert.strictEqual(french.normalizeDisplay(decomposed), decomposed.normalize('NFC'));

const signed = 'route-id:e\u0301:sha256:abc';
assert.strictEqual(runtimeApi.preserveOpaque(signed), signed, 'opaque identifiers must not be normalized');

const csv = runtimeApi.toUnicodeCsv([['Yorùbá', 'Français', '₦1,000'], ['emoji', '🌍', 'Hausa']]);
assert.ok(csv.startsWith('\uFEFF'));
assert.strictEqual(csv, csv.normalize('NFC'));
assert.ok(csv.includes('"₦1,000"'));

const normalizedReport = workflowExport.normalizeReport({
  title: 'Kírii\u0301ro ìwé owó',
  userGoal: 'Franç\u0327ais àti Yoru\u0300ba\u0301',
  resultSummary: ['₦1,000 — 🌍'],
  assumptions: [],
  sourceConfidence: [],
  nextSteps: []
});
assert.strictEqual(JSON.stringify(normalizedReport), JSON.stringify(normalizedReport).normalize('NFC'), 'clipboard/PDF workflow report text must be NFC');

const oldWindow = global.window;
global.window = {};
runtimeApi.install({ root: global.window, manifest, catalogs, locale: 'sw' });
assert.ok(global.window.AfroTools.i18n);
assert.strictEqual(global.window.AfroTools.i18n.locale(), 'sw');
assert.strictEqual(global.window.AfroTools.fmt.number(1234), new Intl.NumberFormat('sw-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(1234));
global.window = oldWindow;

console.log('Localization runtime and Unicode contract tests passed');
