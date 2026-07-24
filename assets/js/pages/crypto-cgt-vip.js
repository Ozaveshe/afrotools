(function () {
  'use strict';
  var engine = window.AfroTools && window.AfroTools.engines && window.AfroTools.engines.cryptoCgt;
  if (!engine) return;
  var result = null;
  var country = document.getElementById('cc-country');
  var status = document.getElementById('cc-status');
  var currency = 'NGN';
  var isFr = document.documentElement.lang.toLowerCase().indexOf('fr') === 0;
  var text = isFr ? {
    noEstimate: 'Aucune estimation',
    resolveScope: 'Résolvez le message de périmètre avant de vous fier à un montant.',
    proceeds: 'Produit / valeur de marché',
    baseCost: 'Base de coût et frais de transaction',
    gain: 'Plus-value de la transaction',
    loss: 'Moins-value de la transaction',
    taxable: 'Base imposable de ce modèle',
    aggregate: 'Gain / perte agrégé avant exclusion annuelle',
    afterExclusion: 'Après exclusion annuelle de R50 000',
    carriedLoss: 'Moins-value reportée',
    estimatedTax: 'Impôt estimé',
    transactionResult: 'Résultat de la transaction',
    afterTax: 'Produit après impôt',
    year: 'Période fiscale couverte',
    classification: 'Qualification',
    confirmedCapital: 'Traitement en capital confirmé',
    summaryTitle: 'Estimation de plus-value crypto',
    scope: 'Périmètre : particulier dont le traitement en capital a déjà été confirmé.',
    disclaimer: 'Estimation préparatoire uniquement ; ce document n’est ni une déclaration, ni un avis fiscal, ni une décision de qualification.',
    copyUnavailable: 'La copie n’est pas disponible dans ce navigateur.',
    copied: 'Résumé copié.',
    copyFailed: 'Échec de la copie.',
    csvDone: 'CSV téléchargé localement.',
    pdfDone: 'PDF généré localement.',
    pdfUnavailable: 'La bibliothèque PDF n’est pas disponible.',
    sourceBoundary: 'Périmètre de la source actuelle :',
    errors: {
      'Choose Nigeria, Kenya, South Africa or Ghana.': 'Choisissez le Nigeria, le Kenya, l’Afrique du Sud ou le Ghana.',
      'This estimator supports individuals only. Companies and trusts need a separate review.': 'Cette estimation concerne uniquement les particuliers. Les sociétés et trusts nécessitent une analyse distincte.',
      'Confirm the scope statement before calculating.': 'Confirmez la déclaration de périmètre avant de calculer.'
    }
  } : {
    noEstimate: 'No estimate', resolveScope: 'Resolve the scope message before relying on a number.',
    proceeds: 'Proceeds / market value', baseCost: 'Base cost and transaction costs', gain: 'Transaction capital gain', loss: 'Transaction capital loss',
    taxable: 'Taxable base from this model', aggregate: 'Aggregate gain / loss before annual exclusion', afterExclusion: 'After R50,000 annual exclusion',
    carriedLoss: 'Capital loss carried forward', estimatedTax: 'Estimated tax', transactionResult: 'Transaction result',
    afterTax: 'After-tax proceeds', year: 'Tax year supported', classification: 'Classification', confirmedCapital: 'Confirmed capital account',
    summaryTitle: 'Crypto capital-gains estimate', scope: 'Scope: individual with capital-account treatment already confirmed.',
    disclaimer: 'Planning estimate only; not a filing, tax opinion or classification decision.', copyUnavailable: 'Copy is unavailable in this browser.',
    copied: 'Summary copied.', copyFailed: 'Copy failed.', csvDone: 'CSV downloaded locally.', pdfDone: 'PDF generated locally.',
    pdfUnavailable: 'PDF library is unavailable.', sourceBoundary: 'Current source boundary:', errors: {}
  };
  var sources = {
    NG: { title: 'Nigeria Tax Act 2025', url: 'https://www.nipc.gov.ng/wp-content/uploads/2025/07/Nigeria-Tax-Act-2025.pdf', note: isFr ? 'La loi intègre les actifs numériques et virtuels dans l’assiette fiscale. Cette estimation utilise les tranches individuelles 2026 et calcule uniquement l’impôt supplémentaire lié à une plus-value confirmée.' : 'The Act brings digital and virtual assets into the tax base. This estimator uses the 2026 individual bands and calculates only the incremental tax attributable to a confirmed capital gain.' },
    KE: { title: 'Kenya Income Tax Act (consolidation actuelle)', url: 'https://new.kenyalaw.org/akn/ke/act/1973/16/eng@2026-01-01', note: isFr ? 'L’ancienne Digital Asset Tax a été abrogée au 1er juillet 2025. L’outil n’assume pas que chaque événement crypto est une plus-value : confirmez d’abord le traitement au titre de l’Eighth Schedule.' : 'The old Digital Asset Tax was repealed from 1 July 2025. This tool does not assume every crypto event is automatically a capital gain: you must first confirm Eighth Schedule treatment.' },
    ZA: { title: 'SARS : Crypto Assets & Tax', url: 'https://www.sars.gov.za/individuals/crypto-assets-tax/', note: isFr ? 'Selon SARS, la crypto peut relever du revenu ou du capital selon les faits. Le calcul ne démarre qu’après confirmation du capital et utilise l’exclusion de R50 000 et l’inclusion individuelle de 40 % pour l’année d’imposition 2027.' : 'SARS says crypto may be revenue or capital depending on the facts. The estimate runs only after capital treatment is confirmed and uses the 2027 assessment-year R50,000 exclusion and 40% individual inclusion.' },
    GH: { title: 'GRA : Capital Gains Tax', url: 'https://gra.gov.gh/domestic-tax/tax-types/capital-gains-tax/', note: isFr ? 'GRA décrit un impôt de 15 % pour une opération individuelle isolée en capital. Aucune consigne GRA propre à la qualification crypto n’a été identifiée ; la qualification doit donc être confirmée avant tout calcul.' : 'GRA describes 15% tax for an individual isolated capital transaction. No crypto-specific GRA classification guidance was identified, so classification must be confirmed before this tool will calculate.' }
  };

  function number(id) { return Number(document.getElementById(id).value || 0); }
  function format(amount) { return new Intl.NumberFormat(isFr ? 'fr-FR' : 'en', { style: 'currency', currency: currency, maximumFractionDigits: 2 }).format(amount); }
  function input() {
    return {
      country: country.value, disposalDate: document.getElementById('cc-date').value,
      taxpayerType: document.getElementById('cc-taxpayer').value, classification: document.getElementById('cc-classification').value,
      scopeConfirmed: document.getElementById('cc-confirm').checked, proceeds: number('cc-proceeds'), acquisitionCost: number('cc-cost'),
      acquisitionCosts: number('cc-buy-costs'), disposalCosts: number('cc-sell-costs'), otherChargeableIncome: number('cc-ng-income'),
      otherCapitalGains: number('cc-za-gains'), currentCapitalLosses: number('cc-za-losses'), assessedCapitalLoss: number('cc-za-assessed'), otherTaxableIncome: number('cc-za-income')
    };
  }
  function metric(label, value, className) { return '<div class="cc-metric"><span>' + label + '</span><strong class="' + (className || '') + '">' + value + '</strong></div>'; }
  function countryName() {
    if (!isFr) return result.countryName;
    return { NG: 'Nigeria', KE: 'Kenya', ZA: 'Afrique du Sud', GH: 'Ghana' }[result.country];
  }
  function taxYear() {
    if (!isFr) return result.taxYear;
    return result.country === 'ZA' ? 'année d’imposition 2027' : 'année civile 2026';
  }
  function method() {
    if (!isFr) return result.details.method;
    return {
      NG: 'Impôt individuel supplémentaire selon les tranches du Nigeria Tax Act 2025',
      KE: 'Impôt final de 15 % sur la plus-value après confirmation du traitement Eighth Schedule',
      ZA: 'Inclusion individuelle de 40 % après l’exclusion annuelle de R50 000 et les pertes disponibles',
      GH: 'Traitement à 15 % d’une opération individuelle isolée en capital'
    }[result.country];
  }
  function rows() {
    var list = [
      [text.proceeds, format(result.proceeds)], [text.baseCost, format(result.baseCost)],
      [result.transactionGain >= 0 ? text.gain : text.loss, format(Math.abs(result.transactionGain))], [text.taxable, format(result.taxableBase)]
    ];
    if (result.country === 'ZA') {
      list.push([text.aggregate, format(result.details.aggregateGainOrLoss)]);
      list.push([text.afterExclusion, format(result.details.afterAnnualExclusion)]);
      list.push([text.carriedLoss, format(result.details.carriedCapitalLoss)]);
    }
    list.push([text.estimatedTax, format(result.estimatedTax)]);
    return list;
  }
  function render() {
    document.getElementById('cc-tax').textContent = format(result.estimatedTax);
    document.getElementById('cc-method').textContent = method() + '. ' + taxYear() + '.';
    document.getElementById('cc-metrics').innerHTML = metric(text.transactionResult, format(result.transactionGain), result.transactionGain < 0 ? 'cc-loss' : 'cc-good') + metric(text.afterTax, format(result.afterTaxProceeds)) + metric(text.year, taxYear()) + metric(text.classification, text.confirmedCapital);
    document.getElementById('cc-breakdown').innerHTML = rows().map(function (row) { return '<tr><th scope="row">' + row[0] + '</th><td>' + row[1] + '</td></tr>'; }).join('');
  }
  function calculate(event) {
    if (event) event.preventDefault();
    try { result = engine.calculate(input()); currency = result.currency; render(); status.textContent = ''; }
    catch (error) { result = null; document.getElementById('cc-tax').textContent = text.noEstimate; document.getElementById('cc-method').textContent = text.resolveScope; document.getElementById('cc-metrics').innerHTML = ''; document.getElementById('cc-breakdown').innerHTML = ''; status.textContent = localizeError(error.message); }
  }
  function updateCountry() {
    var rule = engine.rules[country.value];
    currency = rule.currency;
    document.getElementById('cc-date').min = rule.start; document.getElementById('cc-date').max = rule.end; document.getElementById('cc-date').value = rule.start;
    document.querySelectorAll('[data-country-fields]').forEach(function (node) { node.classList.toggle('cc-hidden', node.dataset.countryFields !== country.value); });
    var source = sources[country.value];
    document.getElementById('cc-source').innerHTML = '<strong>' + text.sourceBoundary + '</strong> <a rel="noopener" href="' + source.url + '">' + source.title + '</a>. ' + source.note;
    calculate();
  }
  function localizeError(message) {
    if (!isFr) return message;
    if (text.errors[message]) return text.errors[message];
    if (message.indexOf('No estimate produced:') === 0) return 'Aucune estimation : confirmez auprès de l’administration ou d’un professionnel qualifié que cet événement relève du capital. Les activités professionnelles, le minage, le staking, les récompenses et les cas incertains sont exclus.';
    if (message.indexOf('The disposal date must fall within') === 0) return 'La date de cession doit se situer dans la période fiscale couverte pour la juridiction choisie.';
    return message.replace('must be zero or more.', 'doit être supérieur ou égal à zéro.');
  }
  function summary() { return [text.summaryTitle, countryName() + ' - ' + taxYear()].concat(rows().map(function (row) { return row[0] + ': ' + row[1]; }), [text.scope, text.disclaimer]).join('\n'); }
  function copy() {
    if (!result) calculate(); if (!result) return;
    if (!navigator.clipboard) { status.textContent = text.copyUnavailable; return; }
    navigator.clipboard.writeText(summary()).then(function () { status.textContent = text.copied; }).catch(function () { status.textContent = text.copyFailed; });
  }
  function csv() {
    if (!result) calculate(); if (!result) return;
    var data = [[text.summaryTitle], [isFr ? 'Pays' : 'Country', countryName()], [text.year, taxYear()], [text.classification, text.confirmedCapital]].concat(rows());
    var content = '\uFEFF' + data.map(function (row) { return row.map(function (cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n');
    var url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' })); var a = document.createElement('a'); a.href = url; a.download = 'crypto-capital-gains-estimate-' + result.country.toLowerCase() + '.csv'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 0); status.textContent = text.csvDone;
  }
  async function pdf() {
    if (!result) calculate(); if (!result) return;
    try {
      if (!window.AfroTools || !window.AfroTools.pdf) throw new Error(text.pdfUnavailable);
      await window.AfroTools.pdf.generate({ noGate: true, skipGate: true, title: isFr ? 'Estimation de plus-value crypto' : 'Crypto Capital-Gains Estimate', subtitle: countryName() + ' - ' + taxYear(), toolId: 'crypto-cgt', country: countryName(), heroStats: rows().slice(-4).map(function (row, index) { return { label: row[0], value: row[1], highlight: index === 3 }; }), sections: [{ title: isFr ? 'Données et périmètre de la transaction' : 'Transaction inputs and scope', rows: [{ label: text.proceeds, value: format(result.proceeds) }, { label: text.baseCost, value: format(result.baseCost) }, { label: isFr ? 'Traitement confirmé' : 'Confirmed treatment', value: isFr ? 'Particulier - compte de capital' : 'Individual - capital account' }, { label: isFr ? 'Méthode' : 'Method', value: method() }] }], source: sources[result.country].title + (isFr ? ' et les consignes officielles propres à la juridiction liées sur la page.' : ' and the jurisdiction-specific official tax guidance linked on the calculator page.'), disclaimer: isFr ? 'Estimation préparatoire uniquement. Ce document ne qualifie pas l’événement crypto, ne dépose aucune déclaration et ne fournit aucun avis fiscal. Les activités professionnelles, le minage, le staking, les récompenses et les cas incertains sont exclus.' : 'Planning estimate only. This document does not classify the crypto event, file a return, or provide tax advice. Revenue-account, business, mining, staking, reward and uncertain cases are excluded.' });
      status.textContent = text.pdfDone;
    } catch (error) { status.textContent = error.message; }
  }

  document.getElementById('cc-form').addEventListener('submit', calculate);
  document.getElementById('cc-form').addEventListener('reset', function () { setTimeout(updateCountry, 0); });
  country.addEventListener('change', updateCountry);
  document.getElementById('cc-copy').addEventListener('click', copy); document.getElementById('cc-csv').addEventListener('click', csv); document.getElementById('cc-pdf').addEventListener('click', pdf);
  updateCountry();
})();
