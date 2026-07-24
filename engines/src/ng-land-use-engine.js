(function (root) {
  'use strict';
  var RULES = Object.freeze({
    scheme: 'Lagos State Land Use Charge Law 2020',
    effectiveFrom: '2020-05-25',
    verifiedThrough: '2026-07-23',
    maximumChargeRatePct: 3.5,
    source: 'Lagos State Land Use Charge Law 2020 and Annual Charge Rates Notice 2020'
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
  function nonNegative(value, maximum) {
    return Number.isFinite(value) && value >= 0 && value <= maximum;
  }

  function calculate(raw) {
    raw = raw || {};
    var assessmentDate = String(raw.assessmentDate || '');
    var mode = String(raw.mode || 'assessed');
    var chargeRatePct = number(raw.chargeRatePct);
    var discountRatePct = number(raw.discountRatePct);
    if (discountRatePct === null) discountRatePct = 0;

    if (!validDate(assessmentDate)) return { ok: false, error: 'unsupported_date' };
    if (mode !== 'assessed' && mode !== 'components') return { ok: false, error: 'invalid_mode' };
    if (!nonNegative(chargeRatePct, RULES.maximumChargeRatePct)) {
      return { ok: false, error: 'invalid_charge_rate' };
    }
    if (!nonNegative(discountRatePct, 100)) return { ok: false, error: 'invalid_discount' };

    var assessedValue;
    var components = null;
    if (mode === 'assessed') {
      assessedValue = number(raw.assessedValue);
      if (!Number.isFinite(assessedValue) || assessedValue <= 0 || assessedValue > 1e15) {
        return { ok: false, error: 'invalid_assessed_value' };
      }
    } else {
      var landArea = number(raw.landArea);
      var landRate = number(raw.landRate);
      var buildingArea = number(raw.buildingArea);
      var buildingRate = number(raw.buildingRate);
      var depreciationPct = number(raw.depreciationPct);
      var reliefFactorPct = number(raw.reliefFactorPct);
      if (!nonNegative(landArea, 1e9) || !nonNegative(landRate, 1e12)) {
        return { ok: false, error: 'invalid_land_component' };
      }
      if (!nonNegative(buildingArea, 1e9) || !nonNegative(buildingRate, 1e12)) {
        return { ok: false, error: 'invalid_building_component' };
      }
      if (!nonNegative(depreciationPct, 100) || !nonNegative(reliefFactorPct, 100)) {
        return { ok: false, error: 'invalid_factors' };
      }
      var landComponent = landArea * landRate;
      var buildingComponent = buildingArea * buildingRate * (depreciationPct / 100);
      var valueBeforeRelief = landComponent + buildingComponent;
      assessedValue = valueBeforeRelief * (reliefFactorPct / 100);
      if (!Number.isFinite(assessedValue) || assessedValue <= 0 || assessedValue > 1e15) {
        return { ok: false, error: 'invalid_components_total' };
      }
      components = {
        landArea: landArea,
        landRate: landRate,
        landComponent: money(landComponent),
        buildingArea: buildingArea,
        buildingRate: buildingRate,
        depreciationFactor: depreciationPct / 100,
        buildingComponent: money(buildingComponent),
        reliefFactor: reliefFactorPct / 100,
        valueBeforeRelief: money(valueBeforeRelief)
      };
    }

    var grossCharge = assessedValue * (chargeRatePct / 100);
    var discountAmount = grossCharge * (discountRatePct / 100);
    var payable = grossCharge - discountAmount;
    return {
      ok: true,
      scheme: RULES.scheme,
      assessmentDate: assessmentDate,
      mode: mode,
      assessedValue: money(assessedValue),
      chargeRate: chargeRatePct / 100,
      grossCharge: money(grossCharge),
      discountRate: discountRatePct / 100,
      discountAmount: money(discountAmount),
      payable: money(payable),
      monthlyPlanningEquivalent: money(payable / 12),
      components: components,
      boundary: 'Lagos planning calculation only. Every valuation input, relief factor, annual charge rate and discount must come from the current official assessment or demand notice. This result does not determine classification, exemptions, penalties, arrears, enforcement, appeal rights or the official amount due.'
    };
  }

  var api = { RULES: RULES, calculate: calculate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.NG_LAND_USE = api;
})(typeof window !== 'undefined' ? window : globalThis);
