(function () {
  'use strict';
  var root = document.querySelector('[data-pension-fund-app]');
  if (!root) return;
  var locale = root.dataset.locale === 'sw' ? 'sw' : 'en';
  var form = root.querySelector('form');
  var result = root.querySelector('[data-result]');
  var status = root.querySelector('[data-status]');
  var exportsBox = root.querySelector('[data-exports]');
  var engine = window.AfroTools && window.AfroTools.engines && window.AfroTools.engines.pensionFundProjection;
  var storageKey = 'afrotools:pension-fund-projection:v1';
  var last = null;
  var countries = [
    ['DZ','Algeria','Aljeria','DZD'],['AO','Angola','Angola','AOA'],['BW','Botswana','Botswana','BWP'],['CM','Cameroon','Kamerun','XAF'],
    ['CD','DR Congo','DR Kongo','CDF'],['EG','Egypt','Misri','EGP'],['ET','Ethiopia','Ethiopia','ETB'],['GH','Ghana','Ghana','GHS'],
    ['KE','Kenya','Kenya','KES'],['MG','Madagascar','Madagaska','MGA'],['MW','Malawi','Malawi','MWK'],['MA','Morocco','Moroko','MAD'],
    ['MZ','Mozambique','Msumbiji','MZN'],['NA','Namibia','Namibia','NAD'],['NG','Nigeria','Nigeria','NGN'],['RW','Rwanda','Rwanda','RWF'],
    ['SN','Senegal','Senegal','XOF'],['SL','Sierra Leone','Sierra Leone','SLE'],['ZA','South Africa','Afrika Kusini','ZAR'],['TZ','Tanzania','Tanzania','TZS'],
    ['TN','Tunisia','Tunisia','TND'],['UG','Uganda','Uganda','UGX'],['ZM','Zambia','Zambia','ZMW'],['ZW','Zimbabwe','Zimbabwe','USD'],
    ['OTHER','Other / user-selected','Nchi nyingine / chagua sarafu','USD']
  ];
  var copy = locale === 'sw' ? {
    ready:'Kikokotoo kiko tayari. Data yako haitoki kwenye kivinjari.', changed:'Maingizo yamebadilika. Kokotoa tena.', invalid:'Kagua maingizo na uthibitisho ulioombwa.', done:'Makadirio yamekamilika ndani ya kivinjari.', copied:'Muhtasari umenakiliwa.', copyFail:'Kunakili hakukupatikana; tumia TXT.', saved:'Rasimu imehifadhiwa kwenye kivinjari hiki.', loaded:'Rasimu imefunguliwa. Kokotoa tena.', none:'Hakuna rasimu iliyohifadhiwa.', reset:'Fomu imerudi mwanzo.', imported:'Faili ya JSON imefunguliwa. Kagua maingizo, kisha kokotoa.', importFail:'JSON haikuweza kufunguliwa.', pdfFail:'PDF haikupatikana; tumia TXT au JSON.', stale:'Chanzo kimepitwa na muda; thibitisha tena kabla ya kukokotoa.'
  } : {
    ready:'Calculator ready. Your data stays in this browser.', changed:'Inputs changed. Calculate again.', invalid:'Review the inputs and required confirmations.', done:'Projection calculated in this browser.', copied:'Projection summary copied.', copyFail:'Copy is unavailable; use TXT instead.', saved:'Draft saved in this browser.', loaded:'Draft loaded. Review it, then calculate again.', none:'No saved draft was found.', reset:'Form reset.', imported:'JSON reopened. Review the inputs, then calculate again.', importFail:'The JSON file could not be reopened.', pdfFail:'PDF is unavailable; use TXT or JSON.', stale:'The source is stale; recheck it before calculating.'
  };

  function field(name) { return form.elements.namedItem(name); }
  function say(message, bad) { status.textContent = message; status.classList.toggle('is-error', !!bad); }
  function today() { return new Date().toISOString().slice(0, 10); }
  function money(value, currency) { return currency + ' ' + Number(value).toLocaleString(locale === 'sw' ? 'sw-KE' : 'en-US', { maximumFractionDigits: 0 }); }
  function percent(value) { return Number(value).toLocaleString(locale === 'sw' ? 'sw-KE' : 'en-US', { maximumFractionDigits: 1 }) + '%'; }
  function values() {
    return {
      countryCode: field('countryCode').value,
      currency: field('currency').value,
      currentAge: field('currentAge').value,
      retirementAge: field('retirementAge').value,
      monthlySalary: field('monthlySalary').value,
      salaryGrowthPercent: field('salaryGrowthPercent').value,
      contributionRatePercent: field('contributionRatePercent').value,
      currentBalance: field('currentBalance').value,
      annualReturnPercent: field('annualReturnPercent').value,
      annualFeePercent: field('annualFeePercent').value,
      inflationPercent: field('inflationPercent').value,
      drawdownPercent: field('drawdownPercent').value,
      sourceLabel: field('sourceLabel').value,
      sourceCheckedDate: field('sourceCheckedDate').value,
      asOfDate: field('asOfDate').value,
      schemeInputsConfirmed: field('schemeInputsConfirmed').checked,
      assumptionsConfirmed: field('assumptionsConfirmed').checked
    };
  }
  function apply(input) {
    Object.keys(input || {}).forEach(function (key) {
      var control = field(key);
      if (!control) return;
      if (control.type === 'checkbox') control.checked = input[key] === true;
      else control.value = input[key];
    });
  }
  function clear(message, bad) {
    last = null;
    result.hidden = true;
    exportsBox.hidden = true;
    result.replaceChildren();
    if (message) say(message, bad);
  }
  function lines() {
    var i = last.inputs, b = last.base;
    return locale === 'sw' ? [
      'Makadirio ya mfuko wa pensheni',
      'Umri: ' + i.currentAge + ' hadi ' + i.retirementAge + ' (' + last.years + ' miaka)',
      'Salio la makadirio: ' + money(b.endingBalance, i.currency),
      'Thamani halisi baada ya mfumuko: ' + money(b.realValue, i.currency),
      'Jumla iliyochangwa: ' + money(b.totalContributed, i.currency),
      'Ukuaji wa uwekezaji: ' + money(b.investmentGrowth, i.currency),
      'Malipo ya mwezi ya mfano: ' + money(b.illustrativeMonthlyDrawdown, i.currency),
      'Uwiano wa mshahara: ' + percent(b.replacementRatioPercent),
      'Masafa ya salio (-/+ pointi 2): ' + money(last.lower.endingBalance, i.currency) + ' - ' + money(last.higher.endingBalance, i.currency),
      'Chanzo ulichokagua: ' + i.sourceLabel + ' (' + i.sourceCheckedDate + ')',
      'Mpaka: makadirio ya kupanga tu; si taarifa rasmi ya mfuko, ushauri wa uwekezaji au ahadi ya malipo.'
    ] : [
      'Pension Fund Projection',
      'Age: ' + i.currentAge + ' to ' + i.retirementAge + ' (' + last.years + ' years)',
      'Projected balance: ' + money(b.endingBalance, i.currency),
      'Inflation-adjusted value: ' + money(b.realValue, i.currency),
      'Total contributed: ' + money(b.totalContributed, i.currency),
      'Investment growth: ' + money(b.investmentGrowth, i.currency),
      'Illustrative monthly drawdown: ' + money(b.illustrativeMonthlyDrawdown, i.currency),
      'Salary replacement ratio: ' + percent(b.replacementRatioPercent),
      'Balance range (-/+ 2 points): ' + money(last.lower.endingBalance, i.currency) + ' - ' + money(last.higher.endingBalance, i.currency),
      'Source checked: ' + i.sourceLabel + ' (' + i.sourceCheckedDate + ')',
      'Boundary: planning estimate only; not a fund statement, investment advice, or guaranteed benefit.'
    ];
  }
  function record() { return { schemaVersion: 1, locale: locale, englishId: 'pension-projection', route: location.pathname, generatedAt: new Date().toISOString(), inputs: last.inputs, result: last }; }
  function csv() {
    var rows = [['age','balance','total_contributed']].concat(last.base.yearly.map(function (row) { return [row.age,row.balance.toFixed(2),row.totalContributed.toFixed(2)]; }));
    return rows.map(function (row) { return row.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n') + '\r\n';
  }
  function download(content, type, name) {
    var blob = content instanceof Blob ? content : new Blob([content], { type: type });
    var url = URL.createObjectURL(blob), anchor = document.createElement('a');
    anchor.href = url; anchor.download = name; document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 600);
  }
  function pdf() {
    var Pdf = window.jspdf && window.jspdf.jsPDF;
    if (!Pdf) throw new Error('PDF unavailable');
    var doc = new Pdf({ unit: 'pt', format: [595, 842], compress: false }), y = 52;
    lines().forEach(function (line, index) {
      doc.setFontSize(index ? 10 : 15);
      doc.splitTextToSize(line.normalize('NFD').replace(/[\u0300-\u036f]/g, ''), 490).forEach(function (part) { doc.text(part, 48, y); y += index ? 15 : 20; });
    });
    return new Blob([doc.output('arraybuffer')], { type: 'application/pdf' });
  }
  function render() {
    var b = last.base, i = last.inputs;
    var heading = locale === 'sw' ? 'Makadirio yako' : 'Your projection';
    var labels = locale === 'sw' ? ['Salio la makadirio','Thamani halisi','Jumla iliyochangwa','Ukuaji wa uwekezaji','Malipo ya mwezi ya mfano','Uwiano wa mshahara'] : ['Projected balance','Inflation-adjusted value','Total contributed','Investment growth','Illustrative monthly drawdown','Salary replacement ratio'];
    var vals = [money(b.endingBalance,i.currency),money(b.realValue,i.currency),money(b.totalContributed,i.currency),money(b.investmentGrowth,i.currency),money(b.illustrativeMonthlyDrawdown,i.currency),percent(b.replacementRatioPercent)];
    var cards = labels.map(function (label, idx) { return '<div><dt>' + label + '</dt><dd>' + vals[idx] + '</dd></div>'; }).join('');
    var tableHead = locale === 'sw' ? '<tr><th>Umri</th><th>Salio</th><th>Jumla iliyochangwa</th></tr>' : '<tr><th>Age</th><th>Balance</th><th>Total contributed</th></tr>';
    var tableRows = b.yearly.map(function (row) { return '<tr><td>' + row.age + '</td><td>' + money(row.balance,i.currency) + '</td><td>' + money(row.totalContributed,i.currency) + '</td></tr>'; }).join('');
    result.innerHTML = '<h2 tabindex="-1">' + heading + '</h2><dl class="pp-result-grid">' + cards + '</dl><p><strong>' + (locale === 'sw' ? 'Masafa ya hali tofauti:' : 'Scenario range:') + '</strong> ' + money(last.lower.endingBalance,i.currency) + ' - ' + money(last.higher.endingBalance,i.currency) + '.</p><div class="pp-table-wrap"><table><caption>' + (locale === 'sw' ? 'Ukuaji wa mwaka kwa mwaka' : 'Year-by-year growth') + '</caption><thead>' + tableHead + '</thead><tbody>' + tableRows + '</tbody></table></div><p class="pp-boundary">' + lines()[10] + '</p>';
    result.hidden = false; exportsBox.hidden = false; result.querySelector('h2').focus(); say(copy.done);
  }
  function calculate() {
    clear();
    if (!engine || !form.reportValidity()) return say(copy.invalid, true);
    try { last = engine.calculate(values()); render(); }
    catch (error) { say(error.message.indexOf('366') !== -1 ? copy.stale : error.message, true); }
  }
  form.addEventListener('submit', function (event) { event.preventDefault(); calculate(); });
  form.addEventListener('input', function () { if (last) clear(copy.changed, true); });
  field('countryCode').addEventListener('change', function () {
    var row = countries.find(function (item) { return item[0] === field('countryCode').value; });
    if (row) field('currency').value = row[3];
  });
  root.addEventListener('click', function (event) {
    var button = event.target.closest('[data-action]'), action = button && button.dataset.action;
    if (!action) return;
    if (action === 'reset') { form.reset(); field('asOfDate').value = today(); field('sourceCheckedDate').value = today(); clear(copy.reset); field('countryCode').focus(); return; }
    if (action === 'save') { localStorage.setItem(storageKey, JSON.stringify(values())); return say(copy.saved); }
    if (action === 'load') { var saved = localStorage.getItem(storageKey); if (!saved) return say(copy.none, true); apply(JSON.parse(saved)); clear(copy.loaded); return; }
    if (action === 'import') { field('importFile').click(); return; }
    if (!last) return say(copy.invalid, true);
    var base = 'pension-fund-projection';
    if (action === 'json') download(JSON.stringify(record(), null, 2) + '\n', 'application/json;charset=utf-8', base + '.json');
    else if (action === 'csv') download(csv(), 'text/csv;charset=utf-8', base + '.csv');
    else if (action === 'txt') download('\uFEFF' + lines().join('\n') + '\n', 'text/plain;charset=utf-8', base + '.txt');
    else if (action === 'pdf') { try { download(pdf(), 'application/pdf', base + '.pdf'); } catch (error) { say(copy.pdfFail, true); } }
    else if (action === 'copy') { navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(lines().join('\n')).then(function () { say(copy.copied); }).catch(function () { say(copy.copyFail, true); }) : say(copy.copyFail, true); }
  });
  field('importFile').addEventListener('change', function () {
    var file = field('importFile').files && field('importFile').files[0];
    if (!file) return;
    file.text().then(function (text) { var parsed = JSON.parse(text); apply(parsed.inputs || parsed); clear(copy.imported); }).catch(function () { say(copy.importFail, true); });
  });
  countries.forEach(function (row) { var option = document.createElement('option'); option.value = row[0]; option.textContent = locale === 'sw' ? row[2] : row[1]; option.dataset.currency = row[3]; field('countryCode').appendChild(option); });
  field('countryCode').value = locale === 'sw' ? 'TZ' : 'NG';
  field('currency').value = locale === 'sw' ? 'TZS' : 'NGN';
  field('asOfDate').value = today(); field('sourceCheckedDate').value = today();
  root.dataset.workflowReady = 'true'; say(copy.ready);
})();
