/**
 * Nigeria PAYE Engine Tests
 * Covers PITA 2025 and NTA 2026 regimes.
 */
module.exports = function (engine, assert, assertEqual, assertClose) {

  // ── Zero salary ──────────────────────────────────────
  (function () {
    const r = engine.calculate(0, { regime: 'pita' });
    assertClose(r.tax, 0, 1, 'PITA: zero salary -> 0 tax');
    assertClose(r.netAnnual, 0, 1, 'PITA: zero salary -> 0 net');

    const r2 = engine.calculate(0, { regime: 'nta' });
    assertClose(r2.tax, 0, 1, 'NTA: zero salary -> 0 tax');
  })();

  // ── PITA exempt threshold (840,000) ──────────────────
  (function () {
    const r = engine.calculate(840000, { regime: 'pita', pension: false, nhf: false });
    assertClose(r.tax, 0, 1, 'PITA: salary at exempt threshold (840,000) -> 0 tax');
    assert(r.isExempt === true, 'PITA: salary at exempt threshold is marked exempt');

    const below = engine.calculate(500000, { regime: 'pita', pension: false, nhf: false });
    assertClose(below.tax, 0, 1, 'PITA: salary below exempt threshold -> 0 tax');
    assert(below.isExempt === true, 'PITA: salary below exempt threshold is marked exempt');
  })();

  // ── PITA: median salary 5,000,000 with pension ──────
  (function () {
    const gross = 5000000;
    const r = engine.calculate(gross, { regime: 'pita', pension: true, nhf: false });

    // Pension = 8% of 5M = 400,000
    assertClose(r.pension, 400000, 1, 'PITA 5M: pension = 400,000');

    // CRA = max(200000, 5M*0.01) + 5M*0.20 = 200000 + 1000000 = 1,200,000
    assertClose(r.cra, 1200000, 1, 'PITA 5M: CRA = 1,200,000');

    // Taxable = 5M - 400000 - 1200000 = 3,400,000
    assertClose(r.taxable, 3400000, 1, 'PITA 5M: taxable = 3,400,000');

    // Tax from bands:
    //   300k * 7%  = 21,000
    //   300k * 11% = 33,000
    //   500k * 15% = 75,000
    //   500k * 19% = 95,000
    //   1,600k * 21% = 336,000 (but only 1,800k left)
    //   => 300k+300k+500k+500k = 1,600k used, remaining 1,800k at 21%
    //   1,600k * 21% = 336,000, remaining 200k at 24% = 48,000
    // Wait, total bands: 300+300+500+500+1600 = 3200k, remaining = 200k at 24%
    // Tax = 21000 + 33000 + 75000 + 95000 + 336000 + 48000 = 608,000
    assertClose(r.tax, 608000, 1, 'PITA 5M: tax = 608,000');

    assert(r.isExempt === false, 'PITA 5M: not exempt');
    assert(r.netAnnual > 0, 'PITA 5M: net is positive');
    assertClose(r.netAnnual, gross - r.pension - r.tax, 1, 'PITA 5M: net = gross - pension - tax');
  })();

  // ── PITA: high earner 20,000,000 ────────────────────
  (function () {
    const gross = 20000000;
    const r = engine.calculate(gross, { regime: 'pita', pension: true, nhf: true });

    // pension = 1,600,000; nhf = 500,000; statutory = 2,100,000
    assertClose(r.pension, 1600000, 1, 'PITA 20M: pension = 1,600,000');
    assertClose(r.nhf, 500000, 1, 'PITA 20M: NHF = 500,000');

    // CRA = max(200000, 200000) + 4,000,000 = 4,200,000
    assertClose(r.cra, 4200000, 1, 'PITA 20M: CRA = 4,200,000');

    // Taxable = 20M - 2,100,000 - 4,200,000 = 13,700,000
    assertClose(r.taxable, 13700000, 1, 'PITA 20M: taxable = 13,700,000');

    // Top bracket (24%) should be hit
    assert(r.marginalRate === 24, 'PITA 20M: marginal rate = 24%');
    assert(r.tax > 0, 'PITA 20M: tax is positive');
  })();

  // ── NTA: same salaries produce different results ────
  (function () {
    const gross = 5000000;
    const pitaR = engine.calculate(gross, { regime: 'pita', pension: true, nhf: false });
    const ntaR  = engine.calculate(gross, { regime: 'nta',  pension: true, nhf: false });

    assert(pitaR.tax !== ntaR.tax, 'NTA vs PITA 5M: different tax amounts');
    assert(pitaR.regime === 'pita', 'PITA result has correct regime label');
    assert(ntaR.regime === 'nta', 'NTA result has correct regime label');

    // NTA has 800k 0% band, no CRA, no minimum tax
    assertClose(ntaR.cra, 0, 1, 'NTA: CRA is 0 (replaced by 0% band)');
  })();

  // ── NTA: median salary 5,000,000 with pension ──────
  (function () {
    const gross = 5000000;
    const r = engine.calculate(gross, { regime: 'nta', pension: true, nhf: false });

    // Pension = 8% of 5M = 400,000
    assertClose(r.pension, 400000, 1, 'NTA 5M: pension = 400,000');

    // Taxable = 5M - 400,000 = 4,600,000
    assertClose(r.taxable, 4600000, 1, 'NTA 5M: taxable = 4,600,000');

    // NTA bands on 4,600,000:
    //   800k * 0%   = 0
    //   2,200k * 15% = 330,000
    //   1,600k * 18% = 288,000 (only 1,600k of the 9M band used)
    // Total = 618,000
    assertClose(r.tax, 618000, 1, 'NTA 5M: tax = 618,000');
  })();

  // ── NTA: high earner 20,000,000 ─────────────────────
  (function () {
    const gross = 20000000;
    const r = engine.calculate(gross, { regime: 'nta', pension: true, nhf: true });

    // Taxable = 20M - pension(1.6M) - nhf(500k) = 17,900,000
    assertClose(r.taxable, 17900000, 1, 'NTA 20M: taxable = 17,900,000');

    // Should hit 23% band (25M limit starts at 800+2200+9000+13000 = 25,000k cumulative)
    // Taxable 17.9M: 800k(0%) + 2200k(15%) + 9000k(18%) = 12,000k used; remaining 5.9M in 13M band (21%)
    assertEqual(r.marginalRate, 21, 'NTA 20M: marginal rate = 21%');
  })();

  // ── NTA: rent relief ────────────────────────────────
  (function () {
    const gross = 5000000;
    const withRent = engine.calculate(gross, { regime: 'nta', pension: false, nhf: false, annualRent: 2000000 });
    const noRent   = engine.calculate(gross, { regime: 'nta', pension: false, nhf: false });

    // Rent relief = min(2M * 20%, 500k) = min(400k, 500k) = 400k
    assertClose(withRent.rentRelief, 400000, 1, 'NTA: rent relief = 400,000 for 2M rent');
    assert(withRent.tax < noRent.tax, 'NTA: rent relief reduces tax');
  })();

  // ── Reverse calc round-trip ─────────────────────────
  (function () {
    const originalGross = 5000000;
    const opts = { regime: 'nta', pension: true, nhf: true };
    const result = engine.calculate(originalGross, opts);
    const reverseGross = engine.reverseCalc(result.netAnnual, opts);

    assertClose(reverseGross, originalGross, 100, 'NTA reverse calc: round-trip within 100 NGN');

    // PITA reverse
    const pitaOpts = { regime: 'pita', pension: true, nhf: true };
    const pitaResult = engine.calculate(originalGross, pitaOpts);
    const pitaReverse = engine.reverseCalc(pitaResult.netAnnual, pitaOpts);
    assertClose(pitaReverse, originalGross, 100, 'PITA reverse calc: round-trip within 100 NGN');
  })();

  // ── Deduction combos ────────────────────────────────
  (function () {
    const gross = 10000000;

    const pensionOnly = engine.calculate(gross, { regime: 'pita', pension: true, nhf: false });
    const pensionNhf  = engine.calculate(gross, { regime: 'pita', pension: true, nhf: true });
    const allDeduc    = engine.calculate(gross, { regime: 'pita', pension: true, nhf: true, nhis: true, nhisRate: 5 });

    assert(pensionOnly.statutory < pensionNhf.statutory, 'PITA 10M: pension+NHF statutory > pension only');
    assert(pensionNhf.statutory < allDeduc.statutory, 'PITA 10M: all deductions statutory > pension+NHF');
    assert(pensionOnly.tax > pensionNhf.tax, 'PITA 10M: more deductions -> less tax');
    assert(pensionNhf.tax > allDeduc.tax, 'PITA 10M: all deductions -> even less tax');
  })();

  // ── Validation ──────────────────────────────────────
  (function () {
    assert(engine.validate(0).valid === false, 'Validate: 0 is invalid');
    assert(engine.validate(-100).valid === false, 'Validate: negative is invalid');
    assert(engine.validate(1000000).valid === true, 'Validate: 1M is valid');
    assert(engine.validate(20000000000).valid === false, 'Validate: >10B is invalid');
  })();
};
