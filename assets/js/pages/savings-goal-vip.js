(function () {
  'use strict';
  var root = document.querySelector('[data-savings-goal]');
  var engine = window.AfroTools && window.AfroTools.SavingsGoalPlan;
  if (!root || !engine) return;

  var locale = root.dataset.locale || 'en';
  var translations = {
    en: {
      context:'Use a 3-8 letter currency code.',
      amount:'Use a goal above zero and non-negative savings and contribution amounts.',
      period:'Use a whole number from 1 to 1,200 months.',
      rate:'Use an annual rate above -100% and no more than 1,000%.',
      evidence:'Add an assumption source and checked date within 365 days.',
      ready:'Plan ready. No input left this browser.',
      changed:'Inputs changed. Calculate again.',
      required:'Calculate a current plan before copying or exporting.',
      copied:'Plan copied locally.',
      copyFailed:'The plan could not be copied.',
      exported:'Local export created.',
      exportFailed:'The export could not be created.',
      month:'Month'
    },
    fr: {
      context:'Utilisez un code devise de 3 à 8 lettres.',
      amount:'Utilisez un objectif positif et des montants d’épargne et de versement non négatifs.',
      period:'Utilisez un nombre entier de 1 à 1 200 mois.',
      rate:'Utilisez un taux annuel supérieur à -100 % et limité à 1 000 %.',
      evidence:'Ajoutez une source d’hypothèse et une date vérifiée dans les 365 jours.',
      ready:'Plan prêt. Aucune saisie ne quitte ce navigateur.',
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
      amount:'Tumia lengo zaidi ya sifuri na akiba pamoja na mchango usio hasi.',
      period:'Tumia idadi kamili ya miezi 1 hadi 1,200.',
      rate:'Tumia kiwango cha mwaka zaidi ya -100% na kisichozidi 1,000%.',
      evidence:'Weka chanzo cha dhana na tarehe ya ukaguzi ndani ya siku 365.',
      ready:'Mpango uko tayari. Hakuna taarifa iliyoondoka kwenye kivinjari.',
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
  var form = document.getElementById('sgv-form');
  var results = document.getElementById('sgv-results');
  var error = document.getElementById('sgv-error');
  var status = document.getElementById('sgv-status');
  var actions = document.querySelectorAll('[data-sgv-action]');
  var current = null;
  var currentSignature = null;
  var requestId = 0;

  function value(id) {
    return document.getElementById(id).value;
  }
  function input() {
    return {
      currency:value('sgv-currency'),
      goal:value('sgv-goal'),
      currentSavings:value('sgv-current'),
      monthlyContribution:value('sgv-contribution'),
      months:value('sgv-months'),
      annualRate:value('sgv-rate'),
      rateSource:value('sgv-source'),
      sourceDate:value('sgv-date')
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
    ['sgv-ending', 'sgv-contributed', 'sgv-growth', 'sgv-gap', 'sgv-required',
      'sgv-progress-label'].forEach(function (id) {
      document.getElementById(id).textContent = '--';
    });
    document.getElementById('sgv-evidence').textContent = '';
    document.getElementById('sgv-progress-fill').style.width = '0%';
    document.getElementById('sgv-timeline').replaceChildren();
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
      current.rateSource + ' · ' + current.sourceDate,
      root.dataset.goalLabel + ': ' + money(current.goal),
      root.dataset.endingLabel + ': ' + money(current.endingBalance),
      root.dataset.requiredLabel + ': ' + money(current.requiredMonthlyContribution)
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
            : output.error === 'invalid_rate' ? t.rate : t.evidence;
      return;
    }
    current = output;
    currentSignature = signature();
    document.getElementById('sgv-ending').textContent = money(output.endingBalance);
    document.getElementById('sgv-contributed').textContent = money(output.totalContributed);
    document.getElementById('sgv-growth').textContent = money(output.modeledGrowth);
    document.getElementById('sgv-gap').textContent = money(output.gap);
    document.getElementById('sgv-required').textContent = money(output.requiredMonthlyContribution);
    document.getElementById('sgv-progress-label').textContent = output.progress.toFixed(1) + '%';
    document.getElementById('sgv-progress-fill').style.width = output.progress + '%';
    document.getElementById('sgv-evidence').textContent =
      output.rateSource + ' · ' + output.sourceDate + ' · ' + output.annualRate + '%';
    var body = document.getElementById('sgv-timeline');
    output.timeline.forEach(function (row) {
      var tr = document.createElement('tr');
      [row.month, money(row.totalContributed), money(row.balance)].forEach(function (item) {
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
  document.getElementById('sgv-reset').addEventListener('click', function () {
    form.reset();
    clear();
  });
  document.getElementById('sgv-copy').addEventListener('click', async function () {
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
  document.getElementById('sgv-csv').addEventListener('click', function () {
    if (!usableCurrent()) return;
    download('savings-goal-plan.csv', 'text/csv;charset=utf-8',
      [['month', 'total_contributed', 'modeled_balance'].map(csvCell).join(',')]
        .concat(current.timeline.map(function (row) {
          return [row.month, row.totalContributed, row.balance].map(csvCell).join(',');
        })).join('\n'));
  });
  document.getElementById('sgv-json').addEventListener('click', function () {
    if (!usableCurrent()) return;
    download('savings-goal-plan.json', 'application/json',
      JSON.stringify({
        schemaVersion:1,
        exportedAt:new Date().toISOString(),
        privacy:'Local user-entered savings plan.',
        plan:current
      }, null, 2));
  });
  document.getElementById('sgv-pdf').addEventListener('click', async function () {
    if (!usableCurrent()) return;
    if (!window.AfroTools || !window.AfroTools.pdf) {
      status.textContent = t.exportFailed;
      return;
    }
    var token = requestId;
    try {
      await window.AfroTools.pdf.generate({
        toolId:'savings-goal',
        category:'financial',
        title:root.dataset.pdfTitle,
        subtitle:current.rateSource + ' · ' + current.sourceDate,
        noGate: true,
        skipGate: true,
        heroStats:[
          [root.dataset.endingLabel, money(current.endingBalance)],
          [root.dataset.requiredLabel, money(current.requiredMonthlyContribution)],
          [root.dataset.gapLabel, money(current.gap)]
        ],
        sections:[{
          title:root.dataset.timelineTitle,
          rows:current.timeline.map(function (row) {
            return [t.month + ' ' + row.month,
              money(row.totalContributed) + ' / ' + money(row.balance)];
          })
        }],
        source:current.rateSource + ' · ' + current.sourceDate,
        disclaimer:root.dataset.pdfDisclaimer
      });
      if (token === requestId && current) status.textContent = t.exported;
    } catch (pdfError) {
      if (token === requestId && current) status.textContent = t.exportFailed;
    }
  });
  clear();
})();
