(function (root) {
  'use strict';

  var RULES = Object.freeze({
    scheme: 'Kenya Stamp Duty Act (Cap. 480)',
    effectiveFrom: '2025-07-01',
    verifiedThrough: '2026-07-23',
    source: 'Kenya Law consolidated Stamp Duty Act, Schedule items 11, 12A and Lease; sections 6, 10A, 52, 55-58',
    municipalityRatePerThousand: 40,
    otherAreaRatePerThousand: 20
  });

  function number(value) {
    if (value === '' || value === null || typeof value === 'undefined') return null;
    return Number(value);
  }

  function money(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  function validDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      value >= RULES.effectiveFrom &&
      value <= RULES.verifiedThrough;
  }

  function positive(value, maximum) {
    return Number.isFinite(value) && value > 0 && value <= maximum;
  }

  function nonNegative(value, maximum) {
    return Number.isFinite(value) && value >= 0 && value <= maximum;
  }

  function conveyanceDuty(value, location) {
    var halfStep = location === 'municipality' ? 20 : 10;
    var thousandStep = location === 'municipality' ?
      RULES.municipalityRatePerThousand :
      RULES.otherAreaRatePerThousand;
    if (value <= 2000) return Math.ceil(value / 500) * halfStep;
    return (4 * halfStep) + (Math.ceil((value - 2000) / 1000) * thousandStep);
  }

  function leaseRentDuty(annualRent, termType, termYears) {
    if (termType === 'indefinite' || termYears > 3) {
      if (annualRent <= 2000) return Math.ceil(annualRent / 500) * 10;
      return Math.ceil(annualRent / 1000) * 20;
    }
    if (termYears > 1) {
      if (annualRent <= 2000) return Math.ceil(annualRent / 500) * 5;
      return Math.ceil(annualRent / 1000) * 10;
    }
    var totalRent = annualRent * termYears;
    if (totalRent <= 2000) return 20;
    return 20 + (Math.ceil((totalRent - 2000) / 1000) * 10);
  }

  function calculate(raw) {
    raw = raw || {};
    var instrumentDate = String(raw.instrumentDate || '');
    var mode = String(raw.mode || 'transfer');
    var location = String(raw.location || '');

    if (!validDate(instrumentDate)) return { ok: false, error: 'unsupported_date' };
    if (mode !== 'transfer' && mode !== 'lease') return { ok: false, error: 'invalid_mode' };
    if (location !== 'municipality' && location !== 'other') {
      return { ok: false, error: 'invalid_location' };
    }

    if (mode === 'transfer') {
      var transactionType = String(raw.transactionType || 'sale');
      var consideration = number(raw.consideration);
      var marketValue = number(raw.marketValue);
      if (transactionType !== 'sale' && transactionType !== 'gift') {
        return { ok: false, error: 'invalid_transaction_type' };
      }
      if (!nonNegative(consideration, 1e15) || !positive(marketValue, 1e15)) {
        return { ok: false, error: 'invalid_transfer_values' };
      }
      var dutiableValue = transactionType === 'gift' ?
        marketValue :
        Math.max(consideration, marketValue);
      if (!positive(dutiableValue, 1e15)) return { ok: false, error: 'invalid_transfer_values' };
      var duty = conveyanceDuty(dutiableValue, location);
      return {
        ok: true,
        scheme: RULES.scheme,
        instrumentDate: instrumentDate,
        mode: mode,
        transactionType: transactionType,
        location: location,
        consideration: money(consideration),
        marketValue: money(marketValue),
        dutiableValue: money(dutiableValue),
        transferDuty: money(duty),
        rentDuty: 0,
        premiumDuty: 0,
        payable: money(duty),
        rateLabel: location === 'municipality' ?
          'Schedule item 12A: KSh 40 per KSh 1,000 after the initial bands' :
          'Schedule item 11: KSh 20 per KSh 1,000 after the initial bands',
        boundary: 'Planning estimate for an ordinary immovable-property transfer. KRA valuation, instrument classification, Gazette boundaries and any evidenced exemption override this result.'
      };
    }

    var termType = String(raw.termType || 'definite');
    var termYears = number(raw.termYears);
    var annualRent = number(raw.annualRent);
    var premium = number(raw.premium);
    if (termType !== 'definite' && termType !== 'indefinite') {
      return { ok: false, error: 'invalid_term_type' };
    }
    if (!positive(annualRent, 1e15) || !nonNegative(premium, 1e15)) {
      return { ok: false, error: 'invalid_lease_values' };
    }
    if (termType === 'definite' && !positive(termYears, 999)) {
      return { ok: false, error: 'invalid_term' };
    }
    if (termType === 'indefinite') termYears = null;
    var rentDuty = leaseRentDuty(annualRent, termType, termYears);
    var premiumDuty = premium > 0 ? conveyanceDuty(premium, location) : 0;
    var payable = rentDuty + premiumDuty;
    return {
      ok: true,
      scheme: RULES.scheme,
      instrumentDate: instrumentDate,
      mode: mode,
      location: location,
      termType: termType,
      termYears: termYears,
      annualRent: money(annualRent),
      premium: money(premium),
      dutiableValue: money(premium),
      transferDuty: 0,
      rentDuty: money(rentDuty),
      premiumDuty: money(premiumDuty),
      payable: money(payable),
      rateLabel: termType === 'indefinite' || termYears > 3 ?
        'Lease Schedule band: other definite or indefinite term' :
        termYears > 1 ?
          'Lease Schedule band: over one year and not over three years' :
          'Lease Schedule band: term not over one year',
      boundary: 'Planning estimate for rent and any premium stated in the lease instrument. KRA assessment, instrument terms, valuation, exemptions and penalties override this result.'
    };
  }

  var api = {
    RULES: RULES,
    calculate: calculate,
    conveyanceDuty: conveyanceDuty,
    leaseRentDuty: leaseRentDuty
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.KE_STAMP_DUTY = api;
})(typeof window !== 'undefined' ? window : globalThis);
