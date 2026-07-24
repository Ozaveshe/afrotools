(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.ghanaWht = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var REVIEWED_AT = '2026-07-22';
  var SOURCE_URL = 'https://gra.gov.gh/portfolio/withholding-tax/';
  var LAW_URL = 'https://gra.gov.gh/acts/';
  var ADMIN_URL = 'https://gra.gov.gh/wp-content/uploads/2023/01/Revenue-Administration-Act-2016-.pdf';
  var DTA_URL = 'https://gra.gov.gh/wp-content/uploads/2024/05/Practice-Note-on-obtaining-Double-Taxation-Relief-under-the-Income-Tax-Act-Act-896.pdf';
  var THRESHOLD = 2000;

  var RESIDENT = {
    dividends: { rate: 8, treatment: 'final', label: 'Dividends' },
    interest: { rate: 8, treatment: 'on-account', label: 'Interest' },
    'residential-rent': { rate: 8, treatment: 'verify-final', label: 'Residential-property rent' },
    'non-residential-rent': { rate: 15, treatment: 'verify-final', label: 'Non-residential-property rent' },
    royalties: { rate: 15, treatment: 'on-account', label: 'Royalties or natural-resource payments' },
    goods: { rate: 3, treatment: 'on-account', label: 'Supply of goods', threshold: true },
    works: { rate: 5, treatment: 'on-account', label: 'Supply of works', threshold: true },
    services: { rate: 7.5, treatment: 'on-account', label: 'General services', threshold: true },
    management: { unsupported: true, label: 'Management or technical services' },
    insurance: { unsupported: true, label: 'General insurance premium' }
  };

  var NON_RESIDENT = {
    dividends: { rate: 8, treatment: 'final', label: 'Dividends' },
    interest: { rate: 8, treatment: 'final', label: 'Interest' },
    'residential-rent': { rate: 15, treatment: 'final', label: 'Rent' },
    'non-residential-rent': { rate: 15, treatment: 'final', label: 'Rent' },
    royalties: { rate: 15, treatment: 'final', label: 'Royalties, natural-resource payments or rent' },
    goods: { rate: 20, treatment: 'final', label: 'Supply of goods' },
    works: { rate: 20, treatment: 'final', label: 'Supply of works' },
    services: { rate: 20, treatment: 'final', label: 'General services' },
    management: { rate: 20, treatment: 'final', label: 'Management or technical services' },
    insurance: { rate: 5, treatment: 'final', label: 'General insurance premium' }
  };

  function number(value, name) {
    var parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) throw new Error(name + ' must be zero or greater.');
    return parsed;
  }

  function round(value) { return Math.round((value + Number.EPSILON) * 100) / 100; }

  function remittanceDate(paymentDate) {
    if (!paymentDate) return null;
    var parsed = new Date(paymentDate + 'T00:00:00Z');
    if (Number.isNaN(parsed.getTime())) throw new Error('Payment date is invalid.');
    return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth() + 1, 15)).toISOString().slice(0, 10);
  }

  function baseResult(input, gross, ytd, rule) {
    return {
      status: 'calculated',
      residence: input.residence,
      recipientType: input.recipientType,
      category: input.category,
      categoryLabel: rule.label,
      grossAmount: gross,
      yearToDateBefore: ytd,
      annualContractTotal: round(gross + ytd),
      domesticRate: rule.rate,
      appliedRate: rule.rate,
      treatyReliefApplied: false,
      treatment: rule.treatment,
      remittanceDate: remittanceDate(input.paymentDate),
      sourceUrl: SOURCE_URL,
      reviewedAt: REVIEWED_AT,
      caveats: []
    };
  }

  function calculate(raw) {
    var input = raw || {};
    var gross = number(input.grossAmount, 'Gross amount');
    var ytd = number(input.yearToDateBefore || 0, 'Year-to-date amount');
    var residence = input.residence === 'non-resident' ? 'non-resident' : 'resident';
    var rules = residence === 'non-resident' ? NON_RESIDENT : RESIDENT;
    var rule = rules[input.category];
    if (!rule) throw new Error('Choose a supported payment category.');

    if (input.payerContext === 'individual-personal') {
      return {
        status: 'not-applicable',
        reason: 'Payments by an individual outside business activity are excluded from this planning workflow.',
        grossAmount: gross,
        appliedRate: 0,
        withheld: 0,
        netPayment: gross,
        sourceUrl: SOURCE_URL,
        reviewedAt: REVIEWED_AT
      };
    }

    if (residence === 'non-resident' && input.hasGhanaPe) {
      return {
        status: 'needs-classification',
        reason: 'Income connected to a Ghana permanent establishment is outside the simple final-WHT workflow.',
        grossAmount: gross,
        appliedRate: null,
        withheld: null,
        netPayment: null,
        sourceUrl: SOURCE_URL,
        reviewedAt: REVIEWED_AT
      };
    }

    if (rule.unsupported) {
      return {
        status: 'needs-classification',
        reason: 'The current GRA table does not publish a safe blanket resident rate for this category. Reclassify the payment or confirm it with GRA.',
        grossAmount: gross,
        appliedRate: null,
        withheld: null,
        netPayment: null,
        sourceUrl: SOURCE_URL,
        reviewedAt: REVIEWED_AT
      };
    }

    if (input.category === 'interest') {
      if (residence === 'resident' && (input.recipientType === 'individual' || input.recipientType === 'financial-institution')) {
        return {
          status: 'not-applicable',
          reason: 'The published 8% resident-interest row excludes individuals and resident financial institutions.',
          grossAmount: gross,
          appliedRate: 0,
          withheld: 0,
          netPayment: gross,
          sourceUrl: SOURCE_URL,
          reviewedAt: REVIEWED_AT
        };
      }
      if (residence === 'non-resident' && input.recipientType === 'individual') {
        return {
          status: 'needs-classification',
          reason: 'The current GRA table excludes individuals from its published non-resident 8% interest row.',
          grossAmount: gross,
          appliedRate: null,
          withheld: null,
          netPayment: null,
          sourceUrl: SOURCE_URL,
          reviewedAt: REVIEWED_AT
        };
      }
    }

    var result = baseResult({
      residence: residence,
      recipientType: input.recipientType || 'entity',
      category: input.category,
      paymentDate: input.paymentDate
    }, gross, ytd, rule);

    var thresholdApplies = residence === 'resident' && rule.threshold && !(input.category === 'services' && input.recipientType === 'individual');
    result.thresholdApplies = thresholdApplies;
    result.threshold = thresholdApplies ? THRESHOLD : null;
    result.thresholdMet = !thresholdApplies || result.annualContractTotal > THRESHOLD;

    if (thresholdApplies && !result.thresholdMet) {
      result.status = 'below-threshold';
      result.appliedRate = 0;
      result.withheld = 0;
      result.netPayment = gross;
      result.caveats.push('The annual cumulative amount does not exceed the GRA GHc 2,000 threshold for this resident supply category.');
      return result;
    }

    if (input.useApprovedTreatyRate) {
      var treatyRate = number(input.approvedTreatyRate, 'Approved treaty rate');
      if (treatyRate > 100) throw new Error('Approved treaty rate must not exceed 100%.');
      if (residence !== 'non-resident' || !input.beneficialOwner || !input.graApproval) {
        throw new Error('Treaty relief requires a non-resident beneficial owner and the Commissioner-General approval letter.');
      }
      result.appliedRate = treatyRate;
      result.treatyReliefApplied = true;
      result.caveats.push('User-confirmed GRA-approved treaty rate; keep the approval letter and supporting documents with the payment record.');
    }

    result.withheld = round(gross * result.appliedRate / 100);
    result.netPayment = round(gross - result.withheld);
    if (result.treatment === 'verify-final') result.caveats.push('Rent WHT may be final unless the income arises in a business of sale or letting; verify the actual facts.');
    if (residence === 'non-resident') result.caveats.push('Notify the Commissioner-General within 30 days for a non-resident goods, works or services contract where required.');
    return result;
  }

  return {
    calculate: calculate,
    remittanceDate: remittanceDate,
    residentRules: RESIDENT,
    nonResidentRules: NON_RESIDENT,
    threshold: THRESHOLD,
    metadata: {
      reviewedAt: REVIEWED_AT,
      sourceUrl: SOURCE_URL,
      lawUrl: LAW_URL,
      administrationUrl: ADMIN_URL,
      treatyPracticeNoteUrl: DTA_URL,
      currency: 'GHS'
    }
  };
});
