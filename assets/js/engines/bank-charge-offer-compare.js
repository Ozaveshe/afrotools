(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) { root.AfroTools = root.AfroTools || {}; root.AfroTools.BankChargeOfferCompare = api; }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  function number(value) { var parsed = Number(value); return Number.isFinite(parsed) ? parsed : NaN; }
  function recentDate(value, now) { if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false; var checked = new Date(value + 'T00:00:00Z'); var reference = now ? new Date(now) : new Date(); var age = Math.floor((reference.getTime() - checked.getTime()) / 86400000); return Number.isFinite(checked.getTime()) && age >= 0 && age <= 365; }
  function provider(input, suffix, activity, now) {
    var name = String(input['name' + suffix] || '').trim();
    var evidenceLabel = String(input['evidenceLabel' + suffix] || '').trim();
    var evidenceDate = String(input['evidenceDate' + suffix] || '');
    var monthlyAccountFee = number(input['monthlyAccountFee' + suffix] || 0);
    var transferFee = number(input['transferFee' + suffix] || 0);
    var atmFee = number(input['atmFee' + suffix] || 0);
    var messageFee = number(input['messageFee' + suffix] || 0);
    var annualCardFee = number(input['annualCardFee' + suffix] || 0);
    var internationalFeePct = number(input['internationalFeePct' + suffix] || 0);
    var otherMonthlyFee = number(input['otherMonthlyFee' + suffix] || 0);
    var amounts = [monthlyAccountFee, transferFee, atmFee, messageFee, annualCardFee, otherMonthlyFee];
    if (!name || name.length > 80) return { ok: false, error: 'invalid_provider' };
    if (amounts.some(function (value) { return !Number.isFinite(value) || value < 0 || value > 1e15; }) || !Number.isFinite(internationalFeePct) || internationalFeePct < 0 || internationalFeePct > 100) return { ok: false, error: 'invalid_fee' };
    if (!evidenceLabel || evidenceLabel.length > 160 || !recentDate(evidenceDate, now)) return { ok: false, error: 'invalid_evidence' };
    var components = {
      account: monthlyAccountFee,
      transfers: transferFee * activity.transfers,
      withdrawals: atmFee * activity.atmWithdrawals,
      messages: messageFee * activity.messages,
      card: annualCardFee / 12,
      international: internationalFeePct / 100 * activity.internationalSpend,
      other: otherMonthlyFee
    };
    var monthlyTotal = Object.keys(components).reduce(function (sum, key) { return sum + components[key]; }, 0);
    return { ok: true, name: name, evidenceLabel: evidenceLabel, evidenceDate: evidenceDate, monthlyAccountFee: monthlyAccountFee, transferFee: transferFee, atmFee: atmFee, messageFee: messageFee, annualCardFee: annualCardFee, internationalFeePct: internationalFeePct, otherMonthlyFee: otherMonthlyFee, components: components, monthlyTotal: monthlyTotal, annualTotal: monthlyTotal * 12 };
  }
  function calculate(input, now) {
    input = input || {};
    var currency = String(input.currency || '').trim().toUpperCase();
    var comparisonLabel = String(input.comparisonLabel || '').trim();
    var activity = { transfers: number(input.transfers), atmWithdrawals: number(input.atmWithdrawals), messages: number(input.messages), internationalSpend: number(input.internationalSpend) };
    if (!/^[A-Z]{3,8}$/.test(currency) || !comparisonLabel || comparisonLabel.length > 100) return { ok: false, error: 'invalid_context' };
    if (![activity.transfers, activity.atmWithdrawals, activity.messages].every(function (value) { return Number.isInteger(value) && value >= 0 && value <= 100000; }) || !Number.isFinite(activity.internationalSpend) || activity.internationalSpend < 0 || activity.internationalSpend > 1e15) return { ok: false, error: 'invalid_activity' };
    var offerA = provider(input, 'A', activity, now); if (!offerA.ok) return offerA;
    var offerB = provider(input, 'B', activity, now); if (!offerB.ok) return offerB;
    var rawDifference = offerA.monthlyTotal - offerB.monthlyTotal;
    var lower = Math.abs(rawDifference) < 0.005 ? 'equal' : rawDifference < 0 ? 'A' : 'B';
    return { ok: true, currency: currency, comparisonLabel: comparisonLabel, activity: activity, offerA: offerA, offerB: offerB, monthlyDifference: Math.abs(rawDifference), annualDifference: Math.abs(rawDifference) * 12, lowerModeledCost: lower };
  }
  return Object.freeze({ recentDate: recentDate, calculate: calculate });
});
