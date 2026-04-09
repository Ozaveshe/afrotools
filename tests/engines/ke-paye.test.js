module.exports = function (engine, assert, assertEqual, assertClose) {
  (function () {
    const result = engine.calculate(15000, { nssf: true, shif: true, personalRelief: true });
    assertClose(result.nssf, 900, 1, "KE 15K: NSSF = 900");
    assertClose(result.shif, 412.5, 1, "KE 15K: SHIF = 412.5");
    assertClose(result.taxable, 13687.5, 1, "KE 15K: taxable = 13,687.5");
    assertClose(result.grossTax, 1368.75, 1, "KE 15K: gross tax = 1,368.75");
    assertClose(result.paye, 0, 1, "KE 15K: PAYE = 0 (personal relief covers it)");
  }());

  (function () {
    const result = engine.calculate(100000, { nssf: true, shif: true, ahl: false, personalRelief: true });
    assertClose(result.nssf, 6000, 1, "KE 100K: NSSF = 6,000");
    assertClose(result.shif, 2750, 1, "KE 100K: SHIF = 2,750");
    assertClose(result.taxable, 91250, 1, "KE 100K: taxable = 91,250");
    assertClose(result.grossTax, 22158.35, 1, "KE 100K: gross tax = 22,158.35");
    assertClose(result.paye, 19758.35, 1, "KE 100K: PAYE = 19,758.35");
    assertClose(result.net, 71491.65, 1, "KE 100K: net = 71,491.65");
    assert(result.net > 0, "KE 100K: net is positive");
  }());

  (function () {
    const withAhl = engine.calculate(100000, { nssf: true, shif: true, ahl: true, personalRelief: true });
    const withoutAhl = engine.calculate(100000, { nssf: true, shif: true, ahl: false, personalRelief: true });

    assertClose(withAhl.ahl, 1500, 1, "KE 100K: AHL = 1,500");
    assertClose(withAhl.taxable, 89750, 1, "KE 100K: AHL lowers taxable to 89,750");
    assertClose(withAhl.grossTax, 21708.35, 1, "KE 100K: AHL lowers gross tax to 21,708.35");
    assertClose(withAhl.paye, 19308.35, 1, "KE 100K: PAYE = 19,308.35 with AHL deduction");
    assertClose(withAhl.net, 70441.65, 1, "KE 100K: net reflects deductible AHL");
    assert(withAhl.taxable < withoutAhl.taxable, "KE 100K: AHL reduces taxable");
    assert(withAhl.net < withoutAhl.net, "KE 100K: AHL reduces net pay");
  }());

  (function () {
    const result = engine.calculate(1000000, { nssf: true, shif: true, personalRelief: true });
    assertClose(result.nssf, 6480, 1, "KE 1M: NSSF capped at 6,480");
    assertClose(result.shif, 27500, 1, "KE 1M: SHIF = 27,500");
    assertClose(result.taxable, 966020, 1, "KE 1M: taxable = 966,020");
    assertEqual(result.marginalRate, 35, "KE 1M: marginal rate = 35%");
    assert(result.paye > 0, "KE 1M: PAYE is positive");
    assert(result.net > 0, "KE 1M: net is positive");
  }());

  (function () {
    const withoutDisability = engine.calculate(150000, { disability: false, personalRelief: true });
    const withDisability = engine.calculate(150000, { disability: true, personalRelief: true });

    assertEqual(withDisability.disabilityExempt, 150000, "KE disability: 150K exemption");
    assert(withDisability.paye < withoutDisability.paye, "KE disability: reduces PAYE");
    assertClose(
      withDisability.taxable,
      Math.max(0, withDisability.gross - withDisability.nssf - withDisability.shif - 150000),
      1,
      "KE disability: taxable reduced by 150K"
    );
  }());

  (function () {
    const gross = 100000;
    const options = { nssf: true, shif: true, personalRelief: true };
    const result = engine.calculate(gross, options);
    const reverse = engine.reverseCalc(result.net, options);
    assertClose(reverse, gross, 100, "KE reverse calc: round-trip within 100 KES");
  }());

  (function () {
    const result = engine.calculate(100000, { nssf: true, shif: true });
    assertClose(result.employerNSSF, 6000, 1, "KE 100K: employer NSSF = 6,000");
    assertClose(result.employerAHL, 1500, 1, "KE 100K: employer AHL = 1,500");
    assertClose(result.totalEmployerCost, 107500, 1, "KE 100K: total employer cost correct");
  }());

  assert(engine.validate(0).valid === false, "Validate: 0 is invalid");
  assert(engine.validate(-50).valid === false, "Validate: negative is invalid");
  assert(engine.validate(50000).valid === true, "Validate: 50K is valid");
};
