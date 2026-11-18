const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// PURC's October 2026 schedule and Water.aspx reckoner use full precision
// for the total; adding the separately displayed components can differ by 0.01.
for (const file of ['engines/src/water-bill-engine.js', 'engines/water-bill-engine.js']) {
  test(file + ' matches PURC metered bill examples', () => {
    const context = {window: {}};
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
    const engine = context.window.AfroTools.WaterBillEngine;
    function bill(volume, type = 'residential', people = 4) {
      return engine.calculate({monthlyUsage: volume, householdSize: people, customerType: type}, 'GH');
    }
    assert.equal(bill(4).monthlyBill, 'GH₵34.66');
    assert.equal(bill(5).monthlyBill, 'GH₵40.82');
    assert.equal(bill(5.1).monthlyBill, 'GH₵65.63');
    const home = bill(15);
    assert.equal(home.energyCharge, 'GH₵158.84');
    assert.equal(home.levyCharge, 'GH₵4.77');
    assert.equal(home.fixedCharge, 'GH₵10.00');
    assert.equal(home.monthlyBill, 'GH₵173.61');
    assert.equal(home.perPersonPerDay, '125.0 L/person');
    assert.equal(bill(15, 'commercial').monthlyBill, 'GH₵515.19');
    assert.equal(bill(0, 'commercial').monthlyBill, 'GH₵20.00');
    for (const value of ['', -1, Infinity]) assert.ok(bill(value).error);
    assert.ok(bill(15, 'residential', 0.5).error);
    assert.ok(bill(15, 'industrial').error);
  });
}
