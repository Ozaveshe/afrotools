(function () {
  'use strict';
  var app = document.querySelector('[data-za-cgt-app]');
  var engine = window.AfroTools && window.AfroTools.SouthAfricaCgt;
  if (!app || !engine) return;
  var form = app.querySelector('form');
  var result = app.querySelector('[data-result]');
  var error = app.querySelector('[data-error]');
  var status = app.querySelector('[data-status]');
  var lastSummary = '';
  function field(name) { return app.querySelector('[name="' + name + '"]'); }
  function number(name) { return Number(field(name).value); }
  function checked(name) { return field(name).checked; }
  function money(value) { return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 2 }).format(value); }
  function updateFields() {
    var individual = field('taxpayerType').value === 'individual';
    var residence = field('assetType').value === 'residence';
    app.querySelector('[data-individual]').hidden = !individual;
    app.querySelector('[data-residence]').hidden = !residence;
  }
  function input() {
    return {
      taxpayerType: field('taxpayerType').value,
      disposalDate: field('disposalDate').value,
      assetType: field('assetType').value,
      proceeds: number('proceeds'),
      acquisitionCost: number('acquisitionCost'),
      acquisitionCosts: number('acquisitionCosts'),
      improvementCosts: number('improvementCosts'),
      disposalCosts: number('disposalCosts'),
      otherCapitalGains: number('otherCapitalGains'),
      currentCapitalLosses: number('currentCapitalLosses'),
      assessedCapitalLoss: number('assessedCapitalLoss'),
      otherTaxableIncome: number('otherTaxableIncome'),
      residenceEligible: checked('residenceEligible'),
      qualifyingResidencePercent: number('qualifyingResidencePercent'),
      ownershipPercent: number('ownershipPercent'),
      scopeConfirmed: checked('scopeConfirmed')
    };
  }
  function render(out) {
    app.querySelector('[data-tax]').textContent = money(out.tax);
    app.querySelector('[data-transaction]').textContent = money(out.transactionAmount);
    app.querySelector('[data-exclusions]').textContent = money(out.residenceExclusion + Math.abs(out.annualExclusionApplied));
    app.querySelector('[data-taxable]').textContent = money(out.taxableCapitalGain);
    app.querySelector('[data-carried]').textContent = money(out.carriedCapitalLoss);
    var rows = [
      'Proceeds ' + money(out.proceeds) + ' less supported base cost ' + money(out.baseCost) + ' = ' + money(out.transactionAmount) + '.',
      'Aggregate gain or loss before the annual exclusion: ' + money(out.aggregateBeforeAnnual) + '.',
      'After the annual exclusion and assessed capital loss: net capital gain ' + money(out.netCapitalGain) + '.',
      (out.inclusionRate * 100).toFixed(0) + '% inclusion produces taxable capital gain of ' + money(out.taxableCapitalGain) + '.',
      'Estimated incremental normal tax: ' + money(out.tax) + '.'
    ];
    app.querySelector('[data-steps]').innerHTML = rows.map(function (row) { return '<li>' + row + '</li>'; }).join('');
    lastSummary = ['AfroTools South Africa CGT planning estimate', '2027 assessment year', 'Disposal date: ' + out.disposalDate].concat(rows).concat(['Not a SARS return, assessment, filing instruction or payment amount.']).join('\n');
    result.hidden = false;
    result.focus({ preventScroll: true });
    result.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    error.textContent = '';
    status.textContent = '';
    try { render(engine.calculate(input())); } catch (failure) { result.hidden = true; error.textContent = failure && failure.message === 'scope confirmation is required' ? 'Confirm the calculator scope before calculating.' : failure && failure.message === 'disposalDate must fall in the 2027 assessment year' ? 'Choose a disposal date from 1 March 2026 to 28 February 2027.' : 'Check that every amount is zero or more and each percentage is between 0 and 100.'; }
  });
  app.querySelector('[data-copy]').addEventListener('click', function () {
    if (!lastSummary) return;
    navigator.clipboard.writeText(lastSummary).then(function () { status.textContent = 'Summary copied.'; }, function () { status.textContent = 'Copy unavailable; select the calculation steps manually.'; });
  });
  app.querySelector('[data-download]').addEventListener('click', function () {
    if (!lastSummary) return;
    var url = URL.createObjectURL(new Blob([lastSummary], { type: 'text/plain;charset=utf-8' }));
    var link = document.createElement('a');
    link.href = url;
    link.download = 'south-africa-cgt-2027-estimate.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    status.textContent = 'TXT summary downloaded.';
  });
  field('taxpayerType').addEventListener('change', updateFields);
  field('assetType').addEventListener('change', updateFields);
  updateFields();
})();
