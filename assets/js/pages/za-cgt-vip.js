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
  var french = document.documentElement.lang === 'fr';
  function t(english, frenchCopy) { return french ? frenchCopy : english; }
  function field(name) { return app.querySelector('[name="' + name + '"]'); }
  function number(name) { return Number(field(name).value); }
  function checked(name) { return field(name).checked; }
  function money(value) { return new Intl.NumberFormat(french ? 'fr-ZA' : 'en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 2 }).format(value); }
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
    var rows = french ? [
      'Produit de cession ' + money(out.proceeds) + ' moins prix de base justifié ' + money(out.baseCost) + ' = ' + money(out.transactionAmount) + '.',
      'Gain ou perte global avant l’exclusion annuelle : ' + money(out.aggregateBeforeAnnual) + '.',
      'Après l’exclusion annuelle et la perte en capital reportée : gain en capital net ' + money(out.netCapitalGain) + '.',
      'L’inclusion de ' + (out.inclusionRate * 100).toFixed(0) + ' % produit un gain en capital imposable de ' + money(out.taxableCapitalGain) + '.',
      'Impôt normal supplémentaire estimé : ' + money(out.tax) + '.'
    ] : [
      'Proceeds ' + money(out.proceeds) + ' less supported base cost ' + money(out.baseCost) + ' = ' + money(out.transactionAmount) + '.',
      'Aggregate gain or loss before the annual exclusion: ' + money(out.aggregateBeforeAnnual) + '.',
      'After the annual exclusion and assessed capital loss: net capital gain ' + money(out.netCapitalGain) + '.',
      (out.inclusionRate * 100).toFixed(0) + '% inclusion produces taxable capital gain of ' + money(out.taxableCapitalGain) + '.',
      'Estimated incremental normal tax: ' + money(out.tax) + '.'
    ];
    app.querySelector('[data-steps]').innerHTML = rows.map(function (row) { return '<li>' + row + '</li>'; }).join('');
    lastSummary = (french ? ['Estimation de planification AfroTools de la plus-value en Afrique du Sud', 'Année d’imposition 2027', 'Date de cession : ' + out.disposalDate] : ['AfroTools South Africa CGT planning estimate', '2027 assessment year', 'Disposal date: ' + out.disposalDate]).concat(rows).concat([t('Not a SARS return, assessment, filing instruction or payment amount.','Ni déclaration SARS, ni avis d’imposition, instruction de dépôt ou montant à payer.')]).join('\n');
    result.hidden = false;
    result.focus({ preventScroll: true });
    result.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    error.textContent = '';
    status.textContent = '';
    try { render(engine.calculate(input())); } catch (failure) { result.hidden = true; error.textContent = failure && failure.message === 'scope confirmation is required' ? t('Confirm the calculator scope before calculating.','Confirmez le périmètre du calculateur avant de calculer.') : failure && failure.message === 'disposalDate must fall in the 2027 assessment year' ? t('Choose a disposal date from 1 March 2026 to 28 February 2027.','Choisissez une date de cession comprise entre le 1er mars 2026 et le 28 février 2027.') : t('Check that every amount is zero or more and each percentage is between 0 and 100.','Vérifiez que chaque montant est positif ou nul et que chaque pourcentage est compris entre 0 et 100.'); }
  });
  app.querySelector('[data-copy]').addEventListener('click', function () {
    if (!lastSummary) return;
    navigator.clipboard.writeText(lastSummary).then(function () { status.textContent = t('Summary copied.','Résumé copié.'); }, function () { status.textContent = t('Copy unavailable; select the calculation steps manually.','Copie indisponible ; sélectionnez manuellement les étapes du calcul.'); });
  });
  app.querySelector('[data-download]').addEventListener('click', function () {
    if (!lastSummary) return;
    var url = URL.createObjectURL(new Blob([lastSummary], { type: 'text/plain;charset=utf-8' }));
    var link = document.createElement('a');
    link.href = url;
    link.download = french ? 'estimation-plus-value-afrique-du-sud-2027.txt' : 'south-africa-cgt-2027-estimate.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    status.textContent = t('TXT summary downloaded.','Résumé TXT téléchargé.');
  });
  field('taxpayerType').addEventListener('change', updateFields);
  field('assetType').addEventListener('change', updateFields);
  updateFields();
})();
