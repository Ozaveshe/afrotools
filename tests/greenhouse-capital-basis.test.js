'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

for (const file of ['engines/src/greenhouse-engine.js', 'engines/greenhouse-engine.js']) {
  test(file + ' requires an investment for ROI and positive cash return for payback', () => {
    const context = vm.createContext({});
    context.window = context;
    for (const source of ['data/agriculture/greenhouse-data.js', file]) {
      vm.runInContext(fs.readFileSync(path.resolve(__dirname, '..', source), 'utf8'), context);
    }
    const base = {
      countryCode: 'KE', greenhouseType: 'steel_polythene', crop: 'tomato',
      area: 240, cyclesPerYear: 2, waterSource: 'municipal', isNewSetup: true
    };
    const calculate = changes => context.GHEngine.calculate({ ...base, ...changes });
    const initial = calculate({});
    assert.equal(initial.capitalBasis, 542400);
    assert.equal(initial.payback, initial.capitalBasis / initial.netProfit);
    const existing = calculate({ isNewSetup: false });
    assert.equal(existing.netProfit, initial.netProfit);
    assert.equal(existing.setup.total, null);
    assert.equal(existing.roi, null);
    assert.equal(existing.payback, null);
    const loss = calculate({ greenhouseType: 'steel_polycarbonate', crop: 'lettuce', cyclesPerYear: 1 });
    assert.ok(loss.netProfit < 0 && loss.roi < 0);
    assert.equal(loss.payback, null);
    const zero = calculate({ countryCode: 'GH', greenhouseType: 'steel_polycarbonate', crop: 'herbs' });
    assert.equal(zero.netProfit, 0);
    assert.equal(zero.roi, 0);
    assert.equal(zero.payback, null);
  });
}
