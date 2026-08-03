(function () {
  'use strict';
  var root = document.querySelector('[data-car-loan]');
  var engine = window.AfroTools && window.AfroTools.CarLoanPlan;
  if (!root || !engine) return;

  var locale = root.dataset.locale || 'en';
  var translations = {
    en: {
      context:'Use a 3-8 letter currency code.',
      amount:'Enter non-negative amounts and a vehicle price above zero.',
      period:'Use a whole term from 1 to 360 months.',
      rate:'Use a non-negative nominal annual rate no greater than 1,000%.',
      evidence:'Add an offer source and checked date within 365 days.',
      structure:'Deposit and trade-in must leave a positive financed amount, and the balloon must be lower than that amount.',
      ready:'Loan plan ready. No input left this browser.',
      changed:'Inputs changed. Calculate again.',
      required:'Calculate a current loan plan before copying or exporting.',
      copied:'Plan copied locally.',
      copyFailed:'The plan could not be copied.',
      exported:'Local export created.',
      exportFailed:'The export could not be created.',
      month:'Month'
    },
    fr: {
      context:'Utilisez un code devise de 3 à 8 lettres.',
      amount:'Saisissez des montants non négatifs et un prix véhicule positif.',
      period:'Utilisez une durée entière de 1 à 360 mois.',
      rate:'Utilisez un taux annuel nominal non négatif limité à 1 000 %.',
      evidence:'Ajoutez la source de l’offre et une date vérifiée dans les 365 jours.',
      structure:'L’apport et la reprise doivent laisser un montant financé positif, et le ballon doit lui être inférieur.',
      ready:'Plan de prêt prêt. Aucune saisie ne quitte ce navigateur.',
      changed:'Champs modifiés. Recalculez.',
      required:'Calculez un plan actuel avant de copier ou exporter.',
      copied:'Plan copié localement.',
      copyFailed:'Le plan n’a pas pu être copié.',
      exported:'Export local créé.',
      exportFailed:'L’export n’a pas pu être créé.',
      month:'Mois'
    },
    sw: {
      context:'Tumia msimbo wa sarafu wa herufi 3 hadi 8.',
      amount:'Weka kiasi kisicho hasi na bei ya gari zaidi ya sifuri.',
      period:'Tumia muda kamili wa miezi 1 hadi 360.',
      rate:'Tumia kiwango cha mwaka kisicho hasi na kisichozidi 1,000%.',
      evidence:'Weka chanzo cha ofa na tarehe ya ukaguzi ndani ya siku 365.',
      structure:'Amana na thamani ya gari la kubadilisha lazima ziache mkopo chanya, na malipo ya mwisho yawe chini ya mkopo huo.',
      ready:'Mpango wa mkopo uko tayari. Hakuna taarifa iliyoondoka kwenye kivinjari.',
      changed:'Taarifa zimebadilika. Kokotoa tena.',
      required:'Kokotoa mpango wa sasa kabla ya kunakili au kuhamisha.',
      copied:'Mpango umenakiliwa ndani ya kifaa.',
      copyFailed:'Mpango haukuweza kunakiliwa.',
      exported:'Faili ya ndani imeundwa.',
      exportFailed:'Faili haikuweza kuundwa.',
      month:'Mwezi'
    }
  };
  var t = translations[locale] || translations.en;
  var form = document.getElementById('cl-form');
  var results = document.getElementById('cl-results');
  var error = document.getElementById('cl-error');
  var status = document.getElementById('cl-status');
  var actions = document.querySelectorAll('[data-cl-action]');
  var current = null;
  var currentSignature = null;
  var requestId = 0;

  function value(id) {
    return document.getElementById(id).value;
  }
  function input() {
    return {
      currency:value('cl-currency'),
      vehiclePrice:value('cl-price'),
      deposit:value('cl-deposit'),
      tradeIn:value('cl-trade'),
      financedFees:value('cl-fees'),
      annualRate:value('cl-rate'),
      months:value('cl-months'),
      balloon:value('cl-balloon'),
      monthlyNetIncome:value('cl-income'),
      otherMonthlyDebt:value('cl-debts'),
      monthlyInsurance:value('cl-insurance'),
      monthlyFuel:value('cl-fuel'),
      monthlyMaintenance:value('cl-maintenance'),
      otherMonthlyVehicleCost:value('cl-other'),
      offerSource:value('cl-source'),
      sourceDate:value('cl-date')
    };
  }
  function signature() {
    return JSON.stringify(input());
  }
  function money(number) {
    try {
      return new Intl.NumberFormat(locale, {
        style:'currency', currency:current.currency, maximumFractionDigits:2
      }).format(number);
    } catch (ignored) {
      return current.currency + ' ' + Number(number).toLocaleString(locale, {
        maximumFractionDigits:2
      });
    }
  }
  function setActions(enabled) {
    actions.forEach(function (button) { button.disabled = !enabled; });
  }
  function clearResultDom() {
    ['cl-principal', 'cl-payment', 'cl-finance', 'cl-operating', 'cl-monthly-total',
      'cl-outlay', 'cl-debt-load', 'cl-cash-after'].forEach(function (id) {
      document.getElementById(id).textContent = '--';
    });
    document.getElementById('cl-evidence').textContent = '';
    document.getElementById('cl-schedule').replaceChildren();
  }
  function clear(message) {
    requestId += 1;
    current = null;
    currentSignature = null;
    results.hidden = true;
    setActions(false);
    clearResultDom();
    error.textContent = '';
    status.textContent = message || '';
  }
  function markStale() {
    var hadResult = Boolean(current || !results.hidden);
    clear(hadResult ? t.changed : '');
  }
  function usableCurrent() {
    if (!current || currentSignature !== signature()) {
      clear(current ? t.changed : t.required);
      return false;
    }
    return true;
  }
  function summary() {
    return [
      root.dataset.pdfTitle,
      current.offerSource + ' · ' + current.sourceDate,
      root.dataset.principalLabel + ': ' + money(current.principal),
      root.dataset.paymentLabel + ': ' + money(current.monthlyPayment),
      root.dataset.financeLabel + ': ' + money(current.totalFinanceCost),
      root.dataset.outlayLabel + ': ' + money(current.modeledOutlay)
    ].join('\n');
  }
  function csvCell(value) {
    var text = String(value);
    if (/^[=+\-@]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }
  function download(name, type, content) {
    var url = URL.createObjectURL(new Blob([content], { type:type }));
    var link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    status.textContent = t.exported;
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    clear();
    var output = engine.calculate(input());
    if (!output.ok) {
      error.textContent = output.error === 'invalid_context' ? t.context
        : output.error === 'invalid_amount' ? t.amount
          : output.error === 'invalid_period' ? t.period
            : output.error === 'invalid_rate' ? t.rate
              : output.error === 'invalid_evidence' ? t.evidence : t.structure;
      return;
    }
    current = output;
    currentSignature = signature();
    [
      ['cl-principal',output.principal],
      ['cl-payment',output.monthlyPayment],
      ['cl-finance',output.totalFinanceCost],
      ['cl-operating',output.monthlyOperatingCost],
      ['cl-monthly-total',output.monthlyVehicleCost],
      ['cl-outlay',output.modeledOutlay],
      ['cl-cash-after',output.cashAfterVehicle]
    ].forEach(function (pair) {
      document.getElementById(pair[0]).textContent =
        pair[1] === null ? root.dataset.notEntered : money(pair[1]);
    });
    document.getElementById('cl-debt-load').textContent =
      output.debtLoadPercent === null ? root.dataset.notEntered
        : output.debtLoadPercent.toFixed(1) + '%';
    document.getElementById('cl-evidence').textContent =
      output.offerSource + ' · ' + output.sourceDate + ' · ' + output.annualRate + '%';
    var body = document.getElementById('cl-schedule');
    output.schedule.forEach(function (row) {
      var tr = document.createElement('tr');
      [row.month, money(row.payment), money(row.principal), money(row.interest),
        money(row.balance)].forEach(function (item) {
        var td = document.createElement('td');
        td.textContent = item;
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
    results.hidden = false;
    setActions(true);
    status.textContent = t.ready;
    results.setAttribute('tabindex', '-1');
    results.focus({ preventScroll:true });
  });
  form.addEventListener('input', markStale);
  form.addEventListener('change', markStale);
  form.addEventListener('invalid', function () {
    clear();
    error.textContent = t.amount;
  }, true);
  document.getElementById('cl-reset').addEventListener('click', function () {
    form.reset();
    clear();
  });
  document.getElementById('cl-copy').addEventListener('click', async function () {
    if (!usableCurrent()) return;
    var token = requestId;
    var receipt = summary();
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('clipboard');
      await navigator.clipboard.writeText(receipt);
      if (token !== requestId || !current || receipt !== summary()) return;
      status.textContent = t.copied;
    } catch (copyError) {
      if (token !== requestId || !current) return;
      status.textContent = t.copyFailed;
    }
  });
  document.getElementById('cl-csv').addEventListener('click', function () {
    if (!usableCurrent()) return;
    download('car-loan-amortization.csv', 'text/csv;charset=utf-8',
      [['month', 'payment', 'principal', 'interest', 'balance'].map(csvCell).join(',')]
        .concat(current.schedule.map(function (row) {
          return [row.month, row.payment, row.principal, row.interest,
            row.balance].map(csvCell).join(',');
        })).join('\n'));
  });
  document.getElementById('cl-json').addEventListener('click', function () {
    if (!usableCurrent()) return;
    download('car-loan-plan.json', 'application/json',
      JSON.stringify({
        schemaVersion:1,
        exportedAt:new Date().toISOString(),
        privacy:'Local user-entered vehicle finance plan.',
        plan:current
      }, null, 2));
  });
  document.getElementById('cl-pdf').addEventListener('click', async function () {
    if (!usableCurrent()) return;
    if (!window.AfroTools || !window.AfroTools.pdf) {
      status.textContent = t.exportFailed;
      return;
    }
    var token = requestId;
    try {
      await window.AfroTools.pdf.generate({
        toolId:'car-loan',
        category:'financial',
        title:root.dataset.pdfTitle,
        subtitle:current.offerSource + ' · ' + current.sourceDate,
        noGate: true,
        skipGate: true,
        heroStats:[
          [root.dataset.paymentLabel, money(current.monthlyPayment)],
          [root.dataset.financeLabel, money(current.totalFinanceCost)],
          [root.dataset.outlayLabel, money(current.modeledOutlay)]
        ],
        sections:[{
          title:root.dataset.scheduleTitle,
          rows:current.schedule.map(function (row) {
            return [t.month + ' ' + row.month,
              money(row.payment) + ' / ' + money(row.interest) + ' / ' + money(row.balance)];
          })
        }],
        source:current.offerSource + ' · ' + current.sourceDate,
        disclaimer:root.dataset.pdfDisclaimer
      });
      if (token === requestId && current) status.textContent = t.exported;
    } catch (pdfError) {
      if (token === requestId && current) status.textContent = t.exportFailed;
    }
  });
  clear();
})();
