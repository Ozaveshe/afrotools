(function(root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) { root.AfroTools = root.AfroTools || {}; root.AfroTools.SOConsumptionTaxStatus = api; }
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  var CODE = 'NO_VERIFIED_NATIONAL_VAT';
  var status = Object.freeze({
    countryCode: 'SO',
    jurisdiction: 'Federal Government of Somalia',
    nationalVatVerified: false,
    calculable: false,
    code: CODE,
    currency: null,
    rate: null,
    reviewedOn: '2026-07-23',
    evidence: Object.freeze([
      Object.freeze({
        id: 'fgs-budget-policy-2026',
        date: '2025-11-15',
        scope: 'Federal budget policy for fiscal year 2026',
        finding: 'Named sector sales taxes and sales tax on imported goods are budgeted separately; the document does not establish a nationwide VAT rate.',
        liabilityRate: null,
        currency: null
      }),
      Object.freeze({
        id: 'fgs-turnover-tax-policy-2023',
        date: '2023-09-06',
        scope: 'Federal small-business turnover-tax policy',
        finding: 'The published table uses USD thresholds and a fixed or percentage turnover charge. Current 2026 applicability and liability are not established by the evidence reviewed.',
        liabilityRate: null,
        currency: 'USD',
        historicalTable: Object.freeze([
          Object.freeze({ annualTurnoverUsd: '10,000 or less', publishedCharge: 'USD 150 fixed' }),
          Object.freeze({ annualTurnoverUsd: '10,001 to 50,000', publishedCharge: '1.5% of gross turnover' })
        ])
      })
    ])
  });
  function getStatus() { return status; }
  function calculate() {
    var error = new RangeError('A current nationwide Somalia VAT rate is not verified from federal primary sources; calculation is disabled.');
    error.code = CODE;
    throw error;
  }
  return {
    CODE: CODE,
    REVIEWED_ON: status.reviewedOn,
    getStatus: getStatus,
    calculate: calculate,
    formulaParameters: {
      rate: null,
      currency: null,
      supportStatus: 'fail-closed-evidence-reference',
      exclusions: 'No nationwide VAT rate, sector sales-tax rate, turnover-tax liability, filing, registration, exemption or currency is inferred.'
    }
  };
});
