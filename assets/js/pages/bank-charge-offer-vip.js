(function () {
  'use strict';
  var root = document.querySelector('[data-bank-charge-compare]');
  var engine = window.AfroTools && window.AfroTools.BankChargeOfferCompare;
  if (!root || !engine) return;

  var locale = root.dataset.locale || 'en';
  var translations = {
    en: {
      context:'Add one currency and comparison label.',
      activity:'Use whole non-negative activity counts and a non-negative foreign-spend amount.',
      provider:'Name both providers.',
      fee:'Enter non-negative fees and a foreign transaction percentage from 0% to 100%.',
      evidence:'Add a tariff source and checked date within 365 days for both providers.',
      ready:'Comparison ready. No input left this browser.',
      changed:'Inputs changed. Compare again.',
      required:'Create a current comparison before copying or exporting.',
      exported:'Local export created.',
      exportFailed:'The export could not be created.',
      copied:'Comparison copied locally.',
      copyFailed:'The comparison could not be copied.',
      equal:'Same modeled cost',
      lower:'Lower modeled cost'
    },
    fr: {
      context:'Ajoutez une devise et un libellé de comparaison.',
      activity:'Utilisez des nombres entiers non négatifs pour les activités et un montant non négatif pour les dépenses en devise.',
      provider:'Nommez les deux fournisseurs.',
      fee:'Saisissez des frais non négatifs et un pourcentage international de 0 % à 100 %.',
      evidence:'Ajoutez une grille tarifaire et une date vérifiée dans les 365 jours pour chaque fournisseur.',
      ready:'Comparaison prête. Aucune saisie ne quitte ce navigateur.',
      changed:'Les champs ont changé. Comparez à nouveau.',
      required:'Créez une comparaison actuelle avant de copier ou exporter.',
      exported:'Export local créé.',
      exportFailed:'L’export n’a pas pu être créé.',
      copied:'Comparaison copiée localement.',
      copyFailed:'La comparaison n’a pas pu être copiée.',
      equal:'Même coût modélisé',
      lower:'Coût modélisé inférieur'
    },
    ha: {
      context:'Saka kudin kasa daya da sunan kwatanci.',
      activity:'Yi amfani da cikakkun lambobi marasa kasa da sifili da adadin kudin waje mara kasa da sifili.',
      provider:'Saka sunan masu bayarwa biyu.',
      fee:'Saka kudade marasa kasa da sifili da kaso na kudin waje daga 0% zuwa 100%.',
      evidence:'Saka tushen jadawalin kudi da ranar dubawa cikin kwanaki 365 ga kowanne.',
      ready:'Kwatanci ya shirya. Babu bayanin da ya bar burauzar.',
      changed:'An canza bayanai. Sake kwatantawa.',
      required:'Yi kwatanci na yanzu kafin kwafi ko fitarwa.',
      exported:'An samar da fayil a na’urarka.',
      exportFailed:'Ba a iya samar da fayil ba.',
      copied:'An kwafi kwatancin a na’urarka.',
      copyFailed:'Ba a iya kwafi kwatancin ba.',
      equal:'Kudin da aka kiyasta iri daya',
      lower:'Kudin da aka kiyasta ya fi kasa'
    },
    sw: {
      context:'Weka sarafu moja na jina la ulinganisho.',
      activity:'Tumia idadi kamili zisizo hasi za shughuli na kiasi cha matumizi kisicho hasi.',
      provider:'Taja watoa huduma wote wawili.',
      fee:'Weka ada zisizo hasi na asilimia ya kimataifa kutoka 0% hadi 100%.',
      evidence:'Weka chanzo cha ada na tarehe ya ukaguzi ndani ya siku 365 kwa kila mtoa huduma.',
      ready:'Ulinganisho uko tayari. Hakuna taarifa iliyoondoka kwenye kivinjari.',
      changed:'Taarifa zimebadilika. Linganisha tena.',
      required:'Tengeneza ulinganisho wa sasa kabla ya kunakili au kuhamisha.',
      exported:'Faili ya ndani imeundwa.',
      exportFailed:'Faili haikuweza kuundwa.',
      copied:'Ulinganisho umenakiliwa ndani ya kifaa.',
      copyFailed:'Ulinganisho haukuweza kunakiliwa.',
      equal:'Gharama zilizokokotolewa ni sawa',
      lower:'Gharama iliyokokotolewa ya chini'
    }
  };
  var t = translations[locale] || translations.en;
  var form = document.getElementById('bco-form');
  var results = document.getElementById('bco-results');
  var error = document.getElementById('bco-error');
  var status = document.getElementById('bco-status');
  var actions = document.querySelectorAll('[data-bco-result-action]');
  var breakdown = document.getElementById('bco-breakdown');
  var initialHeadA = document.getElementById('bco-head-a').textContent;
  var initialHeadB = document.getElementById('bco-head-b').textContent;
  var current = null;
  var currentSignature = null;
  var requestId = 0;

  function value(id) {
    return document.getElementById(id).value;
  }
  function input() {
    var data = {
      currency:value('bco-currency'),
      comparisonLabel:value('bco-label'),
      transfers:value('bco-transfers'),
      atmWithdrawals:value('bco-atm-count'),
      messages:value('bco-message-count'),
      internationalSpend:value('bco-international-spend')
    };
    ['A', 'B'].forEach(function (suffix) {
      var lower = suffix.toLowerCase();
      data['name' + suffix] = value('bco-name-' + lower);
      data['monthlyAccountFee' + suffix] = value('bco-monthly-' + lower);
      data['transferFee' + suffix] = value('bco-transfer-' + lower);
      data['atmFee' + suffix] = value('bco-atm-' + lower);
      data['messageFee' + suffix] = value('bco-message-' + lower);
      data['annualCardFee' + suffix] = value('bco-card-' + lower);
      data['internationalFeePct' + suffix] = value('bco-international-' + lower);
      data['otherMonthlyFee' + suffix] = value('bco-other-' + lower);
      data['evidenceLabel' + suffix] = value('bco-source-' + lower);
      data['evidenceDate' + suffix] = value('bco-date-' + lower);
    });
    return data;
  }
  function signature() {
    return JSON.stringify(input());
  }
  function money(number) {
    var currency = current ? current.currency : value('bco-currency').toUpperCase();
    return currency + ' ' + Number(number).toLocaleString(locale, { maximumFractionDigits:2 });
  }
  function setActions(enabled) {
    actions.forEach(function (button) { button.disabled = !enabled; });
  }
  function clearResultDom() {
    ['bco-a-monthly', 'bco-b-monthly', 'bco-difference', 'bco-a-annual',
      'bco-b-annual', 'bco-lower'].forEach(function (id) {
      document.getElementById(id).textContent = '--';
    });
    document.getElementById('bco-evidence').textContent = '';
    document.getElementById('bco-head-a').textContent = initialHeadA;
    document.getElementById('bco-head-b').textContent = initialHeadB;
    breakdown.replaceChildren();
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
  function rows() {
    var labels = [
      root.dataset.accountLabel,
      root.dataset.transferLabel,
      root.dataset.atmLabel,
      root.dataset.messageLabel,
      root.dataset.cardLabel,
      root.dataset.internationalLabel,
      root.dataset.otherLabel,
      root.dataset.monthlyLabel
    ];
    var keys = ['account', 'transfers', 'withdrawals', 'messages', 'card',
      'international', 'other'];
    return labels.map(function (label, index) {
      return index < keys.length
        ? [label, current.offerA.components[keys[index]], current.offerB.components[keys[index]]]
        : [label, current.offerA.monthlyTotal, current.offerB.monthlyTotal];
    });
  }
  function summary() {
    return [
      root.dataset.pdfTitle,
      current.comparisonLabel,
      current.offerA.name + ': ' + money(current.offerA.monthlyTotal),
      current.offerB.name + ': ' + money(current.offerB.monthlyTotal),
      root.dataset.differenceLabel + ': ' + money(current.monthlyDifference)
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
        : output.error === 'invalid_activity' ? t.activity
          : output.error === 'invalid_provider' ? t.provider
            : output.error === 'invalid_evidence' ? t.evidence : t.fee;
      return;
    }
    current = output;
    currentSignature = signature();
    document.getElementById('bco-a-monthly').textContent = money(output.offerA.monthlyTotal);
    document.getElementById('bco-b-monthly').textContent = money(output.offerB.monthlyTotal);
    document.getElementById('bco-difference').textContent = money(output.monthlyDifference);
    document.getElementById('bco-a-annual').textContent = money(output.offerA.annualTotal);
    document.getElementById('bco-b-annual').textContent = money(output.offerB.annualTotal);
    var lower = document.getElementById('bco-lower');
    lower.textContent = output.lowerModeledCost === 'equal' ? t.equal
      : t.lower + ': ' + (output.lowerModeledCost === 'A'
        ? output.offerA.name : output.offerB.name);
    document.getElementById('bco-evidence').textContent =
      output.comparisonLabel + ' · ' + output.offerA.name + ': '
      + output.offerA.evidenceLabel + ' (' + output.offerA.evidenceDate + ') · '
      + output.offerB.name + ': ' + output.offerB.evidenceLabel + ' ('
      + output.offerB.evidenceDate + ')';
    rows().forEach(function (row) {
      var tr = document.createElement('tr');
      var label = document.createElement('td');
      var offerA = document.createElement('td');
      var offerB = document.createElement('td');
      label.textContent = row[0];
      offerA.dataset.offerA = output.offerA.name;
      offerA.textContent = money(row[1]);
      offerB.dataset.offerB = output.offerB.name;
      offerB.textContent = money(row[2]);
      tr.append(label, offerA, offerB);
      breakdown.appendChild(tr);
    });
    document.getElementById('bco-head-a').textContent = output.offerA.name;
    document.getElementById('bco-head-b').textContent = output.offerB.name;
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
    error.textContent = t.context;
  }, true);
  document.getElementById('bco-reset').addEventListener('click', function () {
    form.reset();
    clear();
  });
  document.getElementById('bco-copy').addEventListener('click', async function () {
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
  document.getElementById('bco-csv').addEventListener('click', function () {
    if (!usableCurrent()) return;
    download('bank-charge-offer-comparison.csv', 'text/csv;charset=utf-8',
      [csvCell('Component'), csvCell(current.offerA.name),
        csvCell(current.offerB.name)].join(',') + '\n'
      + rows().map(function (row) { return row.map(csvCell).join(','); }).join('\n'));
  });
  document.getElementById('bco-json').addEventListener('click', function () {
    if (!usableCurrent()) return;
    download('bank-charge-offer-comparison.json', 'application/json',
      JSON.stringify({
        schemaVersion:1,
        exportedAt:new Date().toISOString(),
        privacy:'Private user-entered bank charge comparison.',
        comparison:current
      }, null, 2));
  });
  document.getElementById('bco-pdf').addEventListener('click', async function () {
    if (!usableCurrent()) return;
    if (!window.AfroTools || !window.AfroTools.pdf) {
      status.textContent = t.exportFailed;
      return;
    }
    var token = requestId;
    try {
      await window.AfroTools.pdf.generate({
        toolId:'bank-charges',
        category:'financial',
        title:root.dataset.pdfTitle,
        subtitle:current.comparisonLabel,
        noGate: true,
        skipGate: true,
        heroStats:[
          [current.offerA.name, money(current.offerA.monthlyTotal)],
          [current.offerB.name, money(current.offerB.monthlyTotal)],
          [root.dataset.differenceLabel, money(current.monthlyDifference)]
        ],
        sections:[{
          title:root.dataset.breakdownTitle,
          rows:rows().map(function (row) {
            return [row[0] + ' - ' + current.offerA.name,
              money(row[1]) + '; ' + current.offerB.name + ' ' + money(row[2])];
          })
        }],
        source:current.offerA.name + ': ' + current.offerA.evidenceLabel + ' - '
          + current.offerA.evidenceDate + '; ' + current.offerB.name + ': '
          + current.offerB.evidenceLabel + ' - ' + current.offerB.evidenceDate,
        disclaimer:root.dataset.pdfDisclaimer
      });
      if (token === requestId && current) status.textContent = t.exported;
    } catch (pdfError) {
      if (token === requestId && current) status.textContent = t.exportFailed;
    }
  });
  clear();
})();
