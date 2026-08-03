(function () {
  'use strict';

  var root = document.querySelector('[data-inflation-scenario]');
  var engine = window.AfroTools && window.AfroTools.InflationScenario;
  if (!root || !engine) return;

  var locale = ['en', 'fr', 'sw'].includes(root.dataset.locale) ? root.dataset.locale : 'en';
  var t = {
    en: {
      context:'Use a 3-8 letter currency code.', amount:'Enter an amount above zero.', rate:'Enter an annual rate above -100% and no more than 1,000%.',
      period:'Enter a period above zero and no more than 100 years.', evidence:'Add a source label and a checked date within the last 365 days.',
      ready:'Scenario ready. No input left this browser.', changed:'Inputs changed. Calculate again.', exported:'Local export created.',
      copied:'Summary copied locally.', copyFailed:'Copy is unavailable. Use the displayed local summary.', pdfUnavailable:'PDF creation is unavailable.', year:'Year',
      csvYear:'year', csvPrice:'price_equivalent', csvPower:'purchasing_power', csvFile:'inflation-scenario.csv', jsonFile:'inflation-scenario.json',
      jsonPrivacy:'Local user-entered inflation scenario.'
    },
    fr: {
      context:'Utilisez un code devise de 3 à 8 lettres.', amount:'Saisissez un montant supérieur à zéro.', rate:'Saisissez un taux annuel supérieur à -100 % et inférieur ou égal à 1 000 %.',
      period:'Saisissez une période supérieure à zéro et limitée à 100 ans.', evidence:'Ajoutez une source et une date vérifiée au cours des 365 derniers jours.',
      ready:'Scénario prêt. Aucune saisie ne quitte ce navigateur.', changed:'Les champs ont changé. Recalculez.', exported:'Export local créé.',
      copied:'Résumé copié localement.', copyFailed:'La copie est indisponible. Utilisez le résumé local affiché.', pdfUnavailable:'La création du PDF est indisponible.', year:'Année',
      csvYear:'année', csvPrice:'prix_équivalent', csvPower:'pouvoir_achat', csvFile:'scenario-inflation.csv', jsonFile:'scenario-inflation.json',
      jsonPrivacy:'Scénario d’inflation saisi et exporté localement.'
    },
    sw: {
      context:'Tumia msimbo wa sarafu wenye herufi 3 hadi 8.', amount:'Ingiza kiasi kikubwa kuliko sifuri.', rate:'Ingiza kiwango cha mwaka kilicho juu ya -100% na kisichozidi 1,000%.',
      period:'Ingiza muda ulio juu ya sifuri na usiozidi miaka 100.', evidence:'Ongeza jina la chanzo na tarehe ya ukaguzi iliyo ndani ya siku 365 zilizopita.',
      ready:'Hali ya makadirio iko tayari. Hakuna taarifa iliyoondoka kwenye kivinjari hiki.', changed:'Taarifa zimebadilika. Kokotoa tena.', exported:'Faili imeundwa kwenye kifaa chako.',
      copied:'Muhtasari umenakiliwa kwenye kifaa chako.', copyFailed:'Kunakili hakupatikani. Tumia muhtasari wa ndani unaoonekana.', pdfUnavailable:'Uundaji wa PDF haupatikani.', year:'Mwaka',
      csvYear:'mwaka', csvPrice:'bei_sawa', csvPower:'uwezo_wa_kununua', csvFile:'hali-ya-mfumuko-wa-bei.csv', jsonFile:'hali-ya-mfumuko-wa-bei.json',
      jsonPrivacy:'Hali ya mfumuko wa bei iliyoingizwa na mtumiaji na kuhifadhiwa kwenye kifaa.', pdfFile:'hali-ya-mfumuko-wa-bei.pdf'
    }
  }[locale];

  var form = document.getElementById('ic-form');
  var results = document.getElementById('ic-results');
  var error = document.getElementById('ic-error');
  var status = document.getElementById('ic-status');
  var timeline = document.getElementById('ic-timeline');
  var actions = Array.from(document.querySelectorAll('[data-ic-action]'));
  if (locale === 'fr') actions.forEach(function (button) { button.dataset.noPdfGate = 'true'; });
  var current = null;
  var currentSignature = null;

  function val(id) { return document.getElementById(id).value; }
  function input() {
    return {
      currency:val('ic-currency'), amount:val('ic-amount'), annualRate:val('ic-rate'), years:val('ic-years'),
      sourceLabel:val('ic-source'), sourceDate:val('ic-date')
    };
  }
  function signature(value) { return JSON.stringify(value || input()); }
  function isCurrent() { return Boolean(current && currentSignature === signature()); }
  function money(value) {
    try { return new Intl.NumberFormat(locale, { style:'currency', currency:current.currency, maximumFractionDigits:2 }).format(value); }
    catch (_) { return current.currency + ' ' + Number(value).toLocaleString(locale, { maximumFractionDigits:2 }); }
  }
  function setActions(enabled) { actions.forEach(function (button) { button.disabled = !enabled; }); }
  function clear(message, errorMessage) {
    current = null;
    currentSignature = null;
    results.hidden = true;
    setActions(false);
    ['ic-future', 'ic-power', 'ic-change', 'ic-increase'].forEach(function (id) { document.getElementById(id).textContent = '—'; });
    document.getElementById('ic-evidence').textContent = '';
    timeline.replaceChildren();
    status.textContent = message || '';
    error.textContent = errorMessage || '';
  }
  function summary() {
    return root.dataset.pdfTitle + '\n' + root.dataset.sourceLabel + ': ' + current.sourceLabel + ' (' + current.sourceDate + ')\n' +
      root.dataset.amountLabel + ': ' + money(current.amount) + '\n' + root.dataset.rateLabel + ': ' + current.annualRate + '%\n' +
      root.dataset.yearsLabel + ': ' + current.years + '\n' + root.dataset.futureLabel + ': ' + money(current.priceEquivalent) + '\n' +
      root.dataset.powerLabel + ': ' + money(current.purchasingPower);
  }
  function invalidMessage(code) {
    return code === 'invalid_context' ? t.context : code === 'invalid_amount' ? t.amount : code === 'invalid_rate' ? t.rate : code === 'invalid_period' ? t.period : t.evidence;
  }
  function render(out) {
    current = out;
    currentSignature = signature();
    error.textContent = '';
    document.getElementById('ic-future').textContent = money(out.priceEquivalent);
    document.getElementById('ic-power').textContent = money(out.purchasingPower);
    document.getElementById('ic-change').textContent = money(out.purchasingPowerChange);
    document.getElementById('ic-increase').textContent = money(out.requiredIncrease);
    document.getElementById('ic-evidence').textContent = out.sourceLabel + ' · ' + out.sourceDate + ' · ' + out.annualRate + '%';
    timeline.replaceChildren();
    out.timeline.forEach(function (row) {
      var tr = document.createElement('tr');
      [row.year, money(row.priceEquivalent), money(row.purchasingPower)].forEach(function (value) {
        var td = document.createElement('td'); td.textContent = value; tr.appendChild(td);
      });
      timeline.appendChild(tr);
    });
    results.hidden = false;
    setActions(true);
    status.textContent = t.ready;
    var title = document.getElementById('ic-results-title');
    if (title) title.focus();
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var out = engine.calculate(input());
    if (!out.ok) { clear('', invalidMessage(out.error)); return; }
    render(out);
  });
  function markStale() { if (current && !isCurrent()) clear(t.changed); }
  form.addEventListener('input', markStale);
  form.addEventListener('change', markStale);
  document.getElementById('ic-reset').addEventListener('click', function () { form.reset(); clear(); });

  function cell(value) {
    var string = String(value);
    if (/^[=+\-@]/.test(string)) string = "'" + string;
    return '"' + string.replace(/"/g, '""') + '"';
  }
  function download(name, type, content) {
    var url = URL.createObjectURL(new Blob([content], { type:type }));
    var link = document.createElement('a');
    link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    status.textContent = t.exported;
  }
  async function generateSwahiliPdf() {
    await window.AfroTools.pdf.loadJsPDF();
    var doc = new window.jspdf.jsPDF({ unit:'mm', format:'a4' });
    var y = 18;
    function line(text, size, bold) {
      doc.setFontSize(size || 10); doc.setFont('helvetica', bold ? 'bold' : 'normal');
      var rows = doc.splitTextToSize(String(text), 170); doc.text(rows, 20, y); y += rows.length * (size >= 14 ? 7 : 5) + 2;
    }
    line('AFROTOOLS', 14, true);
    line(root.dataset.pdfTitle, 16, true);
    line(root.dataset.sourceLabel + ': ' + current.sourceLabel + ' - ' + current.sourceDate, 9, false);
    y += 2;
    line(root.dataset.futureLabel + ': ' + money(current.priceEquivalent), 11, true);
    line(root.dataset.powerLabel + ': ' + money(current.purchasingPower), 11, true);
    line(root.dataset.rateLabel + ': ' + current.annualRate + '%', 10, false);
    line(root.dataset.timelineTitle, 11, true);
    current.timeline.forEach(function (row) { line(t.year + ' ' + row.year + ': ' + money(row.priceEquivalent) + ' / ' + money(row.purchasingPower), 9, false); });
    y += 2;
    line(root.dataset.pdfDisclaimer, 8, false);
    line('Thibitisha kiwango, eneo, kipindi na kipimo kwa mchapishaji.', 8, false);
    doc.save(t.pdfFile);
  }

  document.getElementById('ic-copy').addEventListener('click', function () {
    if (!isCurrent()) return;
    var text = summary();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { status.textContent = t.copied; }).catch(function () { status.textContent = t.copyFailed; });
    } else { status.textContent = t.copyFailed; }
  });
  document.getElementById('ic-csv').addEventListener('click', function () {
    if (!isCurrent()) return;
    var rows = [[t.csvYear, t.csvPrice, t.csvPower]].concat(current.timeline.map(function (row) { return [row.year, row.priceEquivalent, row.purchasingPower]; }));
    download(t.csvFile, 'text/csv;charset=utf-8', '\uFEFF' + rows.map(function (row) { return row.map(cell).join(','); }).join('\r\n'));
  });
  document.getElementById('ic-json').addEventListener('click', function () {
    if (!isCurrent()) return;
    download(t.jsonFile, 'application/json', JSON.stringify({ schemaVersion:1, locale:locale, exportedAt:new Date().toISOString(), privacy:t.jsonPrivacy, scenario:current }, null, 2));
  });
  document.getElementById('ic-pdf').addEventListener('click', async function () {
    if (!isCurrent()) return;
    if (!window.AfroTools || !window.AfroTools.pdf) { status.textContent = t.pdfUnavailable; return; }
    try {
      if (locale === 'sw') { await generateSwahiliPdf(); status.textContent = t.exported; return; }
      await window.AfroTools.pdf.generate({
        toolId:'inflation-calc', category:'financial', title:root.dataset.pdfTitle,
        subtitle:current.sourceLabel + ' · ' + current.sourceDate, noGate:true, skipGate:true,
        heroStats:[[root.dataset.futureLabel,money(current.priceEquivalent)],[root.dataset.powerLabel,money(current.purchasingPower)],[root.dataset.rateLabel,current.annualRate + '%']],
        sections:[{ title:root.dataset.timelineTitle, rows:current.timeline.map(function (row) { return [t.year + ' ' + row.year, money(row.priceEquivalent) + ' / ' + money(row.purchasingPower)]; }) }],
        source:current.sourceLabel + ' · ' + current.sourceDate, disclaimer:root.dataset.pdfDisclaimer
      });
      status.textContent = t.exported;
    } catch (_) { status.textContent = t.pdfUnavailable; }
  });

  clear();
})();
