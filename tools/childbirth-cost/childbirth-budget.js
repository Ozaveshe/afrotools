(function () {
  'use strict';

  var engine = window.AfroTools && window.AfroTools.childbirthBudgetEngine;
  var form = document.getElementById('childbirth-budget-form');
  var results = document.getElementById('childbirth-budget-results');
  var errorBox = document.getElementById('form-error');
  var lastResult = null;
  var isFrench = document.documentElement.lang.toLowerCase().split('-')[0] === 'fr';
  var frenchItems = {
    plannedCare: 'Devis des soins prévus',
    professionalFees: 'Honoraires, bloc opératoire ou anesthésie facturés séparément',
    medicinesSupplies: 'Médicaments, sang ou fournitures',
    testsCare: 'Examens, soins du nouveau-né ou soins postnataux',
    transportStay: 'Transport, hébergement ou accompagnement',
    contingency: 'Provision du ménage pour imprévus'
  };
  var frenchSources = {
    'written-provider': 'Devis écrit du prestataire',
    'written-payer': 'Confirmation écrite de l’assureur ou du payeur',
    'verbal-provider': 'Estimation orale du prestataire à confirmer par écrit',
    'household-assumption': 'Hypothèses de planification du ménage, non confirmées par un prestataire'
  };
  var fieldIds = {
    plannedCare: 'planned-care',
    professionalFees: 'professional-fees',
    medicinesSupplies: 'medicines-supplies',
    testsCare: 'tests-care',
    transportStay: 'transport-stay',
    contingency: 'contingency'
  };

  function todayIso() {
    var now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }

  function formatMoney(cents, currency) {
    try {
      return new Intl.NumberFormat(isFrench ? 'fr-FR' : 'en', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(cents / 100);
    } catch (error) {
      return currency + ' ' + (cents / 100).toFixed(2);
    }
  }

  function formatDate(iso) {
    var date = new Date(iso + 'T00:00:00Z');
    return new Intl.DateTimeFormat(isFrench ? 'fr-FR' : 'en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(date);
  }

  function freshnessText(result) {
    if (isFrench) {
      var age = result.ageDays + (result.ageDays === 1 ? ' jour' : ' jours');
      if (result.freshness === 'recent') return 'Daté d’il y a ' + age;
      if (result.freshness === 'review-soon') return 'À reconfirmer : ' + age;
      return 'Actualisation nécessaire : ' + age;
    }
    if (result.freshness === 'recent') return 'Dated ' + result.ageDays + ' day(s) ago';
    if (result.freshness === 'review-soon') return 'Reconfirm: ' + result.ageDays + ' days old';
    return 'Refresh required: ' + result.ageDays + ' days old';
  }

  function render(result) {
    lastResult = result;
    document.getElementById('gross-total').textContent = formatMoney(result.grossCents, result.currency);
    document.getElementById('contribution-total').textContent = formatMoney(result.contributionCents, result.currency);
    document.getElementById('household-total').textContent = formatMoney(result.householdCents, result.currency);
    document.getElementById('freshness-badge').textContent = freshnessText(result);
    document.getElementById('freshness-badge').dataset.freshness = result.freshness;
    document.getElementById('source-summary').textContent =
      (isFrench ? frenchSources[result.sourceType] + ', en date du ' : result.sourceLabel + ', dated ') + formatDate(result.quoteDate) + '.';
    var list = document.getElementById('breakdown-list');
    list.replaceChildren();
    result.lineItems.forEach(function (item) {
      var li = document.createElement('li');
      var label = document.createElement('span');
      var amount = document.createElement('strong');
      label.textContent = isFrench ? frenchItems[item.id] : item.label;
      amount.textContent = formatMoney(item.cents, result.currency);
      li.append(label, amount);
      list.appendChild(li);
    });
    results.hidden = false;
    document.getElementById('results-title').focus({ preventScroll: true });
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function submit(event) {
    event.preventDefault();
    if (!engine) {
      errorBox.textContent = 'The local budget engine did not load. Refresh and try again.';
      return;
    }
    var input = {
      currency: document.getElementById('currency-code').value,
      quoteDate: document.getElementById('quote-date').value,
      sourceType: document.getElementById('source-type').value,
      confirmedContribution: document.getElementById('confirmed-contribution').value,
      asOf: todayIso()
    };
    Object.keys(fieldIds).forEach(function (key) {
      input[key] = document.getElementById(fieldIds[key]).value;
    });
    var result = engine.calculate(input);
    if (!result.valid) {
      errorBox.textContent = result.error;
      document.getElementById('currency-code').focus();
      return;
    }
    errorBox.textContent = '';
    render(result);
  }

  function exportText(result) {
    if (isFrench) return [
      'AFROTOOLS — BUDGET D’ACCOUCHEMENT FONDÉ SUR UN DEVIS',
      '',
      'Source des montants : ' + frenchSources[result.sourceType],
      'Date du devis ou de l’hypothèse : ' + formatDate(result.quoteDate),
      'Ancienneté lors du calcul : ' + result.ageDays + (result.ageDays === 1 ? ' jour' : ' jours'),
      'État des montants : ' + freshnessText(result),
      'Devise : ' + result.currency,
      '',
      'Postes saisis :',
      result.lineItems.map(function (item) {
        return '- ' + frenchItems[item.id] + ' : ' + formatMoney(item.cents, result.currency);
      }).join('\n'),
      '',
      'Total des coûts saisis : ' + formatMoney(result.grossCents, result.currency),
      'Contribution confirmée du payeur : ' + formatMoney(result.contributionCents, result.currency),
      'Montant à prévoir par le ménage : ' + formatMoney(result.householdCents, result.currency),
      '',
      'Chaque montant a été saisi par l’utilisateur. Il s’agit d’un calcul, sans devis du prestataire, garantie de couverture ni recommandation de soins.',
      'Un champ à zéro signifie qu’aucun montant n’a été saisi, pas que les soins sont gratuits.',
      'Confirmez directement le plan clinique, la validité du devis, les postes inclus et la couverture. Des soins imprévus peuvent modifier les coûts.',
      'La planification des coûts ne doit pas retarder les soins de maternité nécessaires ou urgents.',
      'Sources : OMS, couverture sanitaire universelle ; protection financière ; mortalité maternelle.',
      'Sources vérifiées : 26 juillet 2026.',
      'Créé localement. Aucun compte, e-mail, téléversement, envoi analytique ni enregistrement dans le navigateur.'
    ].join('\n');
    return [
      'AFROTOOLS PROVIDER-QUOTE CHILDBIRTH BUDGET',
      '',
      'Figure source: ' + result.sourceLabel,
      'Quote or assumption date: ' + formatDate(result.quoteDate),
      'Figure age when calculated: ' + result.ageDays + ' day(s)',
      'Currency: ' + result.currency,
      '',
      'Entered line items:',
      result.lineItems.map(function (item) {
        return '- ' + item.label + ': ' + formatMoney(item.cents, result.currency);
      }).join('\n'),
      '',
      'User-entered cost total: ' + formatMoney(result.grossCents, result.currency),
      'Confirmed payer contribution: ' + formatMoney(result.contributionCents, result.currency),
      'Household amount to plan: ' + formatMoney(result.householdCents, result.currency),
      '',
      result.boundary,
      'A zero field means no amount entered, not free care.',
      'Confirm the clinical plan, quote validity, included items and coverage directly. Unexpected care can change costs.',
      'Cost planning must not delay needed or urgent maternity care.',
      'Sources: WHO universal health coverage; WHO financial protection; WHO maternal mortality.',
      'Sources checked: 26 July 2026.',
      'Created locally. No account, email, upload, analytics or saved browser record.'
    ].join('\n');
  }

  function setStatus(message) {
    document.getElementById('export-status').textContent = message;
  }

  function downloadBlob(filename, type, content) {
    var url = URL.createObjectURL(new Blob([content], { type: type }));
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }

  function ensurePdfLibrary() {
    if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = '/assets/vendor/jspdf/jspdf.umd.min.js';
      script.dataset.localJspdf = 'true';
      script.onload = function () { resolve(window.jspdf.jsPDF); };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function downloadPdf() {
    if (!lastResult) return setStatus('Calculate a budget before exporting.');
    setStatus('Preparing local PDF...');
    ensurePdfLibrary().then(function (JsPdf) {
      var pdf = new JsPdf({ unit: 'pt', format: 'a4' });
      pdf.setProperties({ title: isFrench ? 'AfroTools — budget d’accouchement fondé sur un devis' : 'AfroTools provider-quote childbirth budget' });
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      var lines = pdf.splitTextToSize(exportText(lastResult).replace(/\u202f/g, ' '), 500);
      var y = 54;
      lines.forEach(function (line) {
        if (y > 790) {
          pdf.addPage();
          y = 54;
        }
        pdf.text(line, 48, y);
        y += 14;
      });
      pdf.save('afrotools-provider-quote-childbirth-budget.pdf');
      setStatus('PDF downloaded locally.');
    }).catch(function () {
      setStatus('PDF could not be created. Use the TXT export instead.');
    });
  }

  form.addEventListener('submit', submit);
  document.getElementById('quote-date').max = todayIso();
  document.getElementById('download-txt').addEventListener('click', function () {
    if (!lastResult) return setStatus('Calculate a budget before exporting.');
    downloadBlob('afrotools-provider-quote-childbirth-budget.txt', 'text/plain;charset=utf-8', exportText(lastResult));
    setStatus('TXT downloaded locally.');
  });
  document.getElementById('download-pdf').addEventListener('click', downloadPdf);
  document.getElementById('clear-budget').addEventListener('click', function () {
    form.reset();
    document.getElementById('currency-code').value = 'NGN';
    results.hidden = true;
    lastResult = null;
    setStatus('Amounts, date and current budget cleared.');
    document.getElementById('currency-code').focus();
  });

  window.AfroChildbirthBudget = {
    getResult: function () { return lastResult; },
    getOverflowDetails: function () {
      return Array.from(document.querySelectorAll('body *')).filter(function (element) {
        var rect = element.getBoundingClientRect();
        return rect.width > document.documentElement.clientWidth + 1 ||
          rect.right > document.documentElement.clientWidth + 1 ||
          rect.left < -1;
      }).map(function (element) {
        var rect = element.getBoundingClientRect();
        return {
          tag: element.tagName,
          id: element.id,
          className: String(element.className || ''),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width)
        };
      }).slice(0, 12);
    }
  };
})();
