const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { runInNewContext } = require('node:vm');
const context = { window: {}, ENERGY_DATA: { countries: {
  NG: { currencySymbol: 'NGN ', electricityTariff: { residential: 68 } }
} } };
runInNewContext(readFileSync(resolve(__dirname, '../engines/energy-audit-engine.js'), 'utf8'), context);
const common = { country: 'NG', monthlyBill: 25000, homeSizeSqm: 100, occupants: 4,
  lightingType: 'led', waterHeater: 'electric' };
for (const [acUnits, percent, monthly, annual] of [[0, '25%', '6,250', '75,000'], [1, '48%', '12,000', '144,000']]) {
  const result = context.window.AfroTools.EnergyAuditEngine.calculate({ ...common, acUnits });
  assert.equal(result.opportunities.some(item => item.action.includes('ceiling fans')), acUnits > 0);
  assert.equal(result.potentialSavingPct, percent);
  assert.equal(result.monthlySaving, 'NGN ' + monthly);
  assert.equal(result.annualSaving, 'NGN ' + annual);
}
