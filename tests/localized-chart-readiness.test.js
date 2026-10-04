const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { refreshChartReadiness } = require('../scripts/lib/localized-chart-readiness');
const ready = 'if (!RESULT || !window.Chart || !window.AfroChartColors) return;';
const legacy = 'if (!RESULT || !window.Chart) return;';
const source = fs.readFileSync(path.join(__dirname, '../kenya/ke-paye.html'), 'utf8');
const translated = fs.readFileSync(path.join(__dirname, '../fr/kenya/ke-paye.html'), 'utf8');

test('localized guard refresh preserves every other translated page byte and is idempotent', () => {
  const before = translated.replace(ready, legacy);
  const after = refreshChartReadiness(before, source);
  assert.equal(after.replace(ready, legacy), before);
  assert.equal(refreshChartReadiness(after, source), after);
});

test('localized guard refresh rejects an unready English source', () => {
  assert.throws(() => refreshChartReadiness(translated, source.replace(ready, legacy)), /English source/);
});

test('localized guard refresh rejects unknown or duplicate runtime guards', () => {
  assert.throws(() => refreshChartReadiness(translated.replace(/if \(!RESULT[^\n]+/, 'if (!RESULT) return;'), source), /differs/);
  assert.throws(() => refreshChartReadiness(translated + '<script>function renderChart() { ' + legacy + ' }</script>', source), /exactly one/);
});
