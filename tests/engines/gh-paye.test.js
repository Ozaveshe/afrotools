/**
 * Ghana PAYE Engine Tests
 * Annual input, GRA 2026 bands, SSNIT 5.5%.
 */
module.exports = function (engine, assert, assertEqual, assertClose) {

  // ── Below first band (0% on first 5,880) ───────────
  (function () {
    const r = engine.calculate(5000, { ssnit: false });
    assertClose(r.tax, 0, 1, 'GH 5K: below first band -> 0 tax');
    assertClose(r.netAnnual, 5000, 1, 'GH 5K: net = gross when no tax and no SSNIT');
  })();

  // ── GHS 60,000/year ────────────────────────────────
  (function () {
    const r = engine.calculate(60000, { ssnit: true, basicSalary: 60000 });

    // SSNIT: min(60000, 61000) * 5.5% = 3,300
    assertClose(r.ssnit, 3300, 1, 'GH 60K: SSNIT = 3,300');

    // Chargeable = 60000 - 3300 = 56,700
    assertClose(r.chargeableIncome, 56700, 1, 'GH 60K: chargeable = 56,700');

    // Tax on 56,700:
    //   5,880 * 0%    = 0
    //   1,320 * 5%    = 66
    //   1,560 * 10%   = 156
    //   38,000 * 17.5% = 6,650
    //   remaining 9,940 * 25% = 2,485
    // Total = 9,357
    assertClose(r.tax, 9357, 1, 'GH 60K: tax = 9,357');

    assert(r.netAnnual > 0, 'GH 60K: net is positive');
    assertClose(r.netAnnual, 60000 - 3300 - 9357, 1, 'GH 60K: net = gross - SSNIT - tax');
  })();

  // ── SSNIT cap test ─────────────────────────────────
  (function () {
    // Basic above cap
    const r = engine.calculate(100000, { ssnit: true, basicSalary: 80000 });
    // SSNIT base capped at 61,000
    assertClose(r.ssnit, 61000 * 0.055, 1, 'GH SSNIT cap: employee SSNIT capped at 61K base');

    const r2 = engine.calculate(100000, { ssnit: true, basicSalary: 50000 });
    assertClose(r2.ssnit, 50000 * 0.055, 1, 'GH SSNIT: basic below cap uses actual basic');
  })();

  // ── High earner GHS 500,000/year ───────────────────
  (function () {
    const r = engine.calculate(500000, { ssnit: true, basicSalary: 500000 });

    // SSNIT capped: 61000 * 5.5% = 3,355
    assertClose(r.ssnit, 3355, 1, 'GH 500K: SSNIT = 3,355');

    // Chargeable = 500000 - 3355 = 496,645
    assertClose(r.chargeableIncome, 496645, 1, 'GH 500K: chargeable = 496,645');

    // Top bracket 35% should be hit (bands sum: 5880+1320+1560+38000+192000+360000 = 598,760)
    // Chargeable 496,645 < 598,760 so we're in 30% band
    assertEqual(r.marginalRate, 30, 'GH 500K: marginal rate = 30%');

    assert(r.tax > 0, 'GH 500K: tax is positive');
  })();

  // ── Very high earner GHS 1,000,000 → top 35% band ─
  (function () {
    const r = engine.calculate(1000000, { ssnit: true, basicSalary: 1000000 });
    // Chargeable = 1000000 - 3355 = 996,645
    // Band cumulative: 5880+1320+1560+38000+192000+360000 = 598,760, so remaining 397,885 at 35%
    assertEqual(r.marginalRate, 35, 'GH 1M: marginal rate = 35%');
  })();

  // ── Tier 3 optimization test ───────────────────────
  (function () {
    const result = engine.optimizeTier3(200000, { ssnit: true, basicSalary: 200000 });
    assert(result.optimalAmount > 0, 'GH Tier3 optimizer: optimal amount > 0');
    assert(result.taxSaving > 0, 'GH Tier3 optimizer: tax saving > 0');
    assert(result.optimalAmount <= result.maxAmount, 'GH Tier3 optimizer: optimal <= max');
    assert(result.newTax < result.baseTax, 'GH Tier3 optimizer: new tax < base tax');

    // Tier 3 cap = 16.5% of basic
    assertClose(result.maxAmount, 200000 * 0.165, 1, 'GH Tier3: max = 16.5% of basic');
  })();

  // ── Tier 3 contribution reduces tax ────────────────
  (function () {
    const noTier3   = engine.calculate(200000, { ssnit: true, tier3: false });
    const withTier3 = engine.calculate(200000, { ssnit: true, tier3: true, tier3Amount: 10000 });
    assert(withTier3.tax < noTier3.tax, 'GH Tier3: contribution reduces tax');
    assertClose(withTier3.tier3, 10000, 1, 'GH Tier3: amount = 10,000');
  })();

  // ── Bonus tax test ─────────────────────────────────
  (function () {
    const bonus = engine.calcBonusTax(50000, true);
    assertClose(bonus.tax, 2500, 1, 'GH bonus: resident 5% of 50K = 2,500');
    assertClose(bonus.net, 47500, 1, 'GH bonus: net = 47,500');
    assertEqual(bonus.rate, 5, 'GH bonus: resident rate = 5%');

    const nrBonus = engine.calcBonusTax(50000, false);
    assertClose(nrBonus.tax, 5000, 1, 'GH bonus: non-resident 10% = 5,000');
    assertEqual(nrBonus.rate, 10, 'GH bonus: non-resident rate = 10%');
  })();

  // ── Reliefs ────────────────────────────────────────
  (function () {
    const base    = engine.calculate(100000, { ssnit: true });
    const married = engine.calculate(100000, { ssnit: true, marriage: true, children: 2 });

    assertClose(married.marriage, 1200, 1, 'GH reliefs: marriage = 1,200');
    assertClose(married.childRel, 2400, 1, 'GH reliefs: 2 children = 2,400');
    assert(married.tax < base.tax, 'GH reliefs: marriage+children reduces tax');

    // Children capped at 2
    const tooMany = engine.calculate(100000, { ssnit: true, children: 5 });
    assertClose(tooMany.childRel, 2400, 1, 'GH reliefs: children capped at 2 (2,400)');
  })();

  // ── Reverse calc round-trip ────────────────────────
  (function () {
    const originalGross = 120000;
    const opts = { ssnit: true };
    const result = engine.calculate(originalGross, opts);
    const reverseGross = engine.reverseCalc(result.netAnnual, opts);
    assertClose(reverseGross, originalGross, 100, 'GH reverse calc: round-trip within 100 GHS');
  })();

  // ── Validation ─────────────────────────────────────
  (function () {
    assert(engine.validate(0).valid === false, 'Validate: 0 is invalid');
    assert(engine.validate(100000).valid === true, 'Validate: 100K is valid');
  })();
};
