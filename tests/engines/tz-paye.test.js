/**
 * Tanzania PAYE Engine Tests
 * Monthly input, TRA bands, NSSF/PSSSF by sector.
 */
module.exports = function (engine, assert, assertEqual, assertClose) {

  // ── Below 270,000/month → 0 tax ───────────────────
  (function () {
    // With private NSSF (10%): taxable = 270000 * 0.9 = 243,000 (below 270k band)
    const r = engine.calculate(270000, { sector: 'private', nssf: true });
    assertClose(r.paye, 0, 1, 'TZ 270K: below threshold -> 0 PAYE');

    // Without NSSF: taxable = 270,000 exactly at boundary
    const r2 = engine.calculate(270000, { sector: 'private', nssf: false });
    assertClose(r2.paye, 0, 1, 'TZ 270K (no NSSF): at boundary -> 0 PAYE');
  })();

  (function () {
    const r = engine.calculate(200000, { sector: 'private', nssf: true });
    assertClose(r.paye, 0, 1, 'TZ 200K: well below threshold -> 0 PAYE');
  })();

  // ── TZS 500,000/month → 8% band ──────────────────
  (function () {
    const r = engine.calculate(500000, { sector: 'private', nssf: true });

    // Social security (private employee) = 10% of 500K = 50,000
    assertClose(r.socialEmployee, 50000, 1, 'TZ 500K: NSSF employee = 50,000');

    // Taxable = 500000 - 50000 = 450,000
    assertClose(r.taxable, 450000, 1, 'TZ 500K: taxable = 450,000');

    // Tax on 450,000:
    //   270,000 * 0% = 0
    //   180,000 * 8% = 14,400
    assertClose(r.paye, 14400, 1, 'TZ 500K: PAYE = 14,400');

    assertEqual(r.marginalRate, 8, 'TZ 500K: marginal rate = 8%');
    assertClose(r.net, 500000 - 50000 - 14400, 1, 'TZ 500K: net correct');
  })();

  // ── TZS 1,500,000/month → 30% band ───────────────
  (function () {
    const r = engine.calculate(1500000, { sector: 'private', nssf: true });

    // Social = 10% of 1.5M = 150,000
    assertClose(r.socialEmployee, 150000, 1, 'TZ 1.5M: NSSF = 150,000');

    // Taxable = 1,500,000 - 150,000 = 1,350,000
    assertClose(r.taxable, 1350000, 1, 'TZ 1.5M: taxable = 1,350,000');

    // Tax:
    //   270,000 * 0%  = 0
    //   250,000 * 8%  = 20,000
    //   240,000 * 20% = 48,000
    //   240,000 * 25% = 60,000
    //   350,000 * 30% = 105,000
    // Total = 233,000
    assertClose(r.paye, 233000, 1, 'TZ 1.5M: PAYE = 233,000');

    assertEqual(r.marginalRate, 30, 'TZ 1.5M: marginal rate = 30%');
  })();

  // ── Private vs public sector social security ──────
  (function () {
    const priv = engine.calculate(1000000, { sector: 'private', nssf: true });
    const pub  = engine.calculate(1000000, { sector: 'public',  nssf: true });

    // Private employee = 10%, Public employee = 5%
    assertClose(priv.socialEmployee, 100000, 1, 'TZ private: employee social = 10% = 100K');
    assertClose(pub.socialEmployee,  50000,  1, 'TZ public: employee social = 5% = 50K');

    assertEqual(priv.socialEmpRate, 10, 'TZ private: employee rate = 10%');
    assertEqual(pub.socialEmpRate, 5, 'TZ public: employee rate = 5%');

    // Public has higher employer contribution
    assertClose(priv.socialEmployer, 100000, 1, 'TZ private: employer social = 10% = 100K');
    assertClose(pub.socialEmployer,  150000, 1, 'TZ public: employer social = 15% = 150K');

    // Public taxable is higher (less employee deduction)
    assert(pub.taxable > priv.taxable, 'TZ public: higher taxable (lower employee deduction)');
    assert(pub.paye > priv.paye, 'TZ public: higher PAYE');
  })();

  // ── No NSSF option ─────────────────────────────────
  (function () {
    const withNSSF = engine.calculate(500000, { sector: 'private', nssf: true });
    const noNSSF   = engine.calculate(500000, { sector: 'private', nssf: false });

    assertClose(noNSSF.socialEmployee, 0, 1, 'TZ no NSSF: employee social = 0');
    assert(noNSSF.taxable > withNSSF.taxable, 'TZ no NSSF: higher taxable');
    assert(noNSSF.paye > withNSSF.paye, 'TZ no NSSF: higher PAYE');
  })();

  // ── Secondary employment (flat 30%) ───────────────
  (function () {
    const primary   = engine.calculate(1000000, { sector: 'private', nssf: true, secondary: false });
    const secondary = engine.calculate(1000000, { sector: 'private', nssf: true, secondary: true });

    assert(secondary.isSecondary === true, 'TZ secondary: flagged as secondary');
    assertEqual(secondary.marginalRate, 30, 'TZ secondary: flat 30% rate');

    // Secondary tax = taxable * 30%
    const expectedSecondaryTax = secondary.taxable * 0.30;
    assertClose(secondary.paye, expectedSecondaryTax, 1, 'TZ secondary: PAYE = taxable * 30%');

    // Secondary tax should be higher than progressive
    assert(secondary.paye > primary.paye, 'TZ secondary: higher tax than progressive');
  })();

  // ── Reverse calc round-trip ────────────────────────
  (function () {
    const originalGross = 800000;
    const opts = { sector: 'private', nssf: true };
    const result = engine.calculate(originalGross, opts);
    const reverseGross = engine.reverseCalc(result.net, opts);
    assertClose(reverseGross, originalGross, 100, 'TZ reverse calc (private): round-trip within 100 TZS');

    // Public sector round-trip
    const pubOpts = { sector: 'public', nssf: true };
    const pubResult = engine.calculate(originalGross, pubOpts);
    const pubReverse = engine.reverseCalc(pubResult.net, pubOpts);
    assertClose(pubReverse, originalGross, 100, 'TZ reverse calc (public): round-trip within 100 TZS');
  })();

  // ── Annual net computation ─────────────────────────
  (function () {
    const r = engine.calculate(1000000, { sector: 'private', nssf: true });
    assertClose(r.netAnnual, r.net * 12, 1, 'TZ: netAnnual = net * 12');
  })();

  // ── Employer costs ─────────────────────────────────
  (function () {
    const r = engine.calculate(500000, { sector: 'private', nssf: true });
    assertClose(r.employerSocial, 50000, 1, 'TZ employer: private social = 50K');
    assertClose(r.totalEmployerCost, 550000, 1, 'TZ employer: total cost = 550K');
  })();

  // ── Validation ─────────────────────────────────────
  (function () {
    assert(engine.validate(0).valid === false, 'Validate: 0 is invalid');
    assert(engine.validate(-100).valid === false, 'Validate: negative is invalid');
    assert(engine.validate(500000).valid === true, 'Validate: 500K is valid');
  })();
};
