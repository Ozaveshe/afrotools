(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.SideIncomeTaxReserve = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  function number(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function recentDate(value, now) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
    var checked = new Date(value + 'T00:00:00Z');
    var reference = now ? new Date(now) : new Date();
    var ageDays = Math.floor((reference.getTime() - checked.getTime()) / 86400000);
    return Number.isFinite(checked.getTime()) && ageDays >= 0 && ageDays <= 365;
  }

  function calculate(input, now) {
    input = input || {};
    var currency = String(input.currency || '').trim().toUpperCase();
    var jurisdiction = String(input.jurisdiction || '').trim();
    var taxPeriod = String(input.taxPeriod || '').trim();
    var evidenceLabel = String(input.evidenceLabel || '').trim();
    var evidenceDate = String(input.evidenceDate || '');
    var grossRevenue = number(input.grossRevenue);
    var refunds = number(input.refunds || 0);
    var platformFees = number(input.platformFees || 0);
    var otherExpenses = number(input.otherExpenses || 0);
    var taxCredits = number(input.taxCredits || 0);
    var reserveRatePct = number(input.reserveRatePct);
    var instalments = number(input.instalments);
    var money = [grossRevenue, refunds, platformFees, otherExpenses, taxCredits];

    if (!/^[A-Z]{3,8}$/.test(currency) || !jurisdiction || jurisdiction.length > 80 || !taxPeriod || taxPeriod.length > 80) {
      return { ok: false, error: 'invalid_context' };
    }
    if (money.some(function (value) { return !Number.isFinite(value) || value < 0 || value > 1e15; })) {
      return { ok: false, error: 'invalid_amount' };
    }
    if (refunds > grossRevenue || platformFees + otherExpenses > grossRevenue - refunds) {
      return { ok: false, error: 'invalid_costs' };
    }
    if (!Number.isFinite(reserveRatePct) || reserveRatePct < 0 || reserveRatePct > 100 || !Number.isInteger(instalments) || instalments < 1 || instalments > 12) {
      return { ok: false, error: 'invalid_assumption' };
    }
    if (!evidenceLabel || evidenceLabel.length > 160 || !recentDate(evidenceDate, now)) {
      return { ok: false, error: 'invalid_evidence' };
    }

    var cashAfterCosts = grossRevenue - refunds - platformFees - otherExpenses;
    var planningProfit = Math.max(0, cashAfterCosts);
    var reserveBeforeCredits = planningProfit * reserveRatePct / 100;
    var reserveAfterCredits = Math.max(0, reserveBeforeCredits - taxCredits);
    var creditExcess = Math.max(0, taxCredits - reserveBeforeCredits);
    var totalCosts = refunds + platformFees + otherExpenses;

    return {
      ok: true,
      currency: currency,
      jurisdiction: jurisdiction,
      taxPeriod: taxPeriod,
      grossRevenue: grossRevenue,
      refunds: refunds,
      platformFees: platformFees,
      otherExpenses: otherExpenses,
      taxCredits: taxCredits,
      reserveRatePct: reserveRatePct,
      instalments: instalments,
      evidenceLabel: evidenceLabel,
      evidenceDate: evidenceDate,
      totalCosts: totalCosts,
      planningProfit: planningProfit,
      reserveBeforeCredits: reserveBeforeCredits,
      reserveAfterCredits: reserveAfterCredits,
      creditExcess: creditExcess,
      cashAfterCosts: cashAfterCosts,
      cashAfterReserve: cashAfterCosts - reserveAfterCredits,
      reservePerInstalment: reserveAfterCredits / instalments,
      expenseRatioPct: grossRevenue ? totalCosts / grossRevenue * 100 : 0,
      reserveGrossRatePct: grossRevenue ? reserveAfterCredits / grossRevenue * 100 : 0
    };
  }

  return Object.freeze({ recentDate: recentDate, calculate: calculate });
});
