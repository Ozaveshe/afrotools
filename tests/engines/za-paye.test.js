/**
 * South Africa PAYE Engine Tests
 * Annual input, SARS 2025/26 bands, age-based rebates.
 */
module.exports = function (engine, assert, assertEqual, assertClose) {

  // ── Below threshold (under-65: R95,750) ────────────
  (function () {
    const r = engine.calculate(95750, { ageGroup: 'under65', retirement: 0, uif: true });
    assertClose(r.paye, 0, 1, 'ZA 95,750: below under-65 threshold -> 0 PAYE');
    assert(r.grossTax <= r.rebate, 'ZA 95,750: gross tax <= rebate');
  })();

  (function () {
    const r = engine.calculate(50000, { ageGroup: 'under65', retirement: 0, uif: true });
    assertClose(r.paye, 0, 1, 'ZA 50K: well below threshold -> 0 PAYE');
  })();

  // ── Median salary R350,000 ─────────────────────────
  (function () {
    const r = engine.calculate(350000, { ageGroup: 'under65', retirement: 0, uif: true });

    // Taxable = 350,000 (no retirement deduction)
    assertClose(r.taxableIncome, 350000, 1, 'ZA 350K: taxable = 350,000');

    // Tax bands:
    //   237,100 * 18% = 42,678
    //   (350,000 - 237,100) = 112,900 * 26% = 29,354
    //   Gross tax = 72,032
    assertClose(r.grossTax, 72032, 1, 'ZA 350K: gross tax = 72,032');

    // Rebate (under-65) = 17,235
    assertEqual(r.rebate, 17235, 'ZA 350K: rebate = 17,235');

    // PAYE = 72,032 - 17,235 = 54,797
    assertClose(r.paye, 54797, 1, 'ZA 350K: PAYE = 54,797');

    // UIF = min(350000, 212544) * 1% = 2,125.44
    assertClose(r.uif, 2125.44, 1, 'ZA 350K: UIF = 2,125.44');

    assertClose(r.netAnnual, 350000 - 54797 - 2125.44, 1, 'ZA 350K: net correct');
  })();

  // ── High earner R2,000,000 ─────────────────────────
  (function () {
    const r = engine.calculate(2000000, { ageGroup: 'under65', retirement: 0, uif: true });

    // Top bracket 45% should be hit (from 1,817,001)
    assertEqual(r.marginalRate, 45, 'ZA 2M: marginal rate = 45%');

    assert(r.paye > 0, 'ZA 2M: PAYE is positive');
    assert(r.netAnnual > 0, 'ZA 2M: net is positive');

    // Verify effective rate is reasonable (should be ~30-35%)
    assert(r.effectiveRate > 25 && r.effectiveRate < 40, 'ZA 2M: effective rate between 25-40%');
  })();

  // ── Age-based rebate test (65+) ────────────────────
  (function () {
    const under65 = engine.calculate(200000, { ageGroup: 'under65', retirement: 0, uif: false });
    const over65  = engine.calculate(200000, { ageGroup: '65to74', retirement: 0, uif: false });
    const over75  = engine.calculate(200000, { ageGroup: '75plus', retirement: 0, uif: false });

    // 65+ has higher rebate: 17235 + 9444 = 26,679
    assertEqual(over65.rebate, 26679, 'ZA 65+: rebate = 26,679');

    // 75+ has highest rebate: 17235 + 9444 + 3145 = 29,824
    assertEqual(over75.rebate, 29824, 'ZA 75+: rebate = 29,824');

    // Higher rebate means less PAYE (or 0)
    assert(over65.paye <= under65.paye, 'ZA 65+: PAYE <= under-65 PAYE');
    assert(over75.paye <= over65.paye, 'ZA 75+: PAYE <= 65+ PAYE');

    // 65+ threshold
    assertEqual(over65.threshold, 148217, 'ZA 65+: threshold = 148,217');
    assertEqual(over75.threshold, 165689, 'ZA 75+: threshold = 165,689');
  })();

  // ── 65+ below their threshold ──────────────────────
  (function () {
    const r = engine.calculate(148217, { ageGroup: '65to74', retirement: 0, uif: false });
    assertClose(r.paye, 0, 1, 'ZA 148,217 (65+): at threshold -> 0 PAYE');
  })();

  // ── Medical tax credit test ────────────────────────
  (function () {
    const noMed   = engine.calculate(500000, { ageGroup: 'under65', medMembers: 0 });
    const oneMed  = engine.calculate(500000, { ageGroup: 'under65', medMembers: 1 });
    const twoMed  = engine.calculate(500000, { ageGroup: 'under65', medMembers: 2 });
    const threeMed = engine.calculate(500000, { ageGroup: 'under65', medMembers: 3 });

    // 1 member: 364/mo = 4,368/yr
    assertClose(oneMed.mtcAnnual, 4368, 1, 'ZA MTC: 1 member = 4,368/yr');

    // 2 members: 728/mo = 8,736/yr
    assertClose(twoMed.mtcAnnual, 8736, 1, 'ZA MTC: 2 members = 8,736/yr');

    // 3 members: 728 + 246 = 974/mo = 11,688/yr
    assertClose(threeMed.mtcAnnual, 11688, 1, 'ZA MTC: 3 members = 11,688/yr');

    assert(oneMed.paye < noMed.paye, 'ZA MTC: 1 member reduces PAYE');
    assert(twoMed.paye < oneMed.paye, 'ZA MTC: 2 members reduces PAYE more');
    assert(threeMed.paye < twoMed.paye, 'ZA MTC: 3 members reduces PAYE more');
  })();

  // ── UIF ceiling test ───────────────────────────────
  (function () {
    const lowSalary  = engine.calculate(200000, { uif: true });
    const highSalary = engine.calculate(500000, { uif: true });

    // UIF ceiling: R212,544/year
    assertClose(lowSalary.uif, 200000 * 0.01, 1, 'ZA UIF: below ceiling -> 1% of gross');
    assertClose(highSalary.uif, 212544 * 0.01, 1, 'ZA UIF: above ceiling -> 1% of R212,544');
  })();

  // ── Retirement deduction ───────────────────────────
  (function () {
    const noRet  = engine.calculate(500000, { retirement: 0 });
    const ret50k = engine.calculate(500000, { retirement: 50000 });

    assertClose(ret50k.retirement, 50000, 1, 'ZA retirement: 50K deducted');
    assertClose(ret50k.taxableIncome, 450000, 1, 'ZA retirement: taxable reduced by 50K');
    assert(ret50k.paye < noRet.paye, 'ZA retirement: reduces PAYE');

    // Cap test: 27.5% of R500K = R137,500 (below R350K cap)
    const bigRet = engine.calculate(500000, { retirement: 200000 });
    assertClose(bigRet.retirement, 137500, 1, 'ZA retirement: capped at 27.5% of gross');
  })();

  // ── Reverse calc round-trip ────────────────────────
  (function () {
    const originalGross = 500000;
    const opts = { ageGroup: 'under65', retirement: 0, uif: true };
    const result = engine.calculate(originalGross, opts);
    const reverseGross = engine.reverseCalc(result.netAnnual, opts);
    assertClose(reverseGross, originalGross, 100, 'ZA reverse calc: round-trip within 100 ZAR');
  })();

  // ── Employer costs ─────────────────────────────────
  (function () {
    const r = engine.calculate(300000, { uif: true });
    // Employer UIF = min(300000, 212544) * 1% = 2125.44
    assertClose(r.employerUIF, 2125.44, 1, 'ZA employer UIF = 2,125.44');
    // SDL = 1% of gross
    assertClose(r.employerSDL, 3000, 1, 'ZA employer SDL = 3,000');
  })();

  // ── Validation ─────────────────────────────────────
  (function () {
    assert(engine.validate(0).valid === false, 'Validate: 0 is invalid');
    assert(engine.validate(350000).valid === true, 'Validate: 350K is valid');
  })();
};
