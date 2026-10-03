const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const acorn = require('acorn');

const html = fs.readFileSync(path.join(__dirname, '../kenya/ke-paye.html'), 'utf8');
const runtime = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1]).find(body => body.includes('function renderChart(type)'));
const node = acorn.parse(runtime, { ecmaVersion: 'latest' }).body
  .find(item => item.type === 'FunctionDeclaration' && item.id.name === 'renderChart');
const render = runtime.slice(node.start, node.end);

for (const type of ['donut', 'bar', 'employer']) {
  test(`${type} waits for its palette and renders the latest result after loading`, () => {
    const charts = [];
    const Chart = class { constructor(canvas, config) { charts.push(config); } destroy() {} };
    const context = {
      RESULT: { net: 70000, paye: 20000, nssf: 2000, shif: 2750, ahl: 1500, pension: 0, prmf: 0, employerNSSF: 2000, employerAHL: 1500, bandDetail: [{ income: 100000, tax: 20000 }] },
      CHART: null, BAND_LABELS: ['Band 1'], Chart,
      document: { getElementById: () => ({}) }
    };
    context.window = context;
    vm.createContext(context);
    vm.runInContext(render, context);
    assert.doesNotThrow(() => context.renderChart(type));
    assert.equal(charts.length, 0);
    context.RESULT.net = 90000;
    context.RESULT.bandDetail[0].tax = 25000;
    context.AfroChartColors = { doughnut: ['red', 'green', 'blue', 'orange', 'purple', 'grey'], series: ['red'], tooltipBg: 'black', tickText: 'black', grid: 'grey' };
    context.renderChart(type);
    assert.equal(charts.length, 1);
    assert.equal(charts[0].data.datasets[0].data[0], type === 'bar' ? 25000 : 90000);
  });
}
