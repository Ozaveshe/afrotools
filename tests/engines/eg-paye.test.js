// Annual taxable income before Article 8 rounding, expected tax in EGP.
const statutoryCases = [
  [0, 0],
  [40000, 0],
  [55000, 1500],
  [70000, 3750],
  [200000, 29750],
  [400000, 74750],
  [599990, 124747.5],
  [600000, 124750],
  [600009, 124750],
  [600010, 128752.5],
  [699990, 153747.5],
  [700000, 153750],
  [700009, 153750],
  [700010, 156502.5],
  [799990, 181497.5],
  [800000, 181500],
  [800009, 181500],
  [800010, 185002.5],
  [899990, 209997.5],
  [900000, 210000],
  [900009, 210000],
  [900010, 215002.5],
  [1000000, 240000],
  [1000010, 240002.5],
  [1199990, 289997.5],
  [1200000, 290000],
  [1200009, 290000],
  [1200010, 300002.75],
  [1500000, 382500]
];

module.exports = function testEgyptPaye(engine, assert, equal, near) {
  for (const [taxable, expected] of statutoryCases) {
    const result = engine.calculate(taxable + 20000, { nosi: false });
    near(result.tax, expected, 0.01, 'Article 8 PAYE at EGP ' + taxable);
  }
  for (const [gross, insured] of [[0, 0], [24000, 32400], [32400, 32400], [150000, 150000], [200400, 200400], [300000, 200400]]) {
    const result = engine.calculate(gross);
    near(result.nosi, insured * 0.11, 0.01, 'Employee insurance at ' + gross);
    near(result.employerNOSI, insured * 0.1875, 0.01, 'Employer insurance at ' + gross);
    near(result.netMonthly * 12, result.netAnnual, 0.01, 'Monthly take-home at ' + gross);
  }
  const regular = engine.calculate(300000);
  const disability = engine.calculate(300000, { disabled: true });
  equal(disability.personalExemption, 30000, 'Eligible increased personal allowance');
  assert(disability.tax < regular.tax, 'Increased allowance reduces tax');
  equal(engine.calculate(300000, { nosi: false }).nosi, 0, 'Optional insurance switch');
  near(engine.reverseCalc(regular.netAnnual), 300000, 100, 'Reverse calculation');
  for (const amount of [-100, 0, 300000]) equal(engine.validate(amount).valid, amount > 0, 'Salary validity ' + amount);
};
