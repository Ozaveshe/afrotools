(function () {
  'use strict';
  var engine = window.AfroTools && window.AfroTools.KEVatEngine;
  var locale = window.KEVatLocale || {};
  if (!engine) return;

  var state = { mode: 'add', rate: engine.STANDARD_RATE, rateKind: 'standard', result: null };
  var byId = function (id) { return document.getElementById(id); };
  var amount = byId('kevAmount');
  var custom = byId('kevCustomRate');
  var resultBox = byId('kevResult');
  var status = byId('kevStatus');
  var error = byId('kevError');

  function text(key, fallback) { return locale[key] || fallback; }
  function money(value) {
    return new Intl.NumberFormat(locale.numberLocale || 'en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }
  function setPressed(selector, active) {
    document.querySelectorAll(selector).forEach(function (button) { button.setAttribute('aria-pressed', String(button === active)); });
  }
  function currentRate() { return state.rateKind === 'scenario' ? Number(custom.value) : state.rate; }
  function calculate() {
    try {
      state.result = engine.calculate({ amount: amount.value, mode: state.mode, rate: currentRate(), rateKind: state.rateKind });
      error.textContent = '';
      byId('kevResultMain').textContent = money(state.mode === 'add' ? state.result.gross : state.result.net);
      byId('kevNet').textContent = money(state.result.net);
      byId('kevVat').textContent = money(state.result.vat);
      byId('kevGross').textContent = money(state.result.gross);
      byId('kevRateUsed').textContent = state.result.rate.toFixed(state.result.rate % 1 ? 2 : 0) + '%';
      byId('kevResultLabel').textContent = state.mode === 'add' ? text('grossResult', 'Total including VAT') : text('netResult', 'Amount before VAT');
      byId('kevResultNote').textContent = state.rateKind === 'scenario'
        ? text('scenarioNote', 'Planning scenario only. Confirm the statutory treatment before invoicing or filing.')
        : (state.result.rate === 0 ? text('zeroNote', '0% is only for supplies confirmed in the VAT Act Second Schedule.') : text('standardNote', 'Standard-rate estimate using KRA\'s current 16% general rate.'));
      resultBox.classList.add('on');
      status.textContent = text('calculated', 'VAT estimate updated.');
    } catch (caught) {
      state.result = null;
      resultBox.classList.remove('on');
      error.textContent = text('invalid', 'Enter a non-negative amount and a rate from 0% to 100%.');
      status.textContent = error.textContent;
    }
  }

  document.querySelectorAll('[data-mode]').forEach(function (button) {
    button.addEventListener('click', function () { state.mode = button.getAttribute('data-mode'); setPressed('[data-mode]', button); calculate(); });
  });
  document.querySelectorAll('[data-rate-kind]').forEach(function (button) {
    button.addEventListener('click', function () {
      state.rateKind = button.getAttribute('data-rate-kind');
      state.rate = state.rateKind === 'zero' ? 0 : engine.STANDARD_RATE;
      byId('kevScenario').classList.toggle('on', state.rateKind === 'scenario');
      setPressed('[data-rate-kind]', button); calculate();
    });
  });
  byId('kevForm').addEventListener('submit', function (event) { event.preventDefault(); calculate(); });
  amount.addEventListener('input', calculate);
  custom.addEventListener('input', function () { if (state.rateKind === 'scenario') calculate(); });

  byId('kevClassification').addEventListener('change', function (event) {
    var treatment = engine.classify(event.target.value);
    var box = byId('kevClassificationResult');
    box.className = 'kev-treatment ' + treatment.treatment;
    box.replaceChildren();
    var strong = document.createElement('strong'); strong.textContent = text('treatment_' + treatment.treatment, treatment.treatment);
    var span = document.createElement('span'); span.textContent = treatment.source + ' · ' + text('classificationCaveat', 'Confirm the exact schedule item before relying on this guide.');
    box.append(strong, span);
  });

  byId('kevInvoiceForm').addEventListener('submit', function (event) {
    event.preventDefault();
    try {
      var invoice = engine.calculateInvoice([{ description: byId('kevInvoiceDescription').value, quantity: byId('kevInvoiceQty').value, unitPrice: byId('kevInvoiceUnit').value }], currentRate(), state.rateKind);
      byId('kevInvoiceError').textContent = '';
      byId('kevInvoiceNet').textContent = money(invoice.net); byId('kevInvoiceVat').textContent = money(invoice.vat); byId('kevInvoiceGross').textContent = money(invoice.gross);
      byId('kevInvoiceOutput').classList.add('on');
    } catch (caught) { byId('kevInvoiceOutput').classList.remove('on'); byId('kevInvoiceError').textContent = text('invalidInvoice', 'Enter a non-negative quantity and unit price.'); }
  });

  byId('kevShare').addEventListener('click', async function () {
    var route = location.origin + location.pathname;
    try {
      if (navigator.share) await navigator.share({ title: document.title, url: route });
      else if (navigator.clipboard) await navigator.clipboard.writeText(route);
      status.textContent = text('shared', 'Tool link shared. No amounts were included.');
    } catch (caught) { if (caught && caught.name !== 'AbortError') status.textContent = text('shareFailed', 'Could not share the tool link.'); }
  });

  byId('kevPdf').addEventListener('click', function () {
    if (!state.result) calculate();
    if (!state.result || !window.jspdf || !window.jspdf.jsPDF) return;
    var doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4' });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.text(text('pdfTitle', 'Kenya VAT planning estimate'), 48, 62);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text(text('pdfSource', 'KRA VAT guidance and Value Added Tax Act, Cap. 476; reviewed 22 July 2026.'), 48, 82);
    var rows = [
      [text('pdfMode', 'Mode'), state.mode === 'add' ? text('addVat', 'Add VAT') : text('extractVat', 'Extract VAT')],
      [text('net', 'Amount before VAT'), 'KES ' + state.result.net.toFixed(2)],
      [text('vat', 'VAT'), 'KES ' + state.result.vat.toFixed(2)],
      [text('gross', 'Total including VAT'), 'KES ' + state.result.gross.toFixed(2)],
      [text('rateUsed', 'Rate used'), state.result.rate.toFixed(2) + '%']
    ];
    doc.setFontSize(12); rows.forEach(function (row, index) { var y = 125 + index * 28; doc.setFont('helvetica', 'normal'); doc.text(row[0], 48, y); doc.setFont('helvetica', 'bold'); doc.text(row[1], 250, y); });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text(doc.splitTextToSize(text('pdfDisclaimer', 'Planning estimate only. Confirm classification, registration, invoicing, filing and remittance with KRA or a qualified tax adviser.'), 500), 48, 290);
    doc.save('kenya-vat-estimate.pdf'); status.textContent = text('pdfReady', 'PDF downloaded locally.');
  });

  window.KEVatApp = { calculate: calculate, getResult: function () { return state.result; } };
  calculate();
})();
