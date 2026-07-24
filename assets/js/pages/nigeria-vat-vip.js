(function () {
  'use strict';
  var engine = window.AfroTools && window.AfroTools.NGVatEngine;
  var locale = window.NGVatLocale || {};
  if (!engine) return;

  var state = { mode: 'add', rate: engine.STANDARD_RATE, rateKind: 'standard', result: null };
  var byId = function (id) { return document.getElementById(id); };
  var amount = byId('ngvAmount');
  var custom = byId('ngvCustomRate');
  var resultBox = byId('ngvResult');
  var status = byId('ngvStatus');
  var error = byId('ngvError');

  function text(key, fallback) { return locale[key] || fallback; }
  function money(value) {
    return new Intl.NumberFormat(locale.numberLocale || 'en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }
  function setPressed(selector, active) {
    document.querySelectorAll(selector).forEach(function (button) { button.setAttribute('aria-pressed', String(button === active)); });
  }
  function currentRate() {
    if (state.rateKind !== 'scenario') return state.rate;
    return Number(custom.value);
  }
  function calculate() {
    try {
      state.result = engine.calculate({ amount: amount.value, mode: state.mode, rate: currentRate(), rateKind: state.rateKind });
      error.textContent = '';
      byId('ngvResultMain').textContent = money(state.mode === 'add' ? state.result.gross : state.result.net);
      byId('ngvNet').textContent = money(state.result.net);
      byId('ngvVat').textContent = money(state.result.vat);
      byId('ngvGross').textContent = money(state.result.gross);
      byId('ngvRateUsed').textContent = state.result.rate.toFixed(state.result.rate % 1 ? 2 : 0) + '%';
      byId('ngvResultLabel').textContent = state.mode === 'add' ? text('grossResult', 'Total including VAT') : text('netResult', 'Amount before VAT');
      byId('ngvResultNote').textContent = state.rateKind === 'scenario'
        ? text('scenarioNote', 'Planning scenario only. Confirm the statutory treatment before invoicing or filing.')
        : (state.result.rate === 0 ? text('zeroNote', '0% is only for supplies confirmed as zero-rated under NTA 2025 s187.') : text('standardNote', 'Standard-rate estimate under NTA 2025 s148.'));
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
    button.addEventListener('click', function () {
      state.mode = button.getAttribute('data-mode');
      setPressed('[data-mode]', button);
      calculate();
    });
  });
  document.querySelectorAll('[data-rate-kind]').forEach(function (button) {
    button.addEventListener('click', function () {
      state.rateKind = button.getAttribute('data-rate-kind');
      state.rate = state.rateKind === 'zero' ? 0 : engine.STANDARD_RATE;
      byId('ngvScenario').classList.toggle('on', state.rateKind === 'scenario');
      setPressed('[data-rate-kind]', button);
      calculate();
    });
  });
  byId('ngvForm').addEventListener('submit', function (event) { event.preventDefault(); calculate(); });
  amount.addEventListener('input', calculate);
  custom.addEventListener('input', function () { if (state.rateKind === 'scenario') calculate(); });

  byId('ngvClassification').addEventListener('change', function (event) {
    var treatment = engine.classify(event.target.value);
    var box = byId('ngvClassificationResult');
    box.className = 'ngv-treatment ' + treatment.treatment;
    var label = text('treatment_' + treatment.treatment, treatment.treatment);
    box.innerHTML = '<strong>' + label + '</strong><span>' + treatment.section + ' · ' + text('classificationCaveat', 'Confirm the exact invoice-level classification before relying on this guide.') + '</span>';
  });

  var invoiceStrings = {
    en: ['Invoice line', 'Price one line before issuing an invoice', 'Uses the currently selected standard, zero or planning rate above.', 'Description', 'Professional service', 'Quantity', 'Unit price · NGN', 'Calculate invoice line', 'Invoice line summary', 'Before VAT', 'VAT', 'Including VAT'],
    fr: ['Ligne de facture', 'Chiffrer une ligne avant facturation', 'Utilise le taux standard, zéro ou simulé sélectionné ci-dessus.', 'Description', 'Service professionnel', 'Quantité', 'Prix unitaire · NGN', 'Calculer la ligne', 'Résumé de ligne', 'Montant HT', 'TVA', 'Total TTC'],
    sw: ['Mstari wa ankara', 'Panga mstari mmoja kabla ya kutoa ankara', 'Hutumia kiwango cha kawaida, sifuri au mfano kilichochaguliwa hapo juu.', 'Maelezo', 'Huduma ya kitaalamu', 'Idadi', 'Bei ya kipimo · NGN', 'Kokotoa mstari wa ankara', 'Muhtasari wa mstari', 'Kabla ya VAT', 'VAT', 'Jumla na VAT']
  };
  var words = invoiceStrings[document.documentElement.lang] || invoiceStrings.en;
  var invoiceSection = document.createElement('section');
  invoiceSection.className = 'ngv-card'; invoiceSection.setAttribute('aria-labelledby', 'invoice-title');
  invoiceSection.innerHTML = '<div class="ngv-kicker">' + words[0] + '</div><h2 id="invoice-title">' + words[1] + '</h2><p>' + words[2] + '</p><form id="ngvInvoiceForm"><div class="ngv-field"><label for="ngvInvoiceDescription">' + words[3] + '</label><input class="ngv-input" id="ngvInvoiceDescription" value="' + words[4] + '"></div><div class="ngv-rate"><div class="ngv-field"><label for="ngvInvoiceQty">' + words[5] + '</label><input class="ngv-input" id="ngvInvoiceQty" type="number" min="0" step="0.01" value="1"></div><div class="ngv-field"><label for="ngvInvoiceUnit">' + words[6] + '</label><input class="ngv-input" id="ngvInvoiceUnit" type="number" min="0" step="0.01" value="100000"></div></div><div class="ngv-error" id="ngvInvoiceError"></div><button class="ngv-primary" type="submit">' + words[7] + '</button></form><div class="ngv-result" id="ngvInvoiceOutput" aria-live="polite"><div class="ngv-result-label">' + words[8] + '</div><div class="ngv-result-row"><span>' + words[9] + '</span><strong id="ngvInvoiceNet">—</strong></div><div class="ngv-result-row"><span>' + words[10] + '</span><strong id="ngvInvoiceVat">—</strong></div><div class="ngv-result-row"><span>' + words[11] + '</span><strong id="ngvInvoiceGross">—</strong></div></div>';
  byId('ngvClassification').closest('.ngv-card').before(invoiceSection);

  byId('ngvInvoiceForm').addEventListener('submit', function (event) {
    event.preventDefault();
    var invoiceError = byId('ngvInvoiceError');
    try {
      var invoice = engine.calculateInvoice([{ description: byId('ngvInvoiceDescription').value, quantity: byId('ngvInvoiceQty').value, unitPrice: byId('ngvInvoiceUnit').value }], currentRate(), state.rateKind);
      invoiceError.textContent = '';
      byId('ngvInvoiceNet').textContent = money(invoice.net);
      byId('ngvInvoiceVat').textContent = money(invoice.vat);
      byId('ngvInvoiceGross').textContent = money(invoice.gross);
      byId('ngvInvoiceOutput').classList.add('on');
    } catch (caught) {
      byId('ngvInvoiceOutput').classList.remove('on');
      invoiceError.textContent = text('invalidInvoice', 'Enter a non-negative quantity and unit price.');
    }
  });

  byId('ngvShare').addEventListener('click', async function () {
    var route = location.origin + location.pathname;
    try {
      if (navigator.share) await navigator.share({ title: document.title, url: route });
      else if (navigator.clipboard) await navigator.clipboard.writeText(route);
      status.textContent = text('shared', 'Tool link shared. No amounts were included.');
    } catch (caught) {
      if (caught && caught.name !== 'AbortError') status.textContent = text('shareFailed', 'Could not share the tool link.');
    }
  });

  byId('ngvPdf').addEventListener('click', function () {
    if (!state.result) calculate();
    if (!state.result || !window.jspdf || !window.jspdf.jsPDF) return;
    var doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4' });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.text(text('pdfTitle', 'Nigeria VAT planning estimate'), 48, 62);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text(text('pdfSource', 'Nigeria Tax Act 2025, sections 148, 186 and 187; reviewed 22 July 2026.'), 48, 82);
    doc.setFontSize(12);
    var rows = [
      [text('pdfMode', 'Mode'), state.mode === 'add' ? text('addVat', 'Add VAT') : text('extractVat', 'Extract VAT')],
      [text('net', 'Amount before VAT'), 'NGN ' + state.result.net.toFixed(2)],
      [text('vat', 'VAT'), 'NGN ' + state.result.vat.toFixed(2)],
      [text('gross', 'Total including VAT'), 'NGN ' + state.result.gross.toFixed(2)],
      [text('rateUsed', 'Rate used'), state.result.rate.toFixed(2) + '%']
    ];
    rows.forEach(function (row, index) { var y = 125 + index * 28; doc.setFont('helvetica', 'normal'); doc.text(row[0], 48, y); doc.setFont('helvetica', 'bold'); doc.text(row[1], 250, y); });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    var note = text('pdfDisclaimer', 'Planning estimate only. Confirm classification, registration, invoicing, filing and remittance with the Nigeria Revenue Service or a qualified tax adviser.');
    doc.text(doc.splitTextToSize(note, 500), 48, 290);
    doc.save('nigeria-vat-estimate.pdf');
    status.textContent = text('pdfReady', 'PDF downloaded locally.');
  });

  window.NGVatApp = { calculate: calculate, getResult: function () { return state.result; } };
  calculate();
})();
