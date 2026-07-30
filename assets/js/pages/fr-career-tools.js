(function () {
  'use strict';
  var root = document.querySelector('[data-fr-career-tool]');
  var engine = window.AfroTools && window.AfroTools.CareerPlanning;
  if (!root || !engine) return;
  var tool = root.getAttribute('data-fr-career-tool');
  var form = root.querySelector('form');
  var status = root.querySelector('[data-status]');
  var results = root.querySelector('[data-results]');
  var report = root.querySelector('[data-report]');
  var lastReport = '';

  function value(name) {
    var element = form.elements[name];
    return element ? element.value : '';
  }
  function money(symbol, amount) {
    return symbol + Math.round(Math.abs(amount)).toLocaleString('fr-FR');
  }
  function metric(label, content) {
    return '<div class="fr-metric"><span>' + label + '</span><strong>' + content + '</strong></div>';
  }
  function setStatus(message, ok) {
    status.textContent = message;
    status.className = 'fr-status' + (ok ? ' ok' : '');
  }
  function show(html, text) {
    root.querySelector('[data-metrics]').innerHTML = html;
    report.textContent = text;
    results.hidden = false;
    lastReport = text;
    setStatus('Résultat prêt. Vous pouvez le copier, le télécharger ou l’enregistrer sur cet appareil.', true);
  }
  function inputObject() {
    if (tool === 'growth') return {
      country: value('country'), industry: value('industry'), level: value('level'),
      salary: value('salary'), experience: value('experience'), education: value('education'),
      path: value('path'), learning: value('learning'), network: value('network'), mobility: value('mobility')
    };
    if (tool === 'switch') return {
      currency: value('currency'), currentSalary: value('currentSalary'),
      currentBenefits: value('currentBenefits'), newSalary: value('newSalary'),
      retrainingCost: value('retrainingCost'), retrainingMonths: value('retrainingMonths'),
      searchMonths: value('searchMonths'), partTimeIncome: value('partTimeIncome'),
      growthRate: value('growthRate'), satisfaction: value('satisfaction')
    };
    if (tool === 'retirement') return {
      country: value('country'), age: value('age'), retirementAge: value('retirementAge'),
      savings: value('savings'), contribution: value('contribution'), salary: value('salary'),
      pensionPayout: value('pensionPayout'), expenses: value('expenses')
    };
    return {
      country: value('country'), experience: value('experience'), benchmark: value('benchmark'),
      current: value('current'), offer: value('offer')
    };
  }
  function calculate(event) {
    event.preventDefault();
    try {
      var input = inputObject();
      var output, html, text;
      if (tool === 'growth') {
        output = engine.careerGrowth(input);
        html = metric('Salaire mensuel de départ', money(output.symbol, output.startSalary)) +
          metric('Projection à 5 ans', money(output.symbol, output.fiveYearSalary)) +
          metric('Projection à 10 ans', money(output.symbol, output.tenYearSalary)) +
          metric('Gains cumulés sur 10 ans', money(output.symbol, output.cumulativeEarnings));
        text = 'PLAN DE CROISSANCE DE CARRIÈRE\n\n' +
          'Départ : ' + money(output.symbol, output.startSalary) + '/mois\n' +
          'À 5 ans : ' + money(output.symbol, output.fiveYearSalary) + '/mois\n' +
          'À 10 ans : ' + money(output.symbol, output.tenYearSalary) + '/mois\n' +
          'Hausse annuelle modélisée : ' + (output.annualRaise * 100).toFixed(1) + '%\n' +
          'Promotion suivante : ' + (output.yearsToNextPromo || 'non estimée') + ' an(s)\n\n' +
          'Estimation de planification : confirmez salaires, exigences du poste et conditions auprès de sources actuelles.';
      } else if (tool === 'switch') {
        output = engine.careerSwitch(input);
        html = metric('Coût total de transition', money(output.symbol, output.totalCost)) +
          metric('Écart mensuel', (output.monthlyGain >= 0 ? '+' : '−') + money(output.symbol, output.monthlyGain)) +
          metric('Retour à l’équilibre', output.breakEven === null ? 'Non atteint avec ce salaire' : output.breakEven + ' mois') +
          metric('Écart cumulé à 5 ans', (output.projectionRows[4].difference >= 0 ? '+' : '−') + money(output.symbol, output.projectionRows[4].difference));
        text = 'PLAN DE CHANGEMENT DE CARRIÈRE\n\n' +
          'Coût de transition : ' + money(output.symbol, output.totalCost) + '\n' +
          'Revenu abandonné pendant la formation : ' + money(output.symbol, output.foregoneIncome) + '\n' +
          'Période de recherche : ' + money(output.symbol, output.searchGap) + '\n' +
          'Retour à l’équilibre : ' + (output.breakEven === null ? 'non atteint' : output.breakEven + ' mois') + '\n\n' +
          'Comparez aussi santé, responsabilités familiales, demande réelle et conditions écrites du poste.';
      } else if (tool === 'retirement') {
        output = engine.retirement(input);
        html = metric('Couverture de la cible', output.score + '%') +
          metric('Épargne projetée', money(output.symbol, output.projected)) +
          metric('Cible selon la règle 25×', money(output.symbol, output.target)) +
          metric('Écart mensuel estimé', (output.shortfall >= 0 ? '+' : '−') + money(output.symbol, output.shortfall));
        text = 'ÉTAT DE PRÉPARATION À LA RETRAITE\n\n' +
          'Pays : ' + output.countryName + '\n' +
          'Années restantes : ' + output.years + '\n' +
          'Couverture : ' + output.score + '%\n' +
          'Épargne projetée : ' + money(output.symbol, output.projected) + '\n' +
          'Cible : ' + money(output.symbol, output.target) + '\n' +
          'Contribution mensuelle supplémentaire modélisée : ' + money(output.symbol, output.extraContribution) + '\n\n' +
          'Estimation éducative, sans garantie de rendement. Vérifiez frais, inflation, fiscalité et règles du prestataire.';
      } else {
        output = engine.salaryNegotiation(input);
        var labels = {
          'not-entered': 'Aucune offre saisie', 'below-lower': 'Sous la borne basse',
          'below-midpoint': 'Sous le point médian', 'near-midpoint': 'Près du point médian',
          'above-midpoint': 'Au-dessus du point médian', 'above-upper': 'Au-dessus de la borne haute'
        };
        html = metric('Borne basse (90 %)', money(output.symbol, output.lower)) +
          metric('Point médian vérifié', money(output.symbol, output.median)) +
          metric('Contre-offre de travail (105 %)', money(output.symbol, output.counter)) +
          metric('Lecture de l’offre', labels[output.comparison]);
        text = 'PLAN DE NÉGOCIATION SALARIALE\n\n' +
          'Fourchette de planification : ' + money(output.symbol, output.lower) + ' à ' + money(output.symbol, output.upper) + '/mois\n' +
          'Point médian : ' + money(output.symbol, output.median) + '/mois\n' +
          'Scénario de contre-offre : ' + money(output.symbol, output.counter) + '/mois\n\n' +
          'Script : Merci pour cette offre. Sur la base des preuves récentes que j’ai vérifiées pour des fonctions comparables et des résultats que je peux démontrer, pouvons-nous discuter d’un montant plus proche de ' +
          money(output.symbol, output.counter) + ' par mois ? Je souhaite aussi comprendre la rémunération totale et les conditions écrites.';
      }
      show(html, text);
    } catch (error) {
      var field = error && error.field ? form.elements[error.field] : null;
      setStatus('Vérifiez les valeurs saisies et les limites indiquées dans le formulaire.', false);
      if (field) field.focus();
    }
  }
  function copy() {
    if (!lastReport) return setStatus('Calculez d’abord un résultat.', false);
    var fallback = function () {
      var area = document.createElement('textarea');
      area.value = lastReport;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
      setStatus('Rapport copié.', true);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(lastReport).then(function () { setStatus('Rapport copié.', true); }, fallback);
    } else fallback();
  }
  function download() {
    if (!lastReport) return setStatus('Calculez d’abord un résultat.', false);
    var blob = new Blob([lastReport], { type: 'text/plain;charset=utf-8' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = root.getAttribute('data-export-name') + '.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(link.href); }, 0);
    setStatus('Rapport TXT téléchargé.', true);
  }
  function save() {
    if (!lastReport) return setStatus('Calculez d’abord un résultat.', false);
    try {
      localStorage.setItem('afrotools-fr-career-' + tool, JSON.stringify({ savedAt: Date.now(), report: lastReport }));
      setStatus('Rapport enregistré uniquement sur cet appareil.', true);
    } catch (error) {
      setStatus('Enregistrement local indisponible. Téléchargez plutôt le fichier TXT.', false);
    }
  }
  form.addEventListener('submit', calculate);
  root.querySelector('[data-copy]').addEventListener('click', copy);
  root.querySelector('[data-download]').addEventListener('click', download);
  root.querySelector('[data-save]').addEventListener('click', save);
}());
