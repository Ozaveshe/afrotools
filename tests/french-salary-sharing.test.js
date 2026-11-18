const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { refreshFrenchSalarySharing } = require('../scripts/lib/french-salary-sharing');

for (const [route, currency] of [['ethiopia/et-paye', 'ETB'], ['sierra-leone/sl-paye', 'SLE']]) {
  test(route + ' preserves the selected period when sharing', async () => {
    const html = fs.readFileSync(path.join(__dirname, '../fr', route + '.html'), 'utf8');
    assert.equal(refreshFrenchSalarySharing(html, route), html);
    const handler = html.match(/function shareResult\(\) \{[\s\S]*?async function shareFrenchResult[\s\S]*?\n\}/)[0];
    const state = {
      RESULT: { gross: 20000, netMonthly: 15000, monthlyPAYE: 3000, annualNet: 180000, annualTax: 36000, effectiveRate: 0.15 },
      document: { getElementById: () => ({}) },
      navigator: { share: async payload => { state.payload = payload; } },
    };
    vm.createContext(state);
    vm.runInContext(handler, state);
    for (const [period, net] of [['monthly', 15000], ['annual', 180000]]) {
      state.PERIOD = period;
      await state.shareResult();
      assert.equal(state.payload.url, 'https://afrotools.com/fr/' + route);
      assert.ok(state.payload.text.includes(net.toLocaleString('fr-FR') + ' ' + currency));
      assert.ok(state.payload.text.includes(period === 'monthly' ? 'mensuel' : 'annuel'));
    }
  });
}
