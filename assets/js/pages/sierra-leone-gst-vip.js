(function() {
  'use strict';
  function init() {
    var engine = window.AfroTools && window.AfroTools.SLGstEngine;
    if (!engine) return;
    var lang = (document.documentElement.lang || 'en').slice(0, 2);
    if (!/^(en|fr|sw)$/.test(lang)) lang = 'en';
    var copy = {
      en: {
        title: 'Sierra Leone GST calculator & invoice', lead: 'Calculate Sierra Leone Goods and Services Tax locally in SLE (new leone / NLe). This tax is sometimes searched as VAT, but the statutory name is GST.',
        amount: 'Amount', add: 'Add GST', extract: 'Extract GST', treatment: 'GST treatment', standard: 'Standard taxable supply — 15%', zero: 'Exact current First Schedule zero-rated supply — 0%', exempt: 'Exact current Second Schedule exempt supply — no GST',
        zeroConfirm: 'I confirmed an exact current First Schedule zero-rated supply and retained transaction evidence.', exemptConfirm: 'I confirmed an exact current Second Schedule exempt supply and retained transaction evidence.',
        calculate: 'Calculate', net: 'Amount before GST', tax: 'GST', gross: 'Amount including GST', invoice: 'Two-line invoice check', normalLine: 'Standard line amount', specialLine: 'Special-treatment line amount', specialTreatment: 'Special line treatment', build: 'Calculate invoice',
        pdf: 'Download local PDF', share: 'Share safe link', boundaries: 'Current legal boundaries', verify: 'Sources & verification', report: 'Report a calculation error',
        r1: 'The standard GST rate is 15%.', r2: 'Zero-rated First Schedule and exempt Second Schedule supplies are different treatments and require exact current evidence.', r3: 'Compulsory registration is screened at NLe 500,000 over the past or expected next 12 months, or one third of that amount over the past 4 months.', r4: 'Finance Acts, including the 2026 Act, can change the Schedules; generic product categories are deliberately not inferred.',
        registration: 'Registration threshold screen', past12: 'Taxable supplies in the past 12 months', next12: 'Expected taxable supplies in the next 12 months', past4: 'Taxable supplies in the past 4 months', screen: 'Screen registration status',
        compulsory: 'Compulsory threshold met. Confirm timing and register with the NRA.', below: 'Below the modeled compulsory threshold. A voluntary application may be made, but approval is at the Commissioner-General’s discretion and is not automatic.',
        error: 'Enter non-negative SLE amounts.', evidence: 'Confirm the exact current Schedule evidence first.', disclaimer: 'Planning estimate only. Confirm the current Schedule item, registration timing and every GST obligation with the NRA or a qualified adviser.'
      },
      fr: {
        title: 'Calculateur GST Sierra Leone & facture', lead: 'Calculez localement la taxe sur les biens et services en SLE (nouveau leone / NLe). Elle est parfois recherchée comme TVA, mais son nom légal est GST.',
        amount: 'Montant', add: 'Ajouter la GST', extract: 'Extraire la GST', treatment: 'Traitement GST', standard: 'Opération taxable normale — 15 %', zero: 'Opération exacte à taux zéro de la première annexe actuelle — 0 %', exempt: 'Opération exacte exonérée de la deuxième annexe actuelle — sans GST',
        zeroConfirm: 'J’ai confirmé une opération exacte à taux zéro de la première annexe actuelle et conservé les justificatifs.', exemptConfirm: 'J’ai confirmé une opération exacte exonérée de la deuxième annexe actuelle et conservé les justificatifs.',
        calculate: 'Calculer', net: 'Montant hors GST', tax: 'GST', gross: 'Montant GST comprise', invoice: 'Contrôle de facture à deux lignes', normalLine: 'Montant de la ligne normale', specialLine: 'Montant de la ligne spéciale', specialTreatment: 'Traitement de la ligne spéciale', build: 'Calculer la facture',
        pdf: 'Télécharger le PDF local', share: 'Partager le lien sûr', boundaries: 'Limites légales actuelles', verify: 'Sources et vérification', report: 'Signaler une erreur de calcul',
        r1: 'Le taux normal de GST est de 15 %.', r2: 'Le taux zéro de la première annexe et l’exonération de la deuxième annexe sont distincts et exigent une preuve exacte.', r3: 'Le seuil obligatoire est NLe 500 000 sur les 12 derniers ou prochains mois, ou un tiers sur les 4 derniers mois.', r4: 'Les lois de finances, dont celle de 2026, peuvent modifier les annexes ; aucune catégorie générique n’est déduite.',
        registration: 'Contrôle du seuil d’immatriculation', past12: 'Opérations taxables des 12 derniers mois', next12: 'Opérations taxables prévues sur 12 mois', past4: 'Opérations taxables des 4 derniers mois', screen: 'Contrôler le statut',
        compulsory: 'Seuil obligatoire atteint. Confirmez le délai et inscrivez-vous auprès de la NRA.', below: 'Sous le seuil obligatoire modélisé. Une demande volontaire reste possible, mais dépend de la décision du Commissioner-General et n’est pas automatique.',
        error: 'Saisissez des montants SLE positifs ou nuls.', evidence: 'Confirmez d’abord la preuve exacte de l’annexe actuelle.', disclaimer: 'Estimation de préparation uniquement. Confirmez l’annexe, le délai et toute obligation GST auprès de la NRA ou d’un conseil qualifié.'
      },
      sw: {
        title: 'Kikokotoo cha GST Sierra Leone & ankara', lead: 'Kokotoa Goods and Services Tax ya Sierra Leone kwa SLE (leone mpya / NLe) kwenye kifaa chako. Watu wakati mwingine hutafuta VAT, lakini jina la kisheria ni GST.',
        amount: 'Kiasi', add: 'Ongeza GST', extract: 'Toa GST', treatment: 'Matibabu ya GST', standard: 'Muamala wa kawaida — 15%', zero: 'Muamala halisi wa Jedwali la Kwanza la sasa wenye kiwango sifuri — 0%', exempt: 'Muamala halisi uliosamehewa wa Jedwali la Pili la sasa — hakuna GST',
        zeroConfirm: 'Nimethibitisha muamala halisi wa kiwango sifuri katika Jedwali la Kwanza la sasa na kuhifadhi ushahidi.', exemptConfirm: 'Nimethibitisha muamala halisi uliosamehewa katika Jedwali la Pili la sasa na kuhifadhi ushahidi.',
        calculate: 'Kokotoa', net: 'Kiasi kabla ya GST', tax: 'GST', gross: 'Kiasi pamoja na GST', invoice: 'Ukaguzi wa ankara ya mistari miwili', normalLine: 'Kiasi cha mstari wa kawaida', specialLine: 'Kiasi cha mstari maalum', specialTreatment: 'Matibabu ya mstari maalum', build: 'Kokotoa ankara',
        pdf: 'Pakua PDF kwenye kifaa', share: 'Shiriki kiungo salama', boundaries: 'Mipaka ya sasa ya sheria', verify: 'Vyanzo na uthibitisho', report: 'Ripoti hitilafu ya hesabu',
        r1: 'Kiwango cha kawaida cha GST ni 15%.', r2: 'Kiwango sifuri cha Jedwali la Kwanza na msamaha wa Jedwali la Pili ni tofauti na vinahitaji ushahidi halisi.', r3: 'Usajili wa lazima unakaguliwa kwa NLe 500,000 kwa miezi 12 iliyopita au ijayo, au theluthi yake kwa miezi 4 iliyopita.', r4: 'Sheria za Fedha, ikiwemo ya 2026, zinaweza kubadili Majedwali; makundi ya jumla hayakadiriiwi.',
        registration: 'Ukaguzi wa kizingiti cha usajili', past12: 'Miamala inayotozwa ya miezi 12 iliyopita', next12: 'Miamala inayotarajiwa miezi 12 ijayo', past4: 'Miamala inayotozwa ya miezi 4 iliyopita', screen: 'Kagua hali ya usajili',
        compulsory: 'Kizingiti cha lazima kimefikiwa. Thibitisha muda na ujisajili kwa NRA.', below: 'Chini ya kizingiti cha lazima. Ombi la hiari linawezekana, lakini Commissioner-General ndiye huamua na si la moja kwa moja.',
        error: 'Weka kiasi cha SLE kisicho hasi.', evidence: 'Thibitisha kwanza ushahidi halisi wa Jedwali la sasa.', disclaimer: 'Makadirio ya kupanga tu. Thibitisha Jedwali la sasa, muda wa usajili na wajibu wote wa GST na NRA au mshauri mwenye sifa.'
      }
    };
    var t = copy[lang], state = { mode: 'add', result: null }, id = function(value) { return document.getElementById(value); };
    function evidenceLabel(kind) { return kind === 'confirmed-zero-rated' ? t.zeroConfirm : t.exemptConfirm; }
    document.querySelector('main').innerHTML =
      '<div class="gnv-shell"><section class="gnv-hero"><div class="gnv-kicker">NRA Sierra Leone · ' + t.boundaries + '</div><h1>' + t.title + '</h1><p class="gnv-lede">' + t.lead + '</p></section><div class="gnv-grid"><div>' +
      '<form class="gnv-card" id="slgForm"><div class="gnv-switch"><button class="gnv-button" type="button" data-mode="add" aria-pressed="true">' + t.add + '</button><button class="gnv-button" type="button" data-mode="extract" aria-pressed="false">' + t.extract + '</button></div><label class="gnv-field" for="slgAmount">' + t.amount + ' (SLE / NLe)</label><input class="gnv-input" id="slgAmount" type="number" min="0" step="0.01" inputmode="decimal" value="10000"><label class="gnv-field" for="slgRate">' + t.treatment + '</label><select class="gnv-select" id="slgRate"><option value="standard">' + t.standard + '</option><option value="confirmed-zero-rated">' + t.zero + '</option><option value="confirmed-exempt">' + t.exempt + '</option></select><label class="gnv-evidence" id="slgEvidenceWrap" hidden><input id="slgEvidence" type="checkbox"><span id="slgEvidenceText"></span></label><button class="gnv-button gnv-primary" type="submit">' + t.calculate + '</button><p class="gnv-error" id="slgError"></p><section class="gnv-result" id="slgResult"><dl><dt>' + t.net + '</dt><dd id="slgNet"></dd><dt>' + t.tax + '</dt><dd id="slgTax"></dd><dt>' + t.gross + '</dt><dd id="slgGross"></dd></dl><div class="gnv-actions"><button class="gnv-button" type="button" id="slgPdf">' + t.pdf + '</button><button class="gnv-button" type="button" id="slgShare">' + t.share + '</button></div></section><div class="gnv-status" id="slgStatus" role="status" aria-live="polite"></div></form>' +
      '<form class="gnv-card" id="slgInvoice"><h2>' + t.invoice + '</h2><label class="gnv-field" for="slgLine1">' + t.normalLine + ' (SLE)</label><input class="gnv-input" id="slgLine1" type="number" min="0" step="0.01" value="10000"><label class="gnv-field" for="slgLine2">' + t.specialLine + ' (SLE)</label><input class="gnv-input" id="slgLine2" type="number" min="0" step="0.01" value="5000"><label class="gnv-field" for="slgInvoiceTreatment">' + t.specialTreatment + '</label><select class="gnv-select" id="slgInvoiceTreatment"><option value="confirmed-zero-rated">' + t.zero + '</option><option value="confirmed-exempt">' + t.exempt + '</option></select><label class="gnv-evidence"><input id="slgLineEvidence" type="checkbox"><span id="slgLineEvidenceText">' + t.zeroConfirm + '</span></label><button class="gnv-button gnv-primary" type="submit">' + t.build + '</button><p class="gnv-error" id="slgInvoiceError"></p><section class="gnv-result" id="slgInvoiceResult"><dl><dt>' + t.net + '</dt><dd id="slgInvoiceNet"></dd><dt>' + t.tax + '</dt><dd id="slgInvoiceTax"></dd><dt>' + t.gross + '</dt><dd id="slgInvoiceGross"></dd></dl></section></form>' +
      '<form class="gnv-card" id="slgRegistration"><h2>' + t.registration + '</h2><label class="gnv-field" for="slgPast12">' + t.past12 + ' (SLE)</label><input class="gnv-input" id="slgPast12" type="number" min="0" step="0.01" value="0"><label class="gnv-field" for="slgNext12">' + t.next12 + ' (SLE)</label><input class="gnv-input" id="slgNext12" type="number" min="0" step="0.01" value="0"><label class="gnv-field" for="slgPast4">' + t.past4 + ' (SLE)</label><input class="gnv-input" id="slgPast4" type="number" min="0" step="0.01" value="0"><button class="gnv-button gnv-primary" type="submit">' + t.screen + '</button><p class="gnv-note" id="slgRegistrationResult" role="status" aria-live="polite"></p></form></div>' +
      '<aside class="gnv-card" data-tool-verification-panel data-tool-id="sl-vat"><h2>' + t.boundaries + '</h2><ul class="gnv-list"><li>' + t.r1 + '</li><li>' + t.r2 + '</li><li>' + t.r3 + '</li><li>' + t.r4 + '</li></ul><h2>' + t.verify + '</h2><p class="gnv-note"><strong>Reviewed: 23 July 2026</strong><br><a href="https://nra.gov.sl/dtd/1">NRA · Goods and Services Tax</a><br><a href="https://nra.gov.sl/tax-laws">NRA · GST Act and tax laws</a><br><a href="https://webtestcms.nra.gov.sl/uploads/The_Finance_Act_2024_0d6d83e684.pdf">Finance Act 2024 · registration threshold</a><br><a href="https://webtestcms.nra.gov.sl/uploads/The_Finance_Act_2026_121df05d9b.pdf">Finance Act 2026 · current Schedule amendments</a></p><p class="gnv-note">' + t.disclaimer + '</p><p class="gnv-note"><a href="mailto:hello@afrotools.com?subject=Sierra%20Leone%20GST%20calculation%20error">' + t.report + '</a></p></aside></div></div>';
    document.title = t.title + ' | AfroTools';
    var money = function(value) { return new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : lang === 'sw' ? 'sw-TZ' : 'en-SL', { style: 'currency', currency: 'SLE', currencyDisplay: 'code', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value); };
    function evidenceType(kind) { return kind === 'confirmed-zero-rated' ? engine.ZERO_EVIDENCE : kind === 'confirmed-exempt' ? engine.EXEMPT_EVIDENCE : null; }
    function calculate() {
      var kind = id('slgRate').value;
      try {
        state.result = engine.calculate({ amount: id('slgAmount').value, mode: state.mode, currency: 'SLE', rateKind: kind, rateEvidenceConfirmed: id('slgEvidence').checked, rateEvidenceType: evidenceType(kind) });
        id('slgError').textContent = '';
        id('slgNet').textContent = money(state.result.net); id('slgTax').textContent = money(state.result.gst); id('slgGross').textContent = money(state.result.gross);
        id('slgResult').classList.add('on');
      } catch (error) { state.result = null; id('slgResult').classList.remove('on'); id('slgError').textContent = error.code === 'RATE_EVIDENCE_REQUIRED' ? t.evidence : t.error; }
      id('slgStatus').textContent = id('slgError').textContent || t.calculate + '.';
    }
    document.querySelectorAll('[data-mode]').forEach(function(button) { button.onclick = function() { state.mode = button.dataset.mode; document.querySelectorAll('[data-mode]').forEach(function(item) { item.setAttribute('aria-pressed', String(item === button)); }); calculate(); }; });
    id('slgForm').onsubmit = function(event) { event.preventDefault(); calculate(); };
    id('slgAmount').oninput = calculate;
    id('slgRate').onchange = function() { var special = this.value !== 'standard'; id('slgEvidenceWrap').hidden = !special; id('slgEvidenceText').textContent = special ? evidenceLabel(this.value) : ''; id('slgEvidence').checked = false; calculate(); };
    id('slgEvidence').onchange = calculate;
    id('slgInvoiceTreatment').onchange = function() { id('slgLineEvidenceText').textContent = evidenceLabel(this.value); id('slgLineEvidence').checked = false; };
    id('slgInvoice').onsubmit = function(event) {
      event.preventDefault(); var kind = id('slgInvoiceTreatment').value;
      try {
        var result = engine.calculateInvoice([{ quantity: 1, unitPrice: id('slgLine1').value }, { quantity: 1, unitPrice: id('slgLine2').value, rateKind: kind, rateEvidenceConfirmed: id('slgLineEvidence').checked, rateEvidenceType: evidenceType(kind) }], 'SLE');
        id('slgInvoiceError').textContent = ''; id('slgInvoiceNet').textContent = money(result.net); id('slgInvoiceTax').textContent = money(result.gst); id('slgInvoiceGross').textContent = money(result.gross); id('slgInvoiceResult').classList.add('on');
      } catch (error) { id('slgInvoiceResult').classList.remove('on'); id('slgInvoiceError').textContent = error.code === 'RATE_EVIDENCE_REQUIRED' ? t.evidence : t.error; }
    };
    id('slgRegistration').onsubmit = function(event) {
      event.preventDefault();
      try { var result = engine.assessRegistration({ currency: 'SLE', pastTwelveMonths: id('slgPast12').value, expectedNextTwelveMonths: id('slgNext12').value, pastFourMonths: id('slgPast4').value }); id('slgRegistrationResult').textContent = result.compulsory ? t.compulsory : t.below; }
      catch (error) { id('slgRegistrationResult').textContent = t.error; }
    };
    id('slgShare').onclick = async function() { var url = location.origin + location.pathname; try { if (navigator.share) await navigator.share({ title: document.title, url: url }); else await navigator.clipboard.writeText(url); } catch (error) {} };
    id('slgPdf').onclick = function() {
      if (!state.result || !window.jspdf) return;
      var pdf = new window.jspdf.jsPDF(); pdf.text(t.title, 20, 20); pdf.text(t.treatment + ': ' + id('slgRate').selectedOptions[0].textContent, 20, 32);
      pdf.text(t.net + ': ' + money(state.result.net), 20, 46); pdf.text(t.tax + ': ' + money(state.result.gst), 20, 56); pdf.text(t.gross + ': ' + money(state.result.gross), 20, 66);
      pdf.text(pdf.splitTextToSize(t.disclaimer, 170), 20, 84); pdf.save('sierra-leone-gst-estimate.pdf');
    };
    calculate();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
