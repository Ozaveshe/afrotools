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
  var swahili = document.documentElement.lang === 'sw';
  var swahiliCopy = {
    'Not a SARS return, assessment, filing instruction or payment amount.': 'Si fomu ya SARS, tathmini, maagizo ya kuwasilisha wala kiasi cha kulipa.',
    'Confirm the calculator scope before calculating.': 'Thibitisha upeo wa kikokotoo kabla ya kukokotoa.',
    'Choose a disposal date from 1 March 2026 to 28 February 2027.': 'Chagua tarehe ya uuzaji kati ya 1 Machi 2026 na 28 Februari 2027.',
    'Check that every amount is zero or more and each percentage is between 0 and 100.': 'Kagua kuwa kila kiasi ni sifuri au zaidi na kila asilimia iko kati ya 0 na 100.',
    'Summary copied.': 'Muhtasari umenakiliwa.',
    'Copy unavailable; select the calculation steps manually.': 'Kunakili hakupatikani; chagua hatua za hesabu mwenyewe.',
    'TXT summary downloaded.': 'Muhtasari wa TXT umepakuliwa.'
  };
  function t(english, frenchCopy) { return swahili ? (swahiliCopy[english] || english) : french ? frenchCopy : english; }
  function field(name) { return app.querySelector('[name="' + name + '"]'); }
  function number(name) { return Number(field(name).value); }
  function checked(name) { return field(name).checked; }
  function money(value) { return new Intl.NumberFormat(swahili ? 'sw-ZA' : french ? 'fr-ZA' : 'en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 2 }).format(value); }
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
    var rows = swahili ? [
      'Mapato ya mauzo ' + money(out.proceeds) + ' ukiondoa gharama ya msingi yenye ushahidi ' + money(out.baseCost) + ' = ' + money(out.transactionAmount) + '.',
      'Jumla ya faida au hasara kabla ya msamaha wa mwaka: ' + money(out.aggregateBeforeAnnual) + '.',
      'Baada ya msamaha wa mwaka na hasara ya mtaji iliyoletwa mbele: faida halisi ya mtaji ' + money(out.netCapitalGain) + '.',
      'Kiwango cha kujumuisha cha ' + (out.inclusionRate * 100).toFixed(0) + '% kinatoa faida ya mtaji inayotozwa kodi ya ' + money(out.taxableCapitalGain) + '.',
      'Makadirio ya ongezeko la kodi ya kawaida: ' + money(out.tax) + '.'
    ] : french ? [
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
    if (swahili) lastSummary = ['Makadirio ya kupanga ya CGT ya Afrika Kusini ya AfroTools', 'Mwaka wa tathmini 2027', 'Tarehe ya uuzaji: ' + out.disposalDate].concat(rows).concat([swahiliCopy['Not a SARS return, assessment, filing instruction or payment amount.']]).join('\n');
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
    link.download = swahili ? 'makadirio-cgt-afrika-kusini-2027.txt' : french ? 'estimation-plus-value-afrique-du-sud-2027.txt' : 'south-africa-cgt-2027-estimate.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    status.textContent = t('TXT summary downloaded.','Résumé TXT téléchargé.');
  });
  field('taxpayerType').addEventListener('change', updateFields);
  field('assetType').addEventListener('change', updateFields);
  form.addEventListener('input', function () {
    if (!lastSummary) return;
    lastSummary = '';
    result.hidden = true;
    status.textContent = swahili ? 'Data imebadilika; kokotoa tena kabla ya kutumia matokeo.' : french ? 'Les entrées ont changé ; recalculez avant d’utiliser le résultat.' : 'Inputs changed; calculate again before using the result.';
  });
  form.addEventListener('reset', function () {
    setTimeout(function () {
      updateFields();
      lastSummary = '';
      result.hidden = true;
      error.textContent = '';
      status.textContent = swahili ? 'Fomu imerudishwa mwanzo.' : french ? 'Formulaire réinitialisé.' : 'Form reset.';
    }, 0);
  });
  form.addEventListener('submit', function () {
    setTimeout(function () {
      if (!error.textContent) return;
      if (!field('scopeConfirmed').checked) field('scopeConfirmed').focus();
      else if (field('disposalDate').value < engine.RULES.effectiveFrom || field('disposalDate').value > engine.RULES.effectiveTo) field('disposalDate').focus();
      else field('proceeds').focus();
    }, 0);
  });
  updateFields();
})();
