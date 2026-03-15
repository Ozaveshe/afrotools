/**
 * Egypt PAYE Engine Tests
 * Annual input, bracket exclusion (tiering) system.
 */
module.exports = function (engine, assert, assertEqual, assertClose) {

  // ── Below personal exemption (20,000) ──────────────
  (function () {
    // With NOSI: gross 20000, NOSI = min(20000, 174000)*11% = 2200
    // NATI = max(0, 20000 - 20000 - 2200) = 0
    const r = engine.calculate(20000, { nosi: true });
    assertClose(r.tax, 0, 1, 'EG 20K: at personal exemption -> 0 tax');
    assertClose(r.nati, 0, 1, 'EG 20K: NATI = 0');
  })();

  (function () {
    const r = engine.calculate(15000, { nosi: false });
    // NATI = max(0, 15000 - 20000) = 0
    assertClose(r.nati, 0, 1, 'EG 15K (no NOSI): NATI = 0');
    assertClose(r.tax, 0, 1, 'EG 15K (no NOSI): 0 tax');
  })();

  // ── EGP 200,000 → verify bands ────────────────────
  (function () {
    const r = engine.calculate(200000, { nosi: true });

    // NOSI = min(200000, 174000) * 11% = 19,140
    assertClose(r.nosi, 19140, 1, 'EG 200K: NOSI = 19,140');

    // NATI = 200000 - 20000 - 19140 = 160,860
    assertClose(r.nati, 160860, 1, 'EG 200K: NATI = 160,860');

    // Tax on 160,860 (no exclusion since NATI <= 600,000):
    //   40,000 * 0%   = 0
    //   15,000 * 10%  = 1,500
    //   15,000 * 15%  = 2,250
    //   remaining 90,860 * 20% = 18,172
    // Total = 21,922
    assertClose(r.standardTax, 21922, 1, 'EG 200K: standard tax = 21,922');
    assertClose(r.exclusionExtra, 0, 1, 'EG 200K: no exclusion extra');
    assertClose(r.tax, 21922, 1, 'EG 200K: total tax = 21,922');
  })();

  // ── EGP 800,000 → bracket exclusion kicks in ──────
  (function () {
    const r = engine.calculate(800000, { nosi: true });

    // NOSI = 174000 * 11% = 19,140 (capped)
    assertClose(r.nosi, 19140, 1, 'EG 800K: NOSI capped at 19,140');

    // NATI = 800000 - 20000 - 19140 = 760,860
    assertClose(r.nati, 760860, 1, 'EG 800K: NATI = 760,860');

    // NATI > 600,000 → band 0 excluded (extraTax from threshold 600k = 0)
    // NATI > 700,000 → band 1 excluded (extraTax 1500)
    // NATI <= 800,000 → band 2 NOT excluded
    assertClose(r.exclusionExtra, 0 + 1500, 1, 'EG 800K: exclusion extra = 1,500');
    assert(r.excludedBands.length === 2, 'EG 800K: 2 bands excluded');
    assert(r.tax > r.standardTax, 'EG 800K: total tax > standard tax');
  })();

  // ── EGP 1,500,000 → all exclusion rules ───────────
  (function () {
    const r = engine.calculate(1500000, { nosi: true });

    // NOSI = 174000 * 11% = 19,140
    assertClose(r.nosi, 19140, 1, 'EG 1.5M: NOSI = 19,140');

    // NATI = 1500000 - 20000 - 19140 = 1,460,860
    assertClose(r.nati, 1460860, 1, 'EG 1.5M: NATI = 1,460,860');

    // All exclusion thresholds exceeded (600k, 700k, 800k, 900k, 1M, 1.2M)
    // Extra = 0 + 1500 + 2250 + 26000 + 45000 + 200000 = 274,750
    assertClose(r.exclusionExtra, 274750, 1, 'EG 1.5M: exclusion extra = 274,750');
    assertEqual(r.excludedBands.length, 6, 'EG 1.5M: all 6 bands excluded');

    // Marginal rate should be 27.5% (top band)
    assertClose(r.marginalRate, 27.5, 0.01, 'EG 1.5M: marginal rate = 27.5%');
  })();

  // ── NOSI cap test (14,500/month = 174,000/year) ───
  (function () {
    const below = engine.calculate(150000, { nosi: true });
    const atCap = engine.calculate(174000, { nosi: true });
    const above = engine.calculate(300000, { nosi: true });

    assertClose(below.nosi, 150000 * 0.11, 1, 'EG NOSI: below cap -> 11% of gross');
    assertClose(atCap.nosi, 174000 * 0.11, 1, 'EG NOSI: at cap -> 11% of 174K');
    assertClose(above.nosi, 174000 * 0.11, 1, 'EG NOSI: above cap -> still 11% of 174K');
    assertClose(above.nosiBase, 174000, 1, 'EG NOSI: nosiBase capped at 174K');
  })();

  // ── NOSI disabled ──────────────────────────────────
  (function () {
    const withNOSI = engine.calculate(500000, { nosi: true });
    const noNOSI   = engine.calculate(500000, { nosi: false });

    assertClose(noNOSI.nosi, 0, 1, 'EG no NOSI: nosi = 0');
    assert(noNOSI.nati > withNOSI.nati, 'EG no NOSI: higher NATI without NOSI');
    assert(noNOSI.tax > withNOSI.tax, 'EG no NOSI: higher tax without NOSI');
  })();

  // ── Disabled personal exemption ────────────────────
  (function () {
    const normal   = engine.calculate(300000, { nosi: true, disabled: false });
    const disabled = engine.calculate(300000, { nosi: true, disabled: true });

    assertEqual(normal.personalExemption, 20000, 'EG normal: personal exemption = 20,000');
    assertEqual(disabled.personalExemption, 30000, 'EG disabled: personal exemption = 30,000');
    assert(disabled.nati < normal.nati, 'EG disabled: lower NATI');
    assert(disabled.tax < normal.tax, 'EG disabled: lower tax');
  })();

  // ── Employer NOSI ──────────────────────────────────
  (function () {
    const r = engine.calculate(300000, { nosi: true });
    // Employer NOSI = min(300000, 174000) * 18.75% = 174000 * 0.1875 = 32,625
    assertClose(r.employerNOSI, 32625, 1, 'EG employer NOSI = 32,625');
  })();

  // ── Reverse calc round-trip ────────────────────────
  (function () {
    const originalGross = 500000;
    const opts = { nosi: true };
    const result = engine.calculate(originalGross, opts);
    const reverseGross = engine.reverseCalc(result.netAnnual, opts);
    assertClose(reverseGross, originalGross, 100, 'EG reverse calc: round-trip within 100 EGP');
  })();

  // ── Zero salary ────────────────────────────────────
  (function () {
    const r = engine.calculate(0, { nosi: true });
    assertClose(r.tax, 0, 1, 'EG 0: zero salary -> 0 tax');
    assertClose(r.nosi, 0, 1, 'EG 0: zero salary -> 0 NOSI');
  })();

  // ── Validation ─────────────────────────────────────
  (function () {
    assert(engine.validate(0).valid === false, 'Validate: 0 is invalid');
    assert(engine.validate(-100).valid === false, 'Validate: negative is invalid');
    assert(engine.validate(300000).valid === true, 'Validate: 300K is valid');
  })();
};
