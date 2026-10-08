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

const { addCameroonChartRecovery } = require('../scripts/lib/localized-chart-readiness');
test('Cameroon chart owner preserves localized chart code and supports regeneration from English', () => {
  const body="if(!RESULT)return;const canvas=document.getElementById('mainChart');new Chart(canvas,{label:'Libellé local'});";
  const before='<div class="chart-canvas-wrap"><canvas id="mainChart"></canvas></div><script>function calculate(){return 123}function renderChart(type){'+body+'}</script>';
  const english=addCameroonChartRecovery(before,'en');
  const french=addCameroonChartRecovery(before,'fr');
  assert.ok(french.includes(body));assert.ok(french.includes('function calculate(){return 123}'));
  assert.ok(french.includes('Graphique indisponible'));assert.equal(addCameroonChartRecovery(french,'fr'),french);
  assert.equal(addCameroonChartRecovery(english,'fr'),french);
  assert.throws(()=>addCameroonChartRecovery(before.replace('new Chart(', 'new Unknown('),'fr'),/contract/);
});
