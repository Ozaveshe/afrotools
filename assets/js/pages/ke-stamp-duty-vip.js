(function () {
  'use strict';

  var root = document.querySelector('[data-ke-stamp-duty]');
  if (!root) return;
  var engine = window.KE_STAMP_DUTY;
  var locale = root.dataset.locale || 'en';
  var text = {
    en: {
      unavailable: 'The local calculation engine did not load. Refresh this page; no data was sent.',
      date: 'Use an instrument date from 1 July 2025 through 23 July 2026.',
      location: 'Choose municipality or outside municipality from the title, valuation or KRA assessment.',
      transaction: 'Choose sale or gift.',
      transfer: 'Enter a positive open-market value and a zero-or-positive consideration.',
      termType: 'Choose a definite or indefinite lease term.',
      term: 'Enter a definite lease term greater than zero years.',
      lease: 'Enter a positive annual rent and a zero-or-positive premium.',
      ready: 'Planning calculation ready. No input left this browser.',
      changed: 'Inputs changed. Calculate again.',
      copied: 'Calculation copied locally.',
      exported: 'Local export created.',
      transferMode: 'Ordinary transfer schedule calculation.',
      leaseMode: 'Lease rent schedule plus any premium duty.'
    },
    fr: {
      unavailable: 'Le moteur de calcul local ne s’est pas chargé. Actualisez la page; aucune donnée n’a été envoyée.',
      date: 'Utilisez une date d’instrument du 1er juillet 2025 au 23 juillet 2026.',
      location: 'Choisissez municipalité ou hors municipalité selon le titre, l’évaluation ou l’avis KRA.',
      transaction: 'Choisissez vente ou donation.',
      transfer: 'Saisissez une valeur de marché positive et une contrepartie nulle ou positive.',
      termType: 'Choisissez un bail à durée déterminée ou indéterminée.',
      term: 'Saisissez une durée déterminée supérieure à zéro an.',
      lease: 'Saisissez un loyer annuel positif et une prime nulle ou positive.',
      ready: 'Calcul indicatif prêt. Aucune donnée n’a quitté ce navigateur.',
      changed: 'Données modifiées. Recalculez.',
      copied: 'Calcul copié localement.',
      exported: 'Export local créé.',
      transferMode: 'Calcul selon le barème des transferts ordinaires.',
      leaseMode: 'Barème du loyer du bail, plus le droit sur la prime éventuelle.'
    }
  }[locale];

  var form = document.getElementById('ks-form');
  var transferFields = document.getElementById('ks-transfer-fields');
  var leaseFields = document.getElementById('ks-lease-fields');
  var termYearsField = document.getElementById('ks-term-years-field');
  var results = document.getElementById('ks-results');
  var error = document.getElementById('ks-error');
  var status = document.getElementById('ks-status');
  var actions = document.querySelectorAll('[data-ks-action]');
  var current = null;

  function value(id) { return document.getElementById(id).value; }
  function mode() { return document.querySelector('input[name="ks-mode"]:checked').value; }
  function input() {
    return {
      instrumentDate: value('ks-date'),
      mode: mode(),
      location: value('ks-location'),
      transactionType: value('ks-transaction'),
      consideration: value('ks-consideration'),
      marketValue: value('ks-market-value'),
      termType: value('ks-term-type'),
      termYears: value('ks-term-years'),
      annualRent: value('ks-annual-rent'),
      premium: value('ks-premium')
    };
  }
  function money(number) {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 2
    }).format(number);
  }
  function set(id, value) { document.getElementById(id).textContent = value; }
  function enable(on) { actions.forEach(function (button) { button.disabled = !on; }); }
  function clear(message) {
    current = null;
    results.hidden = true;
    enable(false);
    if (message) status.textContent = message;
  }
  function syncFields() {
    var lease = mode() === 'lease';
    transferFields.hidden = lease;
    leaseFields.hidden = !lease;
    termYearsField.hidden = value('ks-term-type') === 'indefinite';
  }
  function errorMessage(code) {
    return code === 'unsupported_date' ? text.date :
      code === 'invalid_location' ? text.location :
      code === 'invalid_transaction_type' ? text.transaction :
      code === 'invalid_transfer_values' ? text.transfer :
      code === 'invalid_term_type' ? text.termType :
      code === 'invalid_term' ? text.term : text.lease;
  }
  function summary() {
    return [
      root.dataset.pdfTitle,
      root.dataset.modeLabel + ': ' + current.mode,
      root.dataset.basisLabel + ': ' + money(current.dutiableValue),
      root.dataset.transferLabel + ': ' + money(current.transferDuty),
      root.dataset.rentLabel + ': ' + money(current.rentDuty),
      root.dataset.premiumLabel + ': ' + money(current.premiumDuty),
      root.dataset.payableLabel + ': ' + money(current.payable),
      current.rateLabel,
      current.boundary
    ].join('\n');
  }
  function cell(value) {
    var string = String(value);
    if (/^[=+\-@]/.test(string)) string = "'" + string;
    return '"' + string.replace(/"/g, '""') + '"';
  }
  function download(name, type, content) {
    var url = URL.createObjectURL(new Blob([content], { type: type }));
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    anchor.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    status.textContent = text.exported;
  }

  if (!engine) {
    error.textContent = text.unavailable;
    form.querySelector('button[type="submit"]').disabled = true;
    return;
  }

  document.querySelectorAll('input[name="ks-mode"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      syncFields();
      if (current) clear(text.changed);
    });
  });
  document.getElementById('ks-term-type').addEventListener('change', function () {
    syncFields();
    if (current) clear(text.changed);
  });
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var result = engine.calculate(input());
    if (!result.ok) {
      clear();
      error.textContent = errorMessage(result.error);
      return;
    }
    current = result;
    error.textContent = '';
    set('ks-payable', money(result.payable));
    set('ks-basis-result', money(result.dutiableValue));
    set('ks-transfer-result', money(result.transferDuty));
    set('ks-rent-result', money(result.rentDuty));
    set('ks-premium-result', money(result.premiumDuty));
    set('ks-band-result', result.rateLabel);
    set('ks-mode-note', result.mode === 'transfer' ? text.transferMode : text.leaseMode);
    set('ks-boundary', result.boundary);
    results.hidden = false;
    enable(true);
    status.textContent = text.ready;
  });
  form.addEventListener('input', function () {
    if (current) clear(text.changed);
  });
  document.getElementById('ks-reset').addEventListener('click', function () {
    form.reset();
    syncFields();
    error.textContent = '';
    status.textContent = '';
    clear();
  });
  document.getElementById('ks-copy').addEventListener('click', function () {
    var done = function () { status.textContent = text.copied; };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(summary()).then(done).catch(function () {
        window.prompt(root.dataset.copyPrompt, summary());
        done();
      });
    } else {
      window.prompt(root.dataset.copyPrompt, summary());
      done();
    }
  });
  document.getElementById('ks-csv').addEventListener('click', function () {
    var rows = [
      ['item', 'value'],
      ['instrument_date', current.instrumentDate],
      ['mode', current.mode],
      ['location', current.location],
      ['dutiable_value', current.dutiableValue],
      ['transfer_duty', current.transferDuty],
      ['lease_rent_duty', current.rentDuty],
      ['lease_premium_duty', current.premiumDuty],
      ['planning_payable', current.payable]
    ];
    download('kenya-stamp-duty-plan.csv', 'text/csv;charset=utf-8', rows.map(function (row) {
      return row.map(cell).join(',');
    }).join('\n'));
  });
  document.getElementById('ks-json').addEventListener('click', function () {
    download('kenya-stamp-duty-plan.json', 'application/json', JSON.stringify({
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      privacy: 'Local Kenya stamp-duty planning calculation. Contains user-entered financial values.',
      calculation: current
    }, null, 2));
  });
  document.getElementById('ks-pdf').addEventListener('click', async function () {
    if (window.AfroTools && window.AfroTools.pdf) {
      await window.AfroTools.pdf.generate({
        toolId: 'ke-stamp-duty',
        category: 'finance',
        title: root.dataset.pdfTitle,
        subtitle: engine.RULES.scheme + ' · ' + current.instrumentDate,
        noGate: true,
        skipGate: true,
        heroStats: [
          [root.dataset.payableLabel, money(current.payable)],
          [root.dataset.basisLabel, money(current.dutiableValue)],
          [root.dataset.modeLabel, current.mode]
        ],
        sections: [{
          title: root.dataset.breakdownTitle,
          rows: [
            [root.dataset.transferLabel, money(current.transferDuty)],
            [root.dataset.rentLabel, money(current.rentDuty)],
            [root.dataset.premiumLabel, money(current.premiumDuty)],
            [root.dataset.bandLabel, current.rateLabel]
          ]
        }],
        source: engine.RULES.source + ' · reviewed ' + engine.RULES.verifiedThrough,
        disclaimer: root.dataset.pdfDisclaimer
      });
      status.textContent = text.exported;
    } else {
      window.print();
    }
  });

  syncFields();
  clear();
})();
