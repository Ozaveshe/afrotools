(function () {
  'use strict';

  var engine = window.AfroTools && window.AfroTools.panAfricanVat;
  var pack = null;
  var singleMode = 'add';
  var lastSingle = null;
  var lastInvoice = null;
  var lineCounter = 0;
  var tabOrder = ['single', 'invoice', 'withholding', 'compare'];
  var locale = window.AfroToolsVatLocale || {};
  var strings = Object.assign({
    customSource: 'Custom rate supplied by the user. No country-law treatment is implied.',
    presetSource: '{country} planning preset ({rate}%), authority link: {url}, dataset reviewed {date}.',
    countryOptionalTitle: 'Country is optional',
    countryOptionalCopy: 'Enter a rate from your invoice, authority notice or adviser. Selecting a country never silently changes the rate.',
    presetTitle: '{country} has an authority-bound planning preset',
    presetCopy: '{rate}% · reviewed dataset {date} · confirm on the linked authority site before use.',
    gapTitle: '{country} needs a custom rate',
    gapCopy: 'No authority-bound preset is available. Enter the rate from your authority notice.',
    presetLoaded: 'Planning preset loaded. Confirm it with the authority before relying on the result.',
    amountAddLabel: 'Amount before VAT',
    amountExtractLabel: 'Amount including VAT',
    errorAmount: 'Enter an amount from 0 upward.',
    errorRate: 'Enter a VAT rate from 0 to 100.',
    errorWithholding: 'Enter a withholding percentage from 0 to 100.',
    errorInvoiceLines: 'Add at least one invoice line.',
    description: 'Description', amount: 'Amount', treatment: 'Treatment', rate: 'Rate %',
    taxableTreatment: 'Taxable at entered rate', zeroTreatment: 'User marks zero-rated', exemptTreatment: 'User marks exempt',
    removeLine: 'Remove invoice line', defaultLine: 'Goods or services', scenario: 'Scenario {number}',
    scenarioMetric: '{label} · {rate}%', vatPrefix: 'VAT ', spread: '{value} percentage points',
    treatmentStandardPdf: 'taxable at entered rate', treatmentZeroPdf: 'user-marked zero-rated', treatmentExemptPdf: 'user-marked exempt',
    shareTitle: 'Pan-African VAT Planning Calculator', shareText: 'Custom-rate VAT planning calculator on AfroTools.',
    shareCopied: 'Calculator link copied. Amounts and results were not included.',
    pdfUnavailable: 'PDF library is unavailable. Try again after the page finishes loading.',
    pdfProvenance: 'Rate provenance and limitations',
    pdfDisclaimer: 'Planning estimate only - not a tax invoice, return, filing instruction or professional advice.',
    pdfBrand: 'AfroTools planning report', pdfMode: 'Mode', pdfAdd: 'Add VAT', pdfExtract: 'Extract VAT',
    pdfRate: 'Rate', pdfNet: 'Net amount', pdfVat: 'VAT amount', pdfTotal: 'Total',
    singlePdfMissing: 'Calculate a result before exporting.', singlePdfTitle: 'VAT Planning Calculation',
    invoicePdfMissing: 'Calculate the invoice before exporting.', invoicePdfTitle: 'VAT Invoice Planning Summary',
    invoicePdfSource: 'Every rate and tax treatment in this summary was supplied by the user. {disclaimer}',
    line: 'Line {number}', subtotal: 'Subtotal', vat: 'VAT',
    engineUnavailable: 'The VAT calculation engine could not load.',
    packUnavailable: 'Country presets are unavailable. Reload before calculating so rate provenance stays explicit.'
  }, locale.strings || {});

  function tr(key, values) {
    var text = strings[key] || key;
    Object.entries(values || {}).forEach(function (entry) { text = text.replace(new RegExp('\\{' + entry[0] + '\\}', 'g'), String(entry[1])); });
    return text;
  }

  function errorText(result) {
    var field = String(result && result.field || '');
    if (field === 'items') return tr('errorInvoiceLines');
    if (/withholding percentage/.test(field)) return tr('errorWithholding');
    if (/rate/i.test(field)) return tr('errorRate');
    if (/amount/i.test(field)) return tr('errorAmount');
    return result.error;
  }

  function treatmentText(value) {
    if (value === 'zero-rated') return tr('treatmentZeroPdf');
    if (value === 'exempt') return tr('treatmentExemptPdf');
    return tr('treatmentStandardPdf');
  }

  function byId(id) { return document.getElementById(id); }
  function money(value) { return Number(value).toLocaleString(locale.numberLocale || 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function pdfSafe(value) { return String(value == null ? '' : value).replace(/[\u00a0\u202f]/g, ' '); }
  function countryName(code, fallback) { return locale.countryNames && locale.countryNames[code] || fallback; }
  function value(id) { return byId(id).value; }
  function setText(id, text) { byId(id).textContent = text; }
  function setInvalid(id, invalid) { byId(id).setAttribute('aria-invalid', invalid ? 'true' : 'false'); }
  function clearStatus(id) { setText(id, ''); }
  function showStatus(id, message, fieldId) {
    setText(id, message);
    if (fieldId && byId(fieldId)) { setInvalid(fieldId, true); byId(fieldId).focus(); }
  }
  function sourceLabel() {
    var code = value('country');
    var preset = pack ? engine.getCountryPreset(pack, code) : { ok: false };
    if (preset.ok && Number(value('rate')) === preset.rate) {
      return tr('presetSource', { country: countryName(code, preset.countryName), rate: preset.rate, url: preset.source.url, date: preset.reviewedOn });
    }
    return tr('customSource');
  }

  function activateTab(name, focus) {
    document.querySelectorAll('[role="tab"]').forEach(function (tab) {
      var active = tab.dataset.tab === name;
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
      tab.tabIndex = active ? 0 : -1;
    });
    document.querySelectorAll('[role="tabpanel"]').forEach(function (panel) {
      panel.hidden = panel.id !== 'panel-' + name;
    });
    if (focus) document.querySelector('[data-tab="' + name + '"]').focus();
  }

  function bindTabs() {
    document.querySelectorAll('[role="tab"]').forEach(function (tab) {
      tab.addEventListener('click', function () { activateTab(tab.dataset.tab, false); });
      tab.addEventListener('keydown', function (event) {
        var current = tabOrder.indexOf(tab.dataset.tab);
        var next = null;
        if (event.key === 'ArrowRight') next = (current + 1) % tabOrder.length;
        if (event.key === 'ArrowLeft') next = (current - 1 + tabOrder.length) % tabOrder.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabOrder.length - 1;
        if (next !== null) { event.preventDefault(); activateTab(tabOrder[next], true); }
      });
    });
  }

  function fillCountries() {
    var select = byId('country');
    Object.entries(pack.countries).sort(function (a, b) { return a[1].name.localeCompare(b[1].name); }).forEach(function (entry) {
      var option = document.createElement('option');
      option.value = entry[0];
      option.textContent = countryName(entry[0], entry[1].name);
      select.appendChild(option);
    });
  }

  function updatePreset() {
    var code = value('country');
    var box = byId('presetStatus');
    var button = byId('usePreset');
    if (!code) {
      box.dataset.state = 'idle';
      setText('presetTitle', tr('countryOptionalTitle'));
      setText('presetCopy', tr('countryOptionalCopy'));
      button.hidden = true;
      return;
    }
    var preset = engine.getCountryPreset(pack, code);
    if (preset.ok) {
      box.dataset.state = 'available';
      setText('presetTitle', tr('presetTitle', { country: countryName(code, preset.countryName) }));
      setText('presetCopy', tr('presetCopy', { rate: preset.rate, date: preset.reviewedOn }));
      button.hidden = false;
      button.dataset.rate = String(preset.rate);
      button.dataset.country = countryName(code, preset.countryName);
    } else {
      box.dataset.state = 'gap';
      setText('presetTitle', tr('gapTitle', { country: countryName(code, pack.countries[code].name) }));
      setText('presetCopy', tr('gapCopy'));
      button.hidden = true;
    }
  }

  function usePreset() {
    byId('rate').value = byId('usePreset').dataset.rate;
    setInvalid('rate', false);
    setText('singleStatus', tr('presetLoaded'));
  }

  function setMode(mode) {
    singleMode = mode;
    byId('modeAdd').setAttribute('aria-pressed', mode === 'add' ? 'true' : 'false');
    byId('modeExtract').setAttribute('aria-pressed', mode === 'extract' ? 'true' : 'false');
    setText('amountLabel', mode === 'add' ? tr('amountAddLabel') : tr('amountExtractLabel'));
  }

  function calculateSingle() {
    clearStatus('singleStatus');
    setInvalid('amount', false); setInvalid('rate', false);
    var result = engine.calculateSingle({ amount: value('amount'), rate: value('rate'), mode: singleMode });
    if (!result.ok) {
      var field = result.field === 'VAT rate' ? 'rate' : 'amount';
      showStatus('singleStatus', errorText(result), field);
      byId('singleResult').hidden = true;
      return;
    }
    lastSingle = result;
    setText('singleNet', money(result.display.net));
    setText('singleVat', money(result.display.vat));
    setText('singleTotal', money(result.display.total));
    setText('singleSource', sourceLabel());
    byId('singleResult').hidden = false;
  }

  function addLine(seed) {
    lineCounter += 1;
    var row = document.createElement('div');
    row.className = 'vat-line';
    row.dataset.line = String(lineCounter);
    row.innerHTML = '<div class="vat-field"><label for="line-desc-' + lineCounter + '">' + tr('description') + '</label><input class="vat-input line-desc" id="line-desc-' + lineCounter + '" autocomplete="off"></div>' +
      '<div class="vat-field"><label for="line-amount-' + lineCounter + '">' + tr('amount') + '</label><input class="vat-input line-amount" id="line-amount-' + lineCounter + '" inputmode="decimal" autocomplete="off"></div>' +
      '<div class="vat-field"><label for="line-treatment-' + lineCounter + '">' + tr('treatment') + '</label><select class="vat-select line-treatment" id="line-treatment-' + lineCounter + '"><option value="standard">' + tr('taxableTreatment') + '</option><option value="zero-rated">' + tr('zeroTreatment') + '</option><option value="exempt">' + tr('exemptTreatment') + '</option></select></div>' +
      '<div class="vat-field"><label for="line-rate-' + lineCounter + '">' + tr('rate') + '</label><input class="vat-input line-rate" id="line-rate-' + lineCounter + '" inputmode="decimal" autocomplete="off"></div>' +
      '<button class="vat-line-remove" type="button" aria-label="' + tr('removeLine') + '">×</button>';
    byId('invoiceLines').appendChild(row);
    if (seed) { row.querySelector('.line-desc').value = seed.description || ''; row.querySelector('.line-amount').value = seed.amount || ''; row.querySelector('.line-rate').value = seed.rate || ''; }
    row.querySelector('.line-treatment').addEventListener('change', function () {
      var rate = row.querySelector('.line-rate');
      var standard = this.value === 'standard';
      rate.disabled = !standard;
      if (!standard) { rate.value = ''; setInvalid(rate.id, false); }
    });
    row.querySelector('.vat-line-remove').addEventListener('click', function () { row.remove(); });
  }

  function calculateInvoice() {
    clearStatus('invoiceStatus');
    var rows = Array.from(document.querySelectorAll('.vat-line'));
    var items = rows.map(function (row) {
      return { description: row.querySelector('.line-desc').value, amount: row.querySelector('.line-amount').value, treatment: row.querySelector('.line-treatment').value, rate: row.querySelector('.line-rate').value };
    });
    document.querySelectorAll('.vat-line input').forEach(function (input) { setInvalid(input.id, false); });
    var result = engine.calculateInvoice({ items: items });
    if (!result.ok) {
      var match = String(result.field || '').match(/items\[(\d+)\]\.(amount|rate)/);
      var target = match && rows[Number(match[1])] ? rows[Number(match[1])].querySelector('.line-' + match[2]) : null;
      showStatus('invoiceStatus', errorText(result), target ? target.id : null);
      byId('invoiceResult').hidden = true;
      return;
    }
    lastInvoice = result;
    setText('invoiceSubtotal', money(result.display.subtotal)); setText('invoiceVat', money(result.display.vat)); setText('invoiceTotal', money(result.display.total));
    byId('invoiceResult').hidden = false;
  }

  function calculateWithholding() {
    clearStatus('withholdingStatus');
    ['withholdingAmount', 'withholdingVatRate', 'withholdingPercent'].forEach(function (id) { setInvalid(id, false); });
    var result = engine.calculateWithholdingScenario({ netAmount: value('withholdingAmount'), vatRate: value('withholdingVatRate'), withholdingPercent: value('withholdingPercent') });
    if (!result.ok) {
      var id = result.field === 'VAT rate' ? 'withholdingVatRate' : result.field === 'withholding percentage' ? 'withholdingPercent' : 'withholdingAmount';
      showStatus('withholdingStatus', errorText(result), id); byId('withholdingResult').hidden = true; return;
    }
    setText('withholdingVat', money(result.display.vat)); setText('withholdingRetained', money(result.display.retainedVat)); setText('withholdingRemaining', money(result.display.remainingVat)); setText('withholdingSupplier', money(result.display.supplierReceives));
    byId('withholdingResult').hidden = false;
  }

  function calculateCompare() {
    clearStatus('compareStatus'); setInvalid('compareAmount', false);
    var scenarios = [1, 2, 3].map(function (index) { return { label: value('scenarioLabel' + index) || tr('scenario', { number: index }), rate: value('scenarioRate' + index) }; });
    ['scenarioRate1', 'scenarioRate2', 'scenarioRate3'].forEach(function (id) { setInvalid(id, false); });
    var result = engine.compareRateScenarios({ amount: value('compareAmount'), scenarios: scenarios });
    if (!result.ok) {
      var match = String(result.field || '').match(/scenarios\[(\d+)\]/);
      var id = match ? 'scenarioRate' + (Number(match[1]) + 1) : 'compareAmount';
      showStatus('compareStatus', errorText(result), id); byId('compareResult').hidden = true; return;
    }
    var container = byId('compareMetrics'); container.innerHTML = '';
    result.scenarios.forEach(function (scenario) {
      var metric = document.createElement('div'); metric.className = 'vat-metric';
      var label = document.createElement('span'); label.textContent = tr('scenarioMetric', { label: scenario.label, rate: scenario.rate });
      var total = document.createElement('strong'); total.textContent = tr('vatPrefix') + money(scenario.vat);
      metric.append(label, total); container.appendChild(metric);
    });
    setText('compareSpread', tr('spread', { value: result.percentagePointSpread.toFixed(2) })); byId('compareResult').hidden = false;
  }

  function routeOnlyShare() {
    var payload = { title: tr('shareTitle'), text: tr('shareText'), url: location.origin + location.pathname };
    if (navigator.share) navigator.share(payload).catch(function () {});
    else if (navigator.clipboard) navigator.clipboard.writeText(payload.url).then(function () { setText('singleStatus', tr('shareCopied')); });
  }

  function planningDisclaimer() { return locale.planningDisclaimer || pack.displayDisclaimer; }
  function pdfSource() { return sourceLabel() + ' ' + planningDisclaimer(); }
  function savePdf(config) {
    if (!window.jspdf || !window.jspdf.jsPDF) { showStatus(config.statusId, tr('pdfUnavailable')); return; }
    var doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.text(config.title, 18, 22);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text(tr('pdfBrand'), 18, 30);
    var y = 43;
    config.rows.forEach(function (row) { doc.setFont('helvetica', row.bold ? 'bold' : 'normal'); doc.text(pdfSafe(row.label), 18, y); doc.text(pdfSafe(row.value), 192, y, { align: 'right' }); y += 8; });
    y += 4; doc.setFont('helvetica', 'bold'); doc.text(tr('pdfProvenance'), 18, y); y += 7;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); var sourceLines = doc.splitTextToSize(config.source, 174); doc.text(sourceLines, 18, y); y += sourceLines.length * 4 + 5;
    doc.setFont('helvetica', 'bold'); doc.text(tr('pdfDisclaimer'), 18, y);
    var blob = doc.output('blob'); doc.save(config.filename);
    window.dispatchEvent(new CustomEvent('afro-pdf-generated', { detail: { blob: blob, fileName: config.filename, toolId: 'vat-calculator', category: 'vat-business-tax' } }));
  }

  function exportSinglePdf() {
    if (!lastSingle) { showStatus('singleStatus', tr('singlePdfMissing')); return; }
    savePdf({ statusId: 'singleStatus', title: tr('singlePdfTitle'), filename: locale.singlePdfFilename || 'afrotools-vat-planning-calculation.pdf', source: pdfSource(), rows: [
      { label: tr('pdfMode'), value: lastSingle.mode === 'add' ? tr('pdfAdd') : tr('pdfExtract') }, { label: tr('pdfRate'), value: lastSingle.rate + '%' },
      { label: tr('pdfNet'), value: money(lastSingle.display.net) }, { label: tr('pdfVat'), value: money(lastSingle.display.vat) }, { label: tr('pdfTotal'), value: money(lastSingle.display.total), bold: true }
    ] });
  }

  function exportInvoicePdf() {
    if (!lastInvoice) { showStatus('invoiceStatus', tr('invoicePdfMissing')); return; }
    var rows = [];
    lastInvoice.lines.forEach(function (line, index) { rows.push({ label: (line.description || tr('line', { number: index + 1 })) + ' · ' + treatmentText(line.treatment) + ' · ' + line.rate + '%', value: money(line.display.total) }); });
    rows.push({ label: tr('subtotal'), value: money(lastInvoice.display.subtotal) }, { label: tr('vat'), value: money(lastInvoice.display.vat) }, { label: tr('pdfTotal'), value: money(lastInvoice.display.total), bold: true });
    savePdf({ statusId: 'invoiceStatus', title: tr('invoicePdfTitle'), filename: locale.invoicePdfFilename || 'afrotools-vat-invoice-planning-summary.pdf', source: tr('invoicePdfSource', { disclaimer: planningDisclaimer() }), rows: rows });
  }

  function bind() {
    bindTabs();
    byId('country').addEventListener('change', updatePreset); byId('usePreset').addEventListener('click', usePreset);
    byId('modeAdd').addEventListener('click', function () { setMode('add'); }); byId('modeExtract').addEventListener('click', function () { setMode('extract'); });
    byId('calculateSingle').addEventListener('click', calculateSingle); byId('shareCalculator').addEventListener('click', routeOnlyShare); byId('singlePdf').addEventListener('click', exportSinglePdf);
    byId('addInvoiceLine').addEventListener('click', function () { addLine(); }); byId('calculateInvoice').addEventListener('click', calculateInvoice); byId('invoicePdf').addEventListener('click', exportInvoicePdf);
    byId('calculateWithholding').addEventListener('click', calculateWithholding); byId('calculateCompare').addEventListener('click', calculateCompare);
    addLine({ description: tr('defaultLine'), rate: '' }); setMode('add'); updatePreset();
  }

  async function init() {
    if (!engine) { showStatus('pageStatus', tr('engineUnavailable')); return; }
    try {
      var response = await fetch('/data/vat-business-tax/pan-african-vat-presets.json', { method: 'GET', credentials: 'same-origin' });
      if (!response.ok) throw new Error('Preset pack request failed');
      pack = await response.json(); fillCountries(); bind();
    } catch (error) { showStatus('pageStatus', tr('packUnavailable')); }
  }
  init();
}());
