(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.AfroTools = root.AfroTools || {}; root.AfroTools.NigeriaFarmContributions = api; }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  // These are user-confirmed scheme selections, not an eligibility determination.
  // Pension employer-only payment and unverified schemes are intentionally unresolved.
  var rules = {
    pension: { standard: { employee: 800, employer: 1000, basis: 'pensionablePay', source: 'pencom-faq-2023' } },
    health: {
      basic: { employee: 500, employer: 1000, basis: 'healthBasicPay', source: 'nhia-faq' },
      consolidated: { employee: 175, employer: 325, basis: 'healthConsolidatedPay', source: 'nhia-faq' }
    },
    housing: { participating: { employee: 250, employer: 0, basis: 'housingMonthlyIncome', source: 'bfa-gazette-2023' } }
  };
  var excluded = { pension: 'not-applicable', health: 'not-applicable', housing: 'not-participating' };
  var max = BigInt(Number.MAX_SAFE_INTEGER);
  function cents(raw) {
    if (typeof raw !== 'string' && typeof raw !== 'number') return null;
    var value = String(raw).trim();
    if (!/^\d+(?:\.\d{1,2})?$/.test(value) || value.length > 20) return null;
    var parts = value.split('.');
    var amount = BigInt(parts[0]) * 100n + BigInt(((parts[1] || '') + '00').slice(0, 2));
    return amount > 0n && amount <= max ? amount : null;
  }
  function failure(field, code) { return { valid: false, field: field, code: code }; }
  function calculate(input) {
    if (!input || typeof input !== 'object') return failure('contributions', 'selection-required');
    if (input.sector !== 'private') return failure('sector', 'private-sector-required');
    var rows = [], employeeTotal = 0n, employerTotal = 0n;
    var selections = {};
    for (var name of ['pension', 'health', 'housing']) {
      var selection = input[name];
      selections[name] = selection;
      if (selection === excluded[name]) continue;
      if (!Object.prototype.hasOwnProperty.call(rules[name], selection)) return failure(name, 'selection-required');
      var rule = rules[name][selection], base = cents(input[rule.basis]);
      if (base === null) return failure(rule.basis, 'positive-money-required');
      // Round each contribution to the nearest kobo without floating-point products.
      var employee = (base * BigInt(rule.employee) + 5000n) / 10000n;
      var employer = (base * BigInt(rule.employer) + 5000n) / 10000n;
      employeeTotal += employee; employerTotal += employer;
      if (employeeTotal > max || employerTotal > max) return failure('contributions', 'total-too-large');
      rows.push({ scheme: name, selection: selection, basisField: rule.basis, basisKobo: Number(base),
        employeeRatePercent: rule.employee / 100, employerRatePercent: rule.employer / 100,
        employeeKobo: Number(employee), employerKobo: Number(employer), sourceId: rule.source });
    }
    return { valid: true, country: 'NG', sector: 'private', selections: selections, rows: rows,
      employeeKobo: Number(employeeTotal), employerKobo: Number(employerTotal),
      eligibility: 'user-confirmed', currentLawVerified: false };
  }
  function compareWage(input) {
    var reference = { amount: 70000, currency: 'NGN', period: 'month', effectiveFrom: '2024-07-29',
      sourceId: 'ng-national-minimum-wage-amendment-2024', coverageSourceId: 'ng-national-minimum-wage-2019-section-4' };
    var coverage = input && input.coverage;
    if (!coverage || coverage === 'unknown') return { valid: true, status: 'coverage-unknown', reference: reference };
    if (coverage === 'exempt-confirmed') return { valid: true, status: 'exempt-confirmed', reference: reference, eligibility: 'user-confirmed' };
    if (coverage !== 'applicable-confirmed') return failure('wageCoverage', 'coverage-required');
    var base = cents(input.monthlyWage);
    if (base === null) return failure('monthlyWage', 'positive-money-required');
    var difference = base - 7000000n;
    return { valid: true, status: difference < 0n ? 'below-reference' : 'meets-reference', reference: reference,
      comparedWageKobo: Number(base), differenceKobo: Number(difference), eligibility: 'user-confirmed' };
  }
  return { calculate: calculate, compareWage: compareWage };
});
