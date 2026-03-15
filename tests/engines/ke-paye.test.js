/**
 * Kenya PAYE Engine Tests
 * Monthly input, KRA bands, NSSF tiered, SHIF 2.75%.
 */
module.exports = function (engine, assert, assertEqual, assertClose) {

  // ── Minimum wage (~15,000 KES) ──────────────────────
  (function () {
    const r = engine.calculate(15000, { nssf: true, shif: true, personalRelief: true });

    // NSSF: min(15000, 8000)*6% + max(0, min(15000,72000)-8000)*6% = 480 + 420 = 900
    assertClose(r.nssf, 900, 1, 'KE 15K: NSSF = 900');

    // SHIF: max(300, 15000*0.0275) = max(300, 412.5) = 412.5
    assertClose(r.shif, 412.5, 1, 'KE 15K: SHIF = 412.5');

    // Taxable = 15000 - 900 - 412.5 = 13,687.5
    assertClose(r.taxable, 13687.5, 1, 'KE 15K: taxable = 13,687.5');

    // Gross tax: 13687.5 * 10% = 1368.75 (all in first band of 24,000)
    assertClose(r.grossTax, 1368.75, 1, 'KE 15K: gross tax = 1,368.75');

    // PAYE = max(0, 1368.75 - 2400) = 0
    assertClose(r.paye, 0, 1, 'KE 15K: PAYE = 0 (personal relief covers it)');
  })();

  // ── KES 100,000/month ──────────────────────────────
  (function () {
    const r = engine.calculate(100000, { nssf: true, shif: true, ahl: false, personalRelief: true });

    // NSSF: 8000*6% + (72000-8000)*6% = 480 + 3840 = 4320
    assertClose(r.nssf, 4320, 1, 'KE 100K: NSSF = 4,320');

    // SHIF: max(300, 100000*0.0275) = 2750
    assertClose(r.shif, 2750, 1, 'KE 100K: SHIF = 2,750');

    // Taxable = 100000 - 4320 - 2750 = 92,930
    assertClose(r.taxable, 92930, 1, 'KE 100K: taxable = 92,930');

    // Tax bands on 92,930:
    //   24,000 * 10% = 2,400
    //   8,333 * 25%  = 2,083.25
    //   remaining 60,597 * 30% = 18,179.10
    // Gross tax = 22,662.35
    assertClose(r.grossTax, 22662.35, 1, 'KE 100K: gross tax = 22,662.35');

    // PAYE = max(0, 22662.35 - 2400) = 20,262.35
    assertClose(r.paye, 20262.35, 1, 'KE 100K: PAYE = 20,262.35');

    // Net = 100000 - 4320 - 2750 - 20262.35 = 72,667.65
    assertClose(r.net, 72667.65, 1, 'KE 100K: net = 72,667.65');

    assert(r.net > 0, 'KE 100K: net is positive');
  })();

  // ── KES 100,000 with AHL ───────────────────────────
  (function () {
    const withAHL = engine.calculate(100000, { nssf: true, shif: true, ahl: true, personalRelief: true });
    const noAHL   = engine.calculate(100000, { nssf: true, shif: true, ahl: false, personalRelief: true });

    // AHL = 1.5% of 100K = 1500
    assertClose(withAHL.ahl, 1500, 1, 'KE 100K: AHL = 1,500');

    // AHL does NOT reduce taxable income (repealed Dec 2024)
    assertClose(withAHL.taxable, noAHL.taxable, 1, 'KE 100K: AHL does not reduce taxable');

    // But AHL reduces net pay
    assert(withAHL.net < noAHL.net, 'KE 100K: AHL reduces net pay');
  })();

  // ── High earner KES 1,000,000/month ────────────────
  (function () {
    const r = engine.calculate(1000000, { nssf: true, shif: true, personalRelief: true });

    // NSSF capped: 8000*6% + (72000-8000)*6% = 4320
    assertClose(r.nssf, 4320, 1, 'KE 1M: NSSF capped at 4,320');

    // SHIF = 1000000 * 2.75% = 27,500
    assertClose(r.shif, 27500, 1, 'KE 1M: SHIF = 27,500');

    // Taxable = 1000000 - 4320 - 27500 = 968,180
    assertClose(r.taxable, 968180, 1, 'KE 1M: taxable = 968,180');

    // Top bracket should be 35% (above 800,000)
    assertEqual(r.marginalRate, 35, 'KE 1M: marginal rate = 35%');

    assert(r.paye > 0, 'KE 1M: PAYE is positive');
    assert(r.net > 0, 'KE 1M: net is positive');
  })();

  // ── Disability exemption ───────────────────────────
  (function () {
    const normal   = engine.calculate(150000, { disability: false, personalRelief: true });
    const disabled = engine.calculate(150000, { disability: true,  personalRelief: true });

    assertEqual(disabled.disabilityExempt, 150000, 'KE disability: 150K exemption');
    assert(disabled.paye < normal.paye, 'KE disability: reduces PAYE');
    assertClose(disabled.taxable, Math.max(0, disabled.gross - disabled.nssf - disabled.shif - 150000), 1, 'KE disability: taxable reduced by 150K');
  })();

  // ── Reverse calc round-trip ────────────────────────
  (function () {
    const originalGross = 100000;
    const opts = { nssf: true, shif: true, personalRelief: true };
    const result = engine.calculate(originalGross, opts);
    const reverseGross = engine.reverseCalc(result.net, opts);
    assertClose(reverseGross, originalGross, 100, 'KE reverse calc: round-trip within 100 KES');
  })();

  // ── Employer costs ─────────────────────────────────
  (function () {
    const r = engine.calculate(100000, { nssf: true, shif: true });
    assertClose(r.employerNSSF, 4320, 1, 'KE 100K: employer NSSF = 4,320');
    assertClose(r.employerAHL, 1500, 1, 'KE 100K: employer AHL = 1,500');
    assertClose(r.totalEmployerCost, 100000 + 4320 + 1500, 1, 'KE 100K: total employer cost correct');
  })();

  // ── Validation ─────────────────────────────────────
  (function () {
    assert(engine.validate(0).valid === false, 'Validate: 0 is invalid');
    assert(engine.validate(-50).valid === false, 'Validate: negative is invalid');
    assert(engine.validate(50000).valid === true, 'Validate: 50K is valid');
  })();
};
