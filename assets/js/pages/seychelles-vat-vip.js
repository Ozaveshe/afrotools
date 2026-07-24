(function() {
  'use strict';
  function init() {
    var engine = window.AfroTools && window.AfroTools.SCVatEngine;
    if (!engine) return;
    var lang = (document.documentElement.lang || 'en').slice(0, 2);
    if (!/^(en|fr|sw)$/.test(lang)) lang = 'en';
    var copy = {
      en: {
        title: 'Seychelles VAT calculator & invoice', lead: 'Calculate VAT locally in SCR. Zero-rated and exempt treatments stay separate and locked until you confirm an exact current Schedule item and retain transaction evidence.',
        amount: 'Amount', add: 'Add VAT', extract: 'Extract VAT', treatment: 'VAT treatment', standard: 'Standard taxable supply — 15%', zero: 'Exact Second Schedule zero-rated supply — 0%', exempt: 'Exact First Schedule exempt supply — no VAT',
        zeroConfirm: 'I confirmed an exact current Second Schedule zero-rated supply and retained transaction evidence.', exemptConfirm: 'I confirmed an exact current First Schedule exempt supply and retained transaction evidence.',
        calculate: 'Calculate', net: 'Amount before VAT', vat: 'VAT', gross: 'Amount including VAT', invoice: 'Two-line invoice check', standardLine: 'Standard line amount', specialLine: 'Special-treatment line amount', invoiceTreatment: 'Special line treatment', buildInvoice: 'Calculate invoice',
        pdf: 'Download local PDF', share: 'Share safe link', boundaries: 'Current legal boundaries', verify: 'Sources & verification', report: 'Report a calculation error',
        r1: 'The standard VAT rate is 15%.', r2: 'Zero-rated and exempt are different legal treatments and require exact current Schedule evidence.', r3: 'Compulsory registration is screened at SCR 2,000,000; voluntary eligibility at SCR 100,000.', r4: 'The 2026 Budget deferred proposed VAT reforms to 2027; no new 2026 classification is inferred.',
        registration: 'Registration threshold screen', past12: 'Taxable supplies in the past 12 months', next12: 'Expected taxable supplies in the next 12 months', next6: 'Expected taxable supplies in the next 6 months', screen: 'Screen registration status',
        compulsory: 'Compulsory threshold met. Confirm timing and apply to SRC.', voluntary: 'Voluntary threshold met. Registration is subject to SRC review and is not automatic.', below: 'Below the modeled thresholds. Other legal criteria may still apply.',
        error: 'Enter non-negative amounts.', evidence: 'Confirm the exact current Schedule evidence first.', disclaimer: 'Planning estimate only. Confirm the exact Schedule item, registration timing and every VAT obligation with SRC or a qualified adviser.'
      },
      fr: {
        title: 'Calculateur TVA Seychelles & facture', lead: 'Calculez localement la TVA en SCR. Taux zéro et exonération restent distincts et verrouillés sans ligne exacte de l’annexe actuelle et justificatifs conservés.',
        amount: 'Montant', add: 'Ajouter la TVA', extract: 'Extraire la TVA', treatment: 'Traitement TVA', standard: 'Opération taxable normale — 15 %', zero: 'Opération exacte à taux zéro de la deuxième annexe — 0 %', exempt: 'Opération exacte exonérée de la première annexe — sans TVA',
        zeroConfirm: 'J’ai confirmé une opération exacte à taux zéro de la deuxième annexe actuelle et conservé les justificatifs.', exemptConfirm: 'J’ai confirmé une opération exacte exonérée de la première annexe actuelle et conservé les justificatifs.',
        calculate: 'Calculer', net: 'Montant hors TVA', vat: 'TVA', gross: 'Montant TVA comprise', invoice: 'Contrôle de facture à deux lignes', standardLine: 'Montant de la ligne normale', specialLine: 'Montant de la ligne spéciale', invoiceTreatment: 'Traitement de la ligne spéciale', buildInvoice: 'Calculer la facture',
        pdf: 'Télécharger le PDF local', share: 'Partager le lien sûr', boundaries: 'Limites légales actuelles', verify: 'Sources et vérification', report: 'Signaler une erreur de calcul',
        r1: 'Le taux normal de TVA est de 15 %.', r2: 'Taux zéro et exonération sont deux traitements distincts exigeant une preuve exacte de l’annexe actuelle.', r3: 'L’immatriculation obligatoire est contrôlée à 2 000 000 SCR et l’éligibilité volontaire à 100 000 SCR.', r4: 'Le budget 2026 a reporté les réformes TVA proposées à 2027 ; aucun nouveau classement 2026 n’est déduit.',
        registration: 'Contrôle des seuils d’immatriculation', past12: 'Opérations taxables des 12 derniers mois', next12: 'Opérations taxables prévues sur 12 mois', next6: 'Opérations taxables prévues sur 6 mois', screen: 'Contrôler le statut',
        compulsory: 'Seuil obligatoire atteint. Confirmez le délai et déposez la demande auprès de la SRC.', voluntary: 'Seuil volontaire atteint. L’accord de la SRC reste nécessaire et n’est pas automatique.', below: 'Sous les seuils modélisés. D’autres critères légaux peuvent s’appliquer.',
        error: 'Saisissez des montants positifs ou nuls.', evidence: 'Confirmez d’abord la preuve exacte de l’annexe actuelle.', disclaimer: 'Estimation de préparation uniquement. Confirmez l’annexe exacte, le délai d’immatriculation et toutes les obligations auprès de la SRC ou d’un conseil qualifié.'
      },
      sw: {
        title: 'Kikokotoo cha VAT Shelisheli & ankara', lead: 'Kokotoa VAT kwa SCR kwenye kifaa chako. Kiwango sifuri na msamaha vinabaki tofauti na vimefungwa bila kipengele halisi cha Jedwali la sasa na ushahidi wa muamala.',
        amount: 'Kiasi', add: 'Ongeza VAT', extract: 'Toa VAT', treatment: 'Matibabu ya VAT', standard: 'Muamala wa kawaida — 15%', zero: 'Muamala halisi wa Jedwali la Pili wenye kiwango sifuri — 0%', exempt: 'Muamala halisi uliosamehewa wa Jedwali la Kwanza — hakuna VAT',
        zeroConfirm: 'Nimethibitisha muamala halisi wa kiwango sifuri katika Jedwali la Pili la sasa na kuhifadhi ushahidi.', exemptConfirm: 'Nimethibitisha muamala halisi uliosamehewa katika Jedwali la Kwanza la sasa na kuhifadhi ushahidi.',
        calculate: 'Kokotoa', net: 'Kiasi kabla ya VAT', vat: 'VAT', gross: 'Kiasi pamoja na VAT', invoice: 'Ukaguzi wa ankara ya mistari miwili', standardLine: 'Kiasi cha mstari wa kawaida', specialLine: 'Kiasi cha mstari maalum', invoiceTreatment: 'Matibabu ya mstari maalum', buildInvoice: 'Kokotoa ankara',
        pdf: 'Pakua PDF kwenye kifaa', share: 'Shiriki kiungo salama', boundaries: 'Mipaka ya sasa ya sheria', verify: 'Vyanzo na uthibitisho', report: 'Ripoti hitilafu ya hesabu',
        r1: 'Kiwango cha kawaida cha VAT ni 15%.', r2: 'Kiwango sifuri na msamaha ni matibabu tofauti na yanahitaji ushahidi halisi wa Jedwali la sasa.', r3: 'Usajili wa lazima unakaguliwa kwa SCR 2,000,000; ustahiki wa hiari kwa SCR 100,000.', r4: 'Bajeti ya 2026 iliahirisha mapendekezo ya VAT hadi 2027; hakuna uainishaji mpya wa 2026 unaokadiriwa.',
        registration: 'Ukaguzi wa vizingiti vya usajili', past12: 'Miamala inayotozwa ya miezi 12 iliyopita', next12: 'Miamala inayotarajiwa miezi 12 ijayo', next6: 'Miamala inayotarajiwa miezi 6 ijayo', screen: 'Kagua hali ya usajili',
        compulsory: 'Kizingiti cha lazima kimefikiwa. Thibitisha muda na uombe kwa SRC.', voluntary: 'Kizingiti cha hiari kimefikiwa. Uamuzi wa SRC unahitajika na si wa moja kwa moja.', below: 'Chini ya vizingiti vilivyowekwa hapa. Masharti mengine ya sheria yanaweza kutumika.',
        error: 'Weka kiasi kisicho hasi.', evidence: 'Thibitisha kwanza ushahidi halisi wa Jedwali la sasa.', disclaimer: 'Makadirio ya kupanga tu. Thibitisha Jedwali halisi, muda wa usajili na wajibu wote na SRC au mshauri mwenye sifa.'
      }
    };
    var t = copy[lang], state = { mode: 'add', result: null, invoice: null }, id = function(value) { return document.getElementById(value); };
    function evidenceLabel(kind) { return kind === 'confirmed-zero-rated' ? t.zeroConfirm : t.exemptConfirm; }
    document.querySelector('main').innerHTML =
      '<div class="gnv-shell"><section class="gnv-hero"><div class="gnv-kicker">SRC Seychelles · ' + t.boundaries + '</div><h1>' + t.title + '</h1><p class="gnv-lede">' + t.lead + '</p></section><div class="gnv-grid"><div>' +
      '<form class="gnv-card" id="scvForm"><div class="gnv-switch"><button class="gnv-button" type="button" data-mode="add" aria-pressed="true">' + t.add + '</button><button class="gnv-button" type="button" data-mode="extract" aria-pressed="false">' + t.extract + '</button></div><label class="gnv-field" for="scvAmount">' + t.amount + ' (SCR)</label><input class="gnv-input" id="scvAmount" type="number" min="0" step="0.01" inputmode="decimal" value="10000"><label class="gnv-field" for="scvRate">' + t.treatment + '</label><select class="gnv-select" id="scvRate"><option value="standard">' + t.standard + '</option><option value="confirmed-zero-rated">' + t.zero + '</option><option value="confirmed-exempt">' + t.exempt + '</option></select><label class="gnv-evidence" id="scvEvidenceWrap" hidden><input id="scvEvidence" type="checkbox"><span id="scvEvidenceText"></span></label><button class="gnv-button gnv-primary" type="submit">' + t.calculate + '</button><p class="gnv-error" id="scvError"></p><section class="gnv-result" id="scvResult"><dl><dt>' + t.net + '</dt><dd id="scvNet"></dd><dt>' + t.vat + '</dt><dd id="scvVat"></dd><dt>' + t.gross + '</dt><dd id="scvGross"></dd></dl><div class="gnv-actions"><button class="gnv-button" type="button" id="scvPdf">' + t.pdf + '</button><button class="gnv-button" type="button" id="scvShare">' + t.share + '</button></div></section><div class="gnv-status" id="scvStatus" role="status" aria-live="polite"></div></form>' +
      '<form class="gnv-card" id="scvInvoice" style="margin-top:20px"><h2>' + t.invoice + '</h2><label class="gnv-field" for="scvLine1">' + t.standardLine + ' (SCR)</label><input class="gnv-input" id="scvLine1" type="number" min="0" step="0.01" value="10000"><label class="gnv-field" for="scvLine2">' + t.specialLine + ' (SCR)</label><input class="gnv-input" id="scvLine2" type="number" min="0" step="0.01" value="5000"><label class="gnv-field" for="scvInvoiceTreatment">' + t.invoiceTreatment + '</label><select class="gnv-select" id="scvInvoiceTreatment"><option value="confirmed-zero-rated">' + t.zero + '</option><option value="confirmed-exempt">' + t.exempt + '</option></select><label class="gnv-evidence"><input id="scvLineEvidence" type="checkbox"><span id="scvLineEvidenceText">' + t.zeroConfirm + '</span></label><button class="gnv-button gnv-primary" type="submit">' + t.buildInvoice + '</button><p class="gnv-error" id="scvInvoiceError"></p><section class="gnv-result" id="scvInvoiceResult"><dl><dt>' + t.net + '</dt><dd id="scvInvoiceNet"></dd><dt>' + t.vat + '</dt><dd id="scvInvoiceVat"></dd><dt>' + t.gross + '</dt><dd id="scvInvoiceGross"></dd></dl></section></form>' +
      '<form class="gnv-card" id="scvRegistration" style="margin-top:20px"><h2>' + t.registration + '</h2><label class="gnv-field" for="scvPast12">' + t.past12 + ' (SCR)</label><input class="gnv-input" id="scvPast12" type="number" min="0" step="1" value="0"><label class="gnv-field" for="scvNext12">' + t.next12 + ' (SCR)</label><input class="gnv-input" id="scvNext12" type="number" min="0" step="1" value="0"><label class="gnv-field" for="scvNext6">' + t.next6 + ' (SCR)</label><input class="gnv-input" id="scvNext6" type="number" min="0" step="1" value="0"><button class="gnv-button gnv-primary" type="submit">' + t.screen + '</button><p class="gnv-note" id="scvRegistrationResult" role="status" aria-live="polite"></p></form></div>' +
      '<aside class="gnv-card" data-tool-verification-panel data-tool-id="sc-vat"><h2>' + t.boundaries + '</h2><ul class="gnv-list"><li>' + t.r1 + '</li><li>' + t.r2 + '</li><li>' + t.r3 + '</li><li>' + t.r4 + '</li></ul><h2>' + t.verify + '</h2><p class="gnv-note"><strong>Reviewed: 23 July 2026</strong><br><a href="https://src.gov.sc/legislation/">SRC · VAT legislation hub</a><br><a href="https://src.gov.sc/wp-content/uploads/2025/10/Act-16-2024-Value-Added-Tax-Amendment-Act-2024.pdf">Act 16 of 2024</a><br><a href="https://src.gov.sc/wp-content/uploads/2024/12/SI-97-2024-Value-Added-Tax-Amendment-of-Fourth-Schedule-Regulations-2024.pdf">S.I. 97 of 2024 · registration thresholds</a><br><a href="https://www.src.gov.sc/wp-content/uploads/2022/12/VAT-Guideline.pdf">SRC VAT guideline</a></p><p class="gnv-note">' + t.disclaimer + '</p><p class="gnv-note"><a href="mailto:hello@afrotools.com?subject=Seychelles%20VAT%20calculation%20error">' + t.report + '</a></p></aside></div></div>';
    document.title = t.title + ' | AfroTools';
    var money = function(value) { return new Intl.NumberFormat(lang === 'fr' ? 'fr-SC' : lang === 'sw' ? 'sw-TZ' : 'en-SC', { style: 'currency', currency: 'SCR', currencyDisplay: 'code', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value); };
    function evidenceType(kind) { return kind === 'confirmed-zero-rated' ? engine.ZERO_EVIDENCE : kind === 'confirmed-exempt' ? engine.EXEMPT_EVIDENCE : null; }
    function calculate() {
      var kind = id('scvRate').value;
      try {
        state.result = engine.calculate({ amount: id('scvAmount').value, mode: state.mode, rateKind: kind, rateEvidenceConfirmed: id('scvEvidence').checked, rateEvidenceType: evidenceType(kind) });
        id('scvError').textContent = '';
        ['Net', 'Vat', 'Gross'].forEach(function(key) { id('scv' + key).textContent = money(state.result[key.toLowerCase()]); });
        id('scvResult').classList.add('on');
      } catch (error) {
        state.result = null; id('scvResult').classList.remove('on'); id('scvError').textContent = error.code === 'RATE_EVIDENCE_REQUIRED' ? t.evidence : t.error;
      }
      id('scvStatus').textContent = id('scvError').textContent || t.calculate + '.';
    }
    document.querySelectorAll('[data-mode]').forEach(function(button) { button.onclick = function() { state.mode = button.dataset.mode; document.querySelectorAll('[data-mode]').forEach(function(item) { item.setAttribute('aria-pressed', String(item === button)); }); calculate(); }; });
    id('scvForm').onsubmit = function(event) { event.preventDefault(); calculate(); };
    id('scvAmount').oninput = calculate;
    id('scvRate').onchange = function() { var special = this.value !== 'standard'; id('scvEvidenceWrap').hidden = !special; id('scvEvidenceText').textContent = special ? evidenceLabel(this.value) : ''; id('scvEvidence').checked = false; calculate(); };
    id('scvEvidence').onchange = calculate;
    id('scvInvoiceTreatment').onchange = function() { id('scvLineEvidenceText').textContent = evidenceLabel(this.value); id('scvLineEvidence').checked = false; };
    id('scvInvoice').onsubmit = function(event) {
      event.preventDefault();
      var kind = id('scvInvoiceTreatment').value;
      try {
        state.invoice = engine.calculateInvoice([{ quantity: 1, unitPrice: id('scvLine1').value }, { quantity: 1, unitPrice: id('scvLine2').value, rateKind: kind, rateEvidenceConfirmed: id('scvLineEvidence').checked, rateEvidenceType: evidenceType(kind) }]);
        id('scvInvoiceError').textContent = '';
        ['Net', 'Vat', 'Gross'].forEach(function(key) { id('scvInvoice' + key).textContent = money(state.invoice[key.toLowerCase()]); });
        id('scvInvoiceResult').classList.add('on');
      } catch (error) {
        state.invoice = null; id('scvInvoiceResult').classList.remove('on'); id('scvInvoiceError').textContent = error.code === 'RATE_EVIDENCE_REQUIRED' ? t.evidence : t.error;
      }
    };
    id('scvRegistration').onsubmit = function(event) {
      event.preventDefault();
      try {
        var result = engine.assessRegistration({ pastTwelveMonths: id('scvPast12').value, expectedNextTwelveMonths: id('scvNext12').value, expectedNextSixMonths: id('scvNext6').value });
        id('scvRegistrationResult').textContent = result.compulsory ? t.compulsory : result.voluntaryEligible ? t.voluntary : t.below;
      } catch (error) { id('scvRegistrationResult').textContent = t.error; }
    };
    id('scvShare').onclick = async function() { var url = location.origin + location.pathname; try { if (navigator.share) await navigator.share({ title: document.title, url: url }); else await navigator.clipboard.writeText(url); } catch (error) {} };
    id('scvPdf').onclick = function() {
      if (!state.result || !window.jspdf) return;
      var pdf = new window.jspdf.jsPDF();
      pdf.text(t.title, 20, 20); pdf.text(t.treatment + ': ' + id('scvRate').selectedOptions[0].textContent, 20, 32);
      pdf.text(t.net + ': ' + money(state.result.net), 20, 46); pdf.text(t.vat + ': ' + money(state.result.vat), 20, 56); pdf.text(t.gross + ': ' + money(state.result.gross), 20, 66);
      pdf.text(pdf.splitTextToSize(t.disclaimer, 170), 20, 84); pdf.save('seychelles-vat-estimate.pdf');
    };
    calculate();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
