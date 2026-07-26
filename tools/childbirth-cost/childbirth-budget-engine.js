(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.childbirthBudgetEngine = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var ITEMS = [
    { id: 'plannedCare', label: 'Provider planned care quote' },
    { id: 'professionalFees', label: 'Separate professional, theatre or anaesthesia fees' },
    { id: 'medicinesSupplies', label: 'Medicines, blood or supplies' },
    { id: 'testsCare', label: 'Tests, newborn or postnatal care' },
    { id: 'transportStay', label: 'Transport, accommodation or support' },
    { id: 'contingency', label: 'Household contingency' }
  ];
  var SOURCES = {
    'written-provider': 'Written provider quote',
    'written-payer': 'Written insurer or payer confirmation',
    'verbal-provider': 'Verbal provider estimate to verify in writing',
    'household-assumption': 'Household planning assumptions, not provider-confirmed'
  };

  function parseAmount(value, label) {
    var text = String(value === undefined || value === null ? '' : value).trim();
    if (!/^\d+(?:\.\d{1,2})?$/.test(text)) {
      return { valid: false, error: label + ' must be zero or a positive amount with no more than 2 decimal places.' };
    }
    var amount = Number(text);
    if (!Number.isFinite(amount) || amount > 1000000000) {
      return { valid: false, error: label + ' must not exceed 1,000,000,000.' };
    }
    return { valid: true, cents: Math.round(amount * 100) };
  }

  function dateOnly(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
    var date = new Date(value + 'T00:00:00Z');
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function calculate(input) {
    input = input || {};
    var currency = String(input.currency || '').trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) {
      return { valid: false, error: 'Enter a 3-letter currency code.' };
    }
    if (!Object.prototype.hasOwnProperty.call(SOURCES, input.sourceType)) {
      return { valid: false, error: 'Choose a supported figure source.' };
    }
    var quoteDate = dateOnly(input.quoteDate);
    var asOf = dateOnly(input.asOf);
    if (!quoteDate || !asOf) return { valid: false, error: 'Enter a valid quote date.' };
    if (quoteDate.getTime() > asOf.getTime()) return { valid: false, error: 'The quote date cannot be in the future.' };

    var lineItems = [];
    var grossCents = 0;
    for (var index = 0; index < ITEMS.length; index += 1) {
      var definition = ITEMS[index];
      var parsed = parseAmount(input[definition.id], definition.label);
      if (!parsed.valid) return parsed;
      grossCents += parsed.cents;
      if (parsed.cents > 0) lineItems.push({ id: definition.id, label: definition.label, cents: parsed.cents });
    }
    if (grossCents === 0) return { valid: false, error: 'Enter at least one cost amount greater than zero.' };

    var contribution = parseAmount(input.confirmedContribution, 'Confirmed payer contribution');
    if (!contribution.valid) return contribution;
    if (contribution.cents > grossCents) {
      return { valid: false, error: 'Confirmed payer contribution cannot exceed the entered cost total.' };
    }
    var ageDays = Math.floor((asOf.getTime() - quoteDate.getTime()) / 86400000);
    var freshness = ageDays <= 30 ? 'recent' : ageDays <= 90 ? 'review-soon' : 'refresh-required';
    return {
      valid: true,
      currency: currency,
      quoteDate: input.quoteDate,
      ageDays: ageDays,
      freshness: freshness,
      sourceType: input.sourceType,
      sourceLabel: SOURCES[input.sourceType],
      lineItems: lineItems,
      grossCents: grossCents,
      contributionCents: contribution.cents,
      householdCents: grossCents - contribution.cents,
      boundary: 'Every amount was user-entered. This is arithmetic, not a provider quote, coverage guarantee or care recommendation.'
    };
  }

  return {
    ITEMS: ITEMS,
    SOURCES: SOURCES,
    calculate: calculate
  };
});
