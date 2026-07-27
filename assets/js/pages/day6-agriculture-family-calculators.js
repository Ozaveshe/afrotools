(function () {
  'use strict';

  var calculators = {
    'crop-yield-estimator': function (values) {
      var gross = values.areaHa * values.yieldPerHa;
      var marketable = gross * (1 - values.lossPct / 100);
      return 'Estimate: ' + marketable.toFixed(2) + ' tonnes marketable yield from '
        + values.areaHa.toFixed(2) + ' ha (' + gross.toFixed(2)
        + ' tonnes before ' + values.lossPct.toFixed(1)
        + '% field and post-harvest loss). Verify crop, variety, weather and field records.';
    },
    'fertilizer-calculator': function (values) {
      var kg = values.areaHa * values.rateKgHa;
      var bags = Math.ceil(kg / values.bagKg);
      var cost = bags * values.bagPrice;
      return 'Estimate: ' + kg.toFixed(1) + ' kg, rounded up to ' + bags + ' bags of '
        + values.bagKg.toFixed(0) + ' kg; purchase budget ' + money(values.currency, cost)
        + '. A soil test and local agronomist recommendation should set the application rate.';
    },
    'irrigation-calculator': function (values) {
      var netM3 = values.areaHa * values.depthMm * 10 * values.cycles;
      var grossM3 = netM3 / (values.efficiencyPct / 100);
      return 'Estimate: ' + number(grossM3, 1) + ' m3 gross water for ' + values.cycles
        + ' irrigation cycle(s); crop-zone need is ' + number(netM3, 1)
        + ' m3 before system loss. Confirm soil moisture, rainfall and abstraction limits.';
    },
    'farm-profit-calculator': function (values) {
      var revenue = values.harvestKg * values.pricePerKg;
      var costs = values.variableCosts + values.fixedCosts;
      var profit = revenue - costs;
      var margin = revenue > 0 ? profit / revenue * 100 : 0;
      return 'Estimate: revenue ' + money(values.currency, revenue) + '; total costs '
        + money(values.currency, costs) + '; profit/loss ' + money(values.currency, profit)
        + '; margin ' + margin.toFixed(1) + '%. Replace every assumption with farm records and buyer quotes.';
    },
    'seed-rate-calculator': function (values) {
      var baseKg = values.areaHa * values.rateKgHa;
      var adjustedKg = baseKg / (values.germinationPct / 100) * (1 + values.reservePct / 100);
      return 'Estimate: ' + adjustedKg.toFixed(1) + ' kg seed to procure (base '
        + baseKg.toFixed(1) + ' kg, adjusted for ' + values.germinationPct.toFixed(1)
        + '% germination and ' + values.reservePct.toFixed(1)
        + '% reserve). Confirm label germination, spacing and extension guidance.';
    },
    'fish-farming-roi': function (values) {
      var harvestFish = values.stock * values.survivalPct / 100;
      var harvestKg = harvestFish * values.harvestWeightKg;
      var revenue = harvestKg * values.pricePerKg;
      var profit = revenue - values.totalCosts;
      return 'Estimate: ' + number(harvestFish, 0) + ' fish harvested, ' + number(harvestKg, 1)
        + ' kg sale weight, revenue ' + money(values.currency, revenue) + ', profit/loss '
        + money(values.currency, profit)
        + '. Verify survival, feed conversion, mortality records and buyer price.';
    },
    'greenhouse-cost-estimator': function (values) {
      var base = values.areaM2 * values.costPerM2;
      var total = base * (1 + values.contingencyPct / 100);
      return 'Estimate: base build ' + money(values.currency, base) + '; planning total '
        + money(values.currency, total) + ' including ' + values.contingencyPct.toFixed(1)
        + '% contingency. Obtain local structure, irrigation, labour and foundation quotes.';
    }
  };

  function money(currency, amount) {
    return currency + ' ' + amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  function number(value, digits) {
    return value.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  function valuesFor(form) {
    var values = {};
    Array.prototype.forEach.call(form.elements, function (field) {
      if (!field.name) return;
      values[field.name] = field.type === 'number' ? Number(field.value) : field.value;
    });
    return values;
  }

  function validate(form, values) {
    if (!form.checkValidity()) return 'Complete every field with a value inside the stated range.';
    var numeric = Object.keys(values).filter(function (key) { return typeof values[key] === 'number'; });
    if (numeric.some(function (key) { return !Number.isFinite(values[key]); })) return 'Enter valid numbers only.';
    if (numeric.some(function (key) { return values[key] < 0; })) return 'Values cannot be negative.';
    if ('bagKg' in values && values.bagKg <= 0) return 'Bag size must be greater than zero.';
    if ('efficiencyPct' in values && (values.efficiencyPct <= 0 || values.efficiencyPct > 100)) return 'Efficiency must be above 0% and no more than 100%.';
    if ('germinationPct' in values && (values.germinationPct <= 0 || values.germinationPct > 100)) return 'Germination must be above 0% and no more than 100%.';
    if ('survivalPct' in values && (values.survivalPct < 0 || values.survivalPct > 100)) return 'Survival must be between 0% and 100%.';
    return '';
  }

  var api = { calculate: function (id, values) { return calculators[id](values); }, validate: validate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') {
    window.AfroTools = window.AfroTools || {};
    window.AfroTools.day6AgricultureFamilyCalculators = api;
  }
  if (typeof document === 'undefined') return;

  document.addEventListener('submit', function (event) {
    var form = event.target.closest('[data-day6-agriculture-calculator]');
    if (!form) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    var id = form.getAttribute('data-df-form');
    var output = document.querySelector('[data-df-result="' + id + '"]');
    var values = valuesFor(form);
    var error = validate(form, values);
    output.classList.toggle('is-error', Boolean(error));
    output.textContent = error || calculators[id](values);
    output.setAttribute('data-has-result', error ? 'false' : 'true');
  }, true);

  document.addEventListener('input', function (event) {
    var form = event.target.closest('[data-day6-agriculture-calculator]');
    if (!form) return;
    var output = document.querySelector('[data-df-result="' + form.getAttribute('data-df-form') + '"]');
    if (output && output.getAttribute('data-has-result') === 'true') {
      output.textContent = 'Inputs changed. Recalculate before using or copying this estimate.';
    }
  });

  document.addEventListener('reset', function (event) {
    var form = event.target.closest('[data-day6-agriculture-calculator]');
    if (!form) return;
    window.setTimeout(function () {
      var output = document.querySelector('[data-df-result="' + form.getAttribute('data-df-form') + '"]');
      output.classList.remove('is-error');
      output.removeAttribute('data-has-result');
      output.textContent = 'No current result. Enter assumptions and calculate.';
    }, 0);
  });
}());
