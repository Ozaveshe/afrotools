// Published GRA Act 1178 bands (effective 1 Sep 2026) and SSNIT's 2026 notice.
// The engine accepts annual GHS inputs; published monthly examples are multiplied by 12.
module.exports = function (engine, assert, assertEqual, assertClose) {
  const noDeductions = engine.calculate(7056, { ssnit: false });
  assertClose(noDeductions.tax, 0, 0.01, 'GH 7,056 annual chargeable: 0% band');
  assertClose(noDeductions.netAnnual, 7056, 0.01, 'GH 7,056 annual chargeable: net equals gross');

  const firstTaxedCedi = engine.calculate(8016, { ssnit: false });
  assertClose(firstTaxedCedi.tax, 48, 0.01, 'GH next 960 annual: 5% yields GHS 48');
  const publishedBoundaries = [
    [9216, 168], [44016, 6258], [236016, 54258], [600000, 163453.2]
  ];
  publishedBoundaries.forEach(([income, expectedTax]) => {
    assertClose(engine.calculate(income, { ssnit: false }).tax, expectedTax, 0.01,
      'GH Act 1178 annual boundary ' + income + ': cumulative PAYE');
  });
  assertClose(engine.calculate(600001, { ssnit: false }).tax, 163453.55, 0.01,
    'GH first cedi above 600,000: 35% marginal rate');

  const midBand = engine.calculate(60000, { ssnit: true, basicSalary: 60000 });
  assertClose(midBand.ssnit, 3300, 0.01, 'GH 60K basic: employee SSNIT is 5.5%');
  assertClose(midBand.chargeableIncome, 56700, 0.01, 'GH 60K: chargeable is 56,700');
  assertClose(midBand.tax, 9429, 0.01, 'GH 60K: Act 1178 PAYE is 9,429');
  assertClose(midBand.netAnnual, 47271, 0.01, 'GH 60K: net is 47,271');

  const belowCap = engine.calculate(72000, { ssnit: true, basicSalary: 72000 });
  assertClose(belowCap.ssnit, 3960, 0.01, 'GH 6K monthly basic: SSNIT is 330 monthly');
  const atCap = engine.calculate(828000, { ssnit: true, basicSalary: 828000 });
  const aboveCap = engine.calculate(900000, { ssnit: true, basicSalary: 900000 });
  assertClose(atCap.ssnit, 45540, 0.01, 'GH 69K monthly basic: annual employee SSNIT cap is 45,540');
  assertClose(aboveCap.ssnit, 45540, 0.01, 'GH above cap: employee SSNIT stays capped');

  const gross8k = 8000 * 12;
  const basic6k = 6000 * 12;
  const withoutTier3 = engine.calculate(gross8k, { ssnit: true, basicSalary: basic6k });
  const withTier3 = engine.calculate(gross8k, {
    ssnit: true, basicSalary: basic6k, tier3: true, tier3Amount: 660 * 12
  });
  assertClose(withoutTier3.tax / 12, 1522, 0.01, 'GH article example: monthly PAYE before Tier III');
  assertClose(withTier3.tax / 12, 1357, 0.01, 'GH article example: monthly PAYE after qualifying Tier III');
  assertClose((withoutTier3.tax - withTier3.tax) / 12, 165, 0.01, 'GH article example: monthly tax saving');
  assertClose(withoutTier3.netMonthly, 6148, 0.01, 'GH article example: cash without Tier III');
  assertClose(withTier3.netMonthly, 5653, 0.01, 'GH article example: cash with Tier III');

  const relief = engine.calculate(100000, { children: 5, marriage: true });
  assertClose(relief.childRel, 1800, 0.01, 'GH child education relief: GHS 600 each, maximum 3');
  assertClose(relief.marriage, 1200, 0.01, 'GH marriage relief: GHS 1,200');

  const highIncome = engine.calculate(1000000, { ssnit: true, basicSalary: 1000000 });
  assertEqual(highIncome.marginalRate, 35, 'GH above 600K chargeable: 35% marginal band');
  assert(engine.validate(0).valid === false, 'GH validate: zero is invalid');
  assert(engine.validate(100000).valid === true, 'GH validate: positive amount is valid');
};
