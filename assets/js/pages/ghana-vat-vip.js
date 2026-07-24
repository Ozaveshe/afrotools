(function () {
  'use strict';
  var engine = window.AfroTools && window.AfroTools.GHVatEngine;
  var locale = window.GHVatLocale || {};
  if (!engine) return;

  var state = { mode: 'add', rateKind: 'standard', result: null };
  var byId = function (id) { return document.getElementById(id); };
  var amount = byId('ghvAmount');
  var custom = byId('ghvCustomRate');
  var resultBox = byId('ghvResult');
  var status = byId('ghvStatus');
  var error = byId('ghvError');

  function text(key, fallback) { return locale[key] || fallback; }
  function money(value) {
    return new Intl.NumberFormat(locale.numberLocale || 'en-GH', { style: 'currency', currency: 'GHS', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }
  function setPressed(selector, active) {
    document.querySelectorAll(selector).forEach(function (button) { button.setAttribute('aria-pressed', String(button === active)); });
  }
  function inputForCalculation() {
    return { amount: amount.value, mode: state.mode, rateKind: state.rateKind, rate: state.rateKind === 'scenario' ? custom.value : undefined };
  }
  function calculate() {
    try {
      state.result = engine.calculate(inputForCalculation());
      error.textContent = '';
      byId('ghvResultMain').textContent = money(state.mode === 'add' ? state.result.gross : state.result.base);
      byId('ghvBase').textContent = money(state.result.base);
      byId('ghvVat').textContent = money(state.result.vat);
      byId('ghvNhil').textContent = money(state.result.nhil);
      byId('ghvGetfund').textContent = money(state.result.getfund);
      byId('ghvTax').textContent = money(state.result.totalTax);
      byId('ghvGross').textContent = money(state.result.gross);
      byId('ghvRateUsed').textContent = state.result.effectiveRate.toFixed(state.result.effectiveRate % 1 ? 2 : 0) + '%';
      var french = document.documentElement.lang === 'fr';
      byId('ghvVatLabel').textContent = state.rateKind === 'scenario' ? text('scenarioCharge', french ? 'Charge du scénario' : 'Scenario charge') : (state.rateKind === 'zero' ? text('outputVat', french ? 'TVA en sortie' : 'Output VAT') : text('vatStandard', french ? 'TVA · 15 %' : 'VAT · 15%'));
      byId('ghvNhilLabel').textContent = state.rateKind === 'standard' ? text('nhilStandard', french ? 'NHIL · 2,5 %' : 'NHIL · 2.5%') : text('nhilNotModelled', french ? 'NHIL · non modélisée' : 'NHIL · not modelled');
      byId('ghvGetfundLabel').textContent = state.rateKind === 'standard' ? text('getfundStandard', french ? 'GETFund · 2,5 %' : 'GETFund · 2.5%') : text('getfundNotModelled', french ? 'GETFund · non modélisé' : 'GETFund · not modelled');
      byId('ghvResultLabel').textContent = state.mode === 'add' ? text('grossResult', 'Invoice total') : text('baseResult', 'Amount before VAT and levies');
      byId('ghvResultNote').textContent = state.rateKind === 'scenario'
        ? text('scenarioNote', 'Planning scenario only. It is not a Ghana statutory rate or levy breakdown.')
        : (state.result.effectiveRate === 0 ? text('zeroNote', 'Use 0% only after confirming the supply is zero-rated under Act 1151.') : text('standardNote', '2026 standard structure: 15% VAT + 2.5% NHIL + 2.5% GETFund on the same base.'));
      resultBox.classList.add('on');
      status.textContent = text('calculated', 'Ghana VAT estimate updated.');
    } catch (caught) {
      state.result = null; resultBox.classList.remove('on');
      error.textContent = text('invalid', 'Enter a non-negative amount and a rate from 0% to 100%.'); status.textContent = error.textContent;
    }
  }

  document.querySelectorAll('[data-mode]').forEach(function (button) {
    button.addEventListener('click', function () { state.mode = button.getAttribute('data-mode'); setPressed('[data-mode]', button); calculate(); });
  });
  document.querySelectorAll('[data-rate-kind]').forEach(function (button) {
    button.addEventListener('click', function () {
      state.rateKind = button.getAttribute('data-rate-kind'); byId('ghvScenario').classList.toggle('on', state.rateKind === 'scenario');
      setPressed('[data-rate-kind]', button); calculate();
    });
  });
  byId('ghvForm').addEventListener('submit', function (event) { event.preventDefault(); calculate(); });
  amount.addEventListener('input', calculate); custom.addEventListener('input', function () { if (state.rateKind === 'scenario') calculate(); });

  byId('ghvClassification').addEventListener('change', function (event) {
    var treatment = engine.classify(event.target.value); var box = byId('ghvClassificationResult');
    box.className = 'ghv-treatment ' + treatment.treatment; box.replaceChildren();
    var strong = document.createElement('strong'); strong.textContent = text('treatment_' + treatment.treatment, treatment.treatment);
    var span = document.createElement('span'); span.textContent = treatment.source + ' · ' + text('classificationCaveat', 'Confirm the exact provision before relying on this guide.');
    box.append(strong, span);
  });

  byId('ghvInvoiceForm').addEventListener('submit', function (event) {
    event.preventDefault();
    try {
      var invoice = engine.calculateInvoice([{ description: byId('ghvInvoiceDescription').value, quantity: byId('ghvInvoiceQty').value, unitPrice: byId('ghvInvoiceUnit').value }], { rateKind: state.rateKind, rate: state.rateKind === 'scenario' ? custom.value : undefined });
      byId('ghvInvoiceError').textContent = ''; byId('ghvInvoiceBase').textContent = money(invoice.base); byId('ghvInvoiceVat').textContent = money(invoice.vat);
      byId('ghvInvoiceLevies').textContent = money(invoice.nhil + invoice.getfund); byId('ghvInvoiceGross').textContent = money(invoice.gross); byId('ghvInvoiceOutput').classList.add('on');
    } catch (caught) { byId('ghvInvoiceOutput').classList.remove('on'); byId('ghvInvoiceError').textContent = text('invalidInvoice', 'Enter a non-negative quantity and unit price.'); }
  });

  byId('ghvShare').addEventListener('click', async function () {
    var route = location.origin + location.pathname;
    try {
      if (navigator.share) await navigator.share({ title: document.title, url: route }); else if (navigator.clipboard) await navigator.clipboard.writeText(route);
      status.textContent = text('shared', 'Tool link shared. No amounts were included.');
    } catch (caught) { if (caught && caught.name !== 'AbortError') status.textContent = text('shareFailed', 'Could not share the tool link.'); }
  });

  byId('ghvPdf').addEventListener('click', function () {
    if (!state.result) calculate(); if (!state.result || !window.jspdf || !window.jspdf.jsPDF) return;
    var doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4' });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.text(text('pdfTitle', 'Ghana VAT planning estimate'), 48, 62);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text(text('pdfSource', 'GRA VAT guidance and Value Added Tax Act, 2025 (Act 1151); reviewed 22 July 2026.'), 48, 82);
    var rows = [[text('pdfMode', 'Mode'),state.mode==='add'?text('addVat','Add VAT and levies'):text('extractVat','Extract VAT and levies')],[text('base','Amount before tax'),'GHS '+state.result.base.toFixed(2)],[text('vat','VAT'),'GHS '+state.result.vat.toFixed(2)],[text('nhil','NHIL'),'GHS '+state.result.nhil.toFixed(2)],[text('getfund','GETFund'),'GHS '+state.result.getfund.toFixed(2)],[text('totalTax','Total tax and levies'),'GHS '+state.result.totalTax.toFixed(2)],[text('gross','Invoice total'),'GHS '+state.result.gross.toFixed(2)],[text('rateUsed','Effective rate used'),state.result.effectiveRate.toFixed(2)+'%']];
    doc.setFontSize(11); rows.forEach(function (row,index) { var y=120+index*25; doc.setFont('helvetica','normal'); doc.text(row[0],48,y); doc.setFont('helvetica','bold'); doc.text(row[1],280,y); });
    doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.text(doc.splitTextToSize(text('pdfDisclaimer','Planning estimate only. Confirm classification, registration, invoicing, filing and remittance with GRA or a qualified tax adviser.'),500),48,340);
    doc.save('ghana-vat-estimate.pdf'); status.textContent = text('pdfReady', 'PDF downloaded locally.');
  });

  window.GHVatApp = { calculate: calculate, getResult: function () { return state.result; } };
  calculate();
})();
