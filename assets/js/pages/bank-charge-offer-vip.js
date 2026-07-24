(function () {
  'use strict';
  var root = document.querySelector('[data-bank-charge-compare]');
  var engine = window.AfroTools && window.AfroTools.BankChargeOfferCompare;
  if (!root || !engine) return;
  var locale = root.dataset.locale || 'en';
  var t = {
    en: { context: 'Add one currency and comparison label.', activity: 'Use whole non-negative activity counts and a non-negative foreign-spend amount.', provider: 'Name both providers.', fee: 'Enter non-negative fees and a foreign transaction percentage from 0% to 100%.', evidence: 'Add a tariff source and checked date within 365 days for both providers.', ready: 'Comparison ready. No input left this browser.', changed: 'Inputs changed. Compare again.', exported: 'Local export created.', copied: 'Comparison copied locally.', equal: 'Same modeled cost', lower: 'Lower modeled cost' },
    fr: { context: 'Ajoutez une devise et un libell&eacute; de comparaison.', activity: 'Utilisez des nombres entiers positifs pour les activit&eacute;s et un montant positif pour les d&eacute;penses en devise.', provider: 'Nommez les deux fournisseurs.', fee: 'Saisissez des frais positifs et un pourcentage international de 0 % &agrave; 100 %.', evidence: 'Ajoutez une grille tarifaire et une date v&eacute;rifi&eacute;e dans les 365 jours pour chaque fournisseur.', ready: 'Comparaison pr&ecirc;te. Aucune saisie ne quitte ce navigateur.', changed: 'Les champs ont chang&eacute;. Comparez &agrave; nouveau.', exported: 'Export local cr&eacute;&eacute;.', copied: 'Comparaison copi&eacute;e localement.', equal: 'M&ecirc;me co&ucirc;t mod&eacute;lis&eacute;', lower: 'Co&ucirc;t mod&eacute;lis&eacute; inf&eacute;rieur' },
    ha: { context: 'Saka kudin kasa daya da sunan kwatanci.', activity: 'Yi amfani da cikakkun lambobi marasa kasa da sifili da adadin kudin waje mara kasa da sifili.', provider: 'Saka sunan masu bayarwa biyu.', fee: 'Saka kudade marasa kasa da sifili da kaso na kudin waje daga 0% zuwa 100%.', evidence: 'Saka tushen jadawalin kudi da ranar dubawa cikin kwanaki 365 ga kowanne.', ready: 'Kwatanci ya shirya. Babu bayanin da ya bar burauzar.', changed: 'An canza bayanai. Sake kwatantawa.', exported: 'An samar da fayil a na\'urarka.', copied: 'An kwafi kwatancin a na\'urarka.', equal: 'Kudin da aka kiyasta iri daya', lower: 'Kudin da aka kiyasta ya fi kasa' },
    sw: { context: 'Weka sarafu moja na ulinganisho na jina.', activity: 'Tumia idadi kamili zisizo hasi na shughuli na kiasi cha matumizi kisicho hasi.', provider: 'Taja watoa huduma wote wawili.', fee: 'Weka ada zisizo hasi na asilimia ya kimataifa kutoka 0% hadi 100%.', evidence: 'Weka chanzo cha ada na tarehe ya ukaguzi ndani ya siku 365 kwa kila mtoa huduma.', ready: 'Ulinganisho uko tayari. Hakuna taarifa iliyoondoka kwenye kivinjari.', changed: 'Taarifa zimebadilika. Linganisha tena.', exported: 'Faili ya ndani imeundwa.', copied: 'Ulinganisho umenakiliwa ndani ya kifaa.', equal: 'Gharama zilizokokotolewa ni sawa', lower: 'Gharama iliyokokotolewa ya chini' }
  }[locale];
  var current = null, form = document.getElementById('bco-form'), results = document.getElementById('bco-results'), error = document.getElementById('bco-error'), status = document.getElementById('bco-status'), actions = document.querySelectorAll('[data-bco-result-action]');
  function value(id) { return document.getElementById(id).value; }
  function input() { var data = { currency: value('bco-currency'), comparisonLabel: value('bco-label'), transfers: value('bco-transfers'), atmWithdrawals: value('bco-atm-count'), messages: value('bco-message-count'), internationalSpend: value('bco-international-spend') }; ['A', 'B'].forEach(function (suffix) { var lower = suffix.toLowerCase(); data['name' + suffix] = value('bco-name-' + lower); data['monthlyAccountFee' + suffix] = value('bco-monthly-' + lower); data['transferFee' + suffix] = value('bco-transfer-' + lower); data['atmFee' + suffix] = value('bco-atm-' + lower); data['messageFee' + suffix] = value('bco-message-' + lower); data['annualCardFee' + suffix] = value('bco-card-' + lower); data['internationalFeePct' + suffix] = value('bco-international-' + lower); data['otherMonthlyFee' + suffix] = value('bco-other-' + lower); data['evidenceLabel' + suffix] = value('bco-source-' + lower); data['evidenceDate' + suffix] = value('bco-date-' + lower); }); return data; }
  function money(number) { return (current ? current.currency : value('bco-currency').toUpperCase()) + ' ' + Number(number).toLocaleString(locale, { maximumFractionDigits: 2 }); }
  function setActions(enabled) { actions.forEach(function (button) { button.disabled = !enabled; }); }
  function clear(message) { current = null; results.hidden = true; setActions(false); error.textContent = ''; if (message) status.innerHTML = message; }
  function rows() { var labels = [root.dataset.accountLabel, root.dataset.transferLabel, root.dataset.atmLabel, root.dataset.messageLabel, root.dataset.cardLabel, root.dataset.internationalLabel, root.dataset.otherLabel, root.dataset.monthlyLabel]; var keys = ['account', 'transfers', 'withdrawals', 'messages', 'card', 'international', 'other']; return labels.map(function (label, index) { return index < keys.length ? [label, current.offerA.components[keys[index]], current.offerB.components[keys[index]]] : [label, current.offerA.monthlyTotal, current.offerB.monthlyTotal]; }); }
  function summary() { return root.dataset.pdfTitle + '\n' + current.comparisonLabel + '\n' + current.offerA.name + ': ' + money(current.offerA.monthlyTotal) + '\n' + current.offerB.name + ': ' + money(current.offerB.monthlyTotal) + '\n' + root.dataset.differenceLabel + ': ' + money(current.monthlyDifference); }
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var output = engine.calculate(input());
    if (!output.ok) {
      clear();
      error.innerHTML = output.error === 'invalid_context' ? t.context : output.error === 'invalid_activity' ? t.activity : output.error === 'invalid_provider' ? t.provider : output.error === 'invalid_evidence' ? t.evidence : t.fee;
      return;
    }
    current = output;
    error.textContent = '';
    document.getElementById('bco-a-monthly').textContent = money(output.offerA.monthlyTotal);
    document.getElementById('bco-b-monthly').textContent = money(output.offerB.monthlyTotal);
    document.getElementById('bco-difference').textContent = money(output.monthlyDifference);
    document.getElementById('bco-a-annual').textContent = money(output.offerA.annualTotal);
    document.getElementById('bco-b-annual').textContent = money(output.offerB.annualTotal);
    var lower = document.getElementById('bco-lower');
    lower.innerHTML = output.lowerModeledCost === 'equal' ? t.equal : t.lower + ': ';
    if (output.lowerModeledCost !== 'equal') lower.appendChild(document.createTextNode(output.lowerModeledCost === 'A' ? output.offerA.name : output.offerB.name));
    document.getElementById('bco-evidence').textContent = output.comparisonLabel + ' - ' + output.offerA.name + ': ' + output.offerA.evidenceLabel + ' (' + output.offerA.evidenceDate + ') - ' + output.offerB.name + ': ' + output.offerB.evidenceLabel + ' (' + output.offerB.evidenceDate + ')';
    var breakdown = document.getElementById('bco-breakdown');
    breakdown.replaceChildren();
    rows().forEach(function (row) {
      var tr = document.createElement('tr'), label = document.createElement('td'), offerA = document.createElement('td'), offerB = document.createElement('td');
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
    status.innerHTML = t.ready;
  });
  form.addEventListener('input', function () { if (current) clear(t.changed); }); form.addEventListener('change', function () { if (current) clear(t.changed); }); document.getElementById('bco-reset').addEventListener('click', function () { form.reset(); clear(); status.textContent = ''; });
  function download(name, type, content) { var url = URL.createObjectURL(new Blob([content], { type: type })), link = document.createElement('a'); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url); status.innerHTML = t.exported; }
  function csvCell(value) { var text = String(value); if (/^[=+\-@]/.test(text)) text = "'" + text; return '"' + text.replace(/"/g, '""') + '"'; }
  document.getElementById('bco-csv').addEventListener('click', function () { download('bank-charge-offer-comparison.csv', 'text/csv;charset=utf-8', [csvCell('Component'), csvCell(current.offerA.name), csvCell(current.offerB.name)].join(',') + '\n' + rows().map(function (row) { return row.map(csvCell).join(','); }).join('\n')); });
  document.getElementById('bco-json').addEventListener('click', function () { download('bank-charge-offer-comparison.json', 'application/json', JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), privacy: 'Private user-entered bank charge comparison.', comparison: current }, null, 2)); });
  document.getElementById('bco-copy').addEventListener('click', function () { var done = function () { status.innerHTML = t.copied; }, content = summary(); if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(content).then(done).catch(function () { window.prompt(root.dataset.copyPrompt, content); done(); }); else { window.prompt(root.dataset.copyPrompt, content); done(); } });
  document.getElementById('bco-pdf').addEventListener('click', async function () { if (!current) return; if (window.AfroTools && window.AfroTools.pdf) { await window.AfroTools.pdf.generate({ toolId: 'bank-charges', category: 'financial', title: root.dataset.pdfTitle, subtitle: current.comparisonLabel, noGate: true, skipGate: true, heroStats: [[current.offerA.name, money(current.offerA.monthlyTotal)], [current.offerB.name, money(current.offerB.monthlyTotal)], [root.dataset.differenceLabel, money(current.monthlyDifference)]], sections: [{ title: root.dataset.breakdownTitle, rows: rows().map(function (row) { return [row[0] + ' - ' + current.offerA.name, money(row[1]) + '; ' + current.offerB.name + ' ' + money(row[2])]; }) }], source: current.offerA.name + ': ' + current.offerA.evidenceLabel + ' - ' + current.offerA.evidenceDate + '; ' + current.offerB.name + ': ' + current.offerB.evidenceLabel + ' - ' + current.offerB.evidenceDate, disclaimer: root.dataset.pdfDisclaimer }); status.innerHTML = t.exported; } else window.print(); });
  clear();
})();
