(function () {
  'use strict';

  function init() {
    var engine = window.AfroTools && window.AfroTools.MRVatEngine;
    if (!engine) return;
    var lang = (document.documentElement.lang || 'en').slice(0, 2);
    if (!/^(en|fr|sw)$/.test(lang)) lang = 'en';
    var copy = {
      en: {
        title: 'Mauritania VAT calculator',
        lead: 'Add or extract VAT locally in MRU using the official tax code. Telephony, exports and exemptions stay locked until exact statutory evidence is confirmed.',
        amount: 'Amount', add: 'Add VAT', extract: 'Extract VAT', rate: 'VAT treatment',
        standard: 'Normal taxable supply — 16%', telephony: 'Confirmed telephony supply — 18%',
        export: 'Confirmed Article 230 export by a VAT taxpayer — 0%', exempt: 'Confirmed exact Article 215 item — exempt',
        confirm: 'I confirmed and retained the exact Article 230 or Article 215 evidence for this transaction.',
        calculate: 'Calculate', net: 'Amount before VAT', vat: 'VAT', gross: 'Amount including VAT',
        pdf: 'Download local PDF', share: 'Share safe link', rules: 'Current statutory boundaries',
        verify: 'Sources & verification', report: 'Report a calculation error',
        r1: 'CGI Article 230 sets 16% normally. The enacted 2023 rectifying finance law reinstated 18% for telephony.',
        r2: 'Article 230 applies 0% only to exports of goods or services made by a VAT-taxable person.',
        r3: 'Article 215 contains exact exemptions. This calculator never infers an exemption from a broad product category.',
        r4: 'Article 211 permits VAT invoicing at annual turnover excluding tax of at least MRU 3,000,000; importers are liable regardless of turnover.',
        r5: 'Articles 243, 249 and 250 govern invoice evidence and monthly returns, due by the 15th of the following month.',
        error: 'Enter a non-negative amount.', evidence: 'Confirm the exact official evidence first.',
        disclaimer: 'Planning estimate only. Confirm classification, exemption, registration, invoice evidence, deductions and filing with Mauritania DGI or a qualified adviser.'
      },
      fr: {
        title: 'Calculateur TVA Mauritanie',
        lead: 'Ajoutez ou extrayez localement la TVA en MRU selon le code fiscal officiel. Téléphonie, exportations et exonérations restent verrouillées sans preuve légale exacte.',
        amount: 'Montant', add: 'Ajouter la TVA', extract: 'Extraire la TVA', rate: 'Traitement TVA',
        standard: 'Opération taxable normale — 16 %', telephony: 'Téléphonie confirmée — 18 %',
        export: 'Exportation article 230 par un assujetti — 0 %', exempt: 'Élément exact de l’article 215 — exonéré',
        confirm: 'J’ai confirmé et conservé la preuve exacte de l’article 230 ou 215 pour cette opération.',
        calculate: 'Calculer', net: 'Montant hors TVA', vat: 'TVA', gross: 'Montant TVA comprise',
        pdf: 'Télécharger le PDF local', share: 'Partager le lien sûr', rules: 'Limites légales actuelles',
        verify: 'Sources et vérification', report: 'Signaler une erreur de calcul',
        r1: 'L’article 230 du CGI fixe le taux normal à 16 %. La loi de finances rectificative 2023 a rétabli 18 % pour la téléphonie.',
        r2: 'L’article 230 applique 0 % uniquement aux exportations de biens ou services réalisées par un assujetti.',
        r3: 'L’article 215 contient des exonérations précises. Le calculateur ne déduit jamais une exonération d’une catégorie générale.',
        r4: 'L’article 211 autorise la facturation de TVA à partir de 3 000 000 MRU de chiffre d’affaires annuel hors taxes ; les importateurs sont assujettis sans seuil.',
        r5: 'Les articles 243, 249 et 250 encadrent les preuves de facture et la déclaration mensuelle, au plus tard le 15 du mois suivant.',
        error: 'Saisissez un montant positif ou nul.', evidence: 'Confirmez d’abord la preuve officielle exacte.',
        disclaimer: 'Estimation de préparation uniquement. Confirmez le classement, l’exonération, l’immatriculation, les preuves de facture, les déductions et la déclaration auprès de la DGI Mauritanie ou d’un conseil qualifié.'
      },
      sw: {
        title: 'Kikokotoo cha VAT Mauritania',
        lead: 'Ongeza au toa VAT kwenye kifaa chako kwa MRU kwa kutumia sheria rasmi. Simu, mauzo ya nje na misamaha vimefungwa hadi ushahidi halisi wa sheria uthibitishwe.',
        amount: 'Kiasi', add: 'Ongeza VAT', extract: 'Toa VAT', rate: 'Aina ya VAT',
        standard: 'Muamala wa kawaida — 16%', telephony: 'Huduma ya simu iliyothibitishwa — 18%',
        export: 'Uuzaji nje wa Kifungu 230 na mlipa VAT — 0%', exempt: 'Kipengele halisi cha Kifungu 215 — msamaha',
        confirm: 'Nimethibitisha na kuhifadhi ushahidi halisi wa Kifungu 230 au 215 kwa muamala huu.',
        calculate: 'Kokotoa', net: 'Kiasi kabla ya VAT', vat: 'VAT', gross: 'Kiasi pamoja na VAT',
        pdf: 'Pakua PDF kwenye kifaa', share: 'Shiriki kiungo salama', rules: 'Mipaka ya sasa ya sheria',
        verify: 'Vyanzo na uthibitisho', report: 'Ripoti hitilafu ya hesabu',
        r1: 'Kifungu 230 kinaweka 16% kwa kawaida. Sheria ya fedha iliyorekebishwa ya 2023 ilirudisha 18% kwa huduma za simu.',
        r2: 'Kifungu 230 kinatumia 0% tu kwa mauzo ya bidhaa au huduma nje yanayofanywa na mlipa VAT.',
        r3: 'Kifungu 215 kina misamaha maalum. Kikokotoo hakibashiri msamaha kutoka kundi pana la bidhaa.',
        r4: 'Kifungu 211 kinaruhusu ankara ya VAT kuanzia mauzo ya mwaka bila kodi ya MRU 3,000,000; waagizaji hawana kizingiti.',
        r5: 'Vifungu 243, 249 na 250 vinaweka ushahidi wa ankara na tamko la kila mwezi, kufikia tarehe 15 ya mwezi unaofuata.',
        error: 'Weka kiasi kisicho hasi.', evidence: 'Thibitisha kwanza ushahidi rasmi na halisi.',
        disclaimer: 'Makadirio ya kupanga tu. Thibitisha uainishaji, msamaha, usajili, ushahidi wa ankara, makato na uwasilishaji na DGI Mauritania au mshauri mwenye sifa.'
      }
    };
    var text = copy[lang];
    var navbar = document.querySelector('afro-navbar');
    var footer = document.querySelector('afro-footer');
    var main = document.createElement('main');
    if (navbar && footer) {
      var node = navbar.nextSibling;
      while (node && node !== footer) {
        var next = node.nextSibling;
        node.remove();
        node = next;
      }
      footer.parentNode.insertBefore(main, footer);
    } else {
      var oldMain = document.querySelector('main');
      if (!oldMain) return;
      oldMain.replaceWith(main);
    }
    main.id = 'main-content';
    document.title = text.title + ' | AfroTools';
    main.innerHTML = '<div class="gnv-shell">' +
      '<section class="gnv-hero"><div class="gnv-kicker">DGI Mauritania · ' + text.rules + '</div><h1>' + text.title + '</h1><p class="gnv-lede">' + text.lead + '</p></section>' +
      '<div class="gnv-grid"><form class="gnv-card" id="mrvForm">' +
      '<div class="gnv-switch"><button class="gnv-button" type="button" data-mode="add" aria-pressed="true">' + text.add + '</button><button class="gnv-button" type="button" data-mode="extract" aria-pressed="false">' + text.extract + '</button></div>' +
      '<label class="gnv-field" for="mrvAmount">' + text.amount + ' (MRU)</label><input class="gnv-input" id="mrvAmount" type="number" min="0" step="0.01" inputmode="decimal" value="1000">' +
      '<label class="gnv-field" for="mrvRate">' + text.rate + '</label><select class="gnv-select" id="mrvRate"><option value="standard">' + text.standard + '</option><option value="confirmed-telephony">' + text.telephony + '</option><option value="confirmed-export-zero">' + text.export + '</option><option value="confirmed-article-215-exempt">' + text.exempt + '</option></select>' +
      '<label class="gnv-evidence" id="mrvEvidenceWrap" hidden><input id="mrvEvidence" type="checkbox"><span>' + text.confirm + '</span></label>' +
      '<button class="gnv-button gnv-primary" type="submit">' + text.calculate + '</button><p class="gnv-error" id="mrvError"></p>' +
      '<section class="gnv-result" id="mrvResult" aria-label="Result"><dl><dt>' + text.net + '</dt><dd id="mrvNet"></dd><dt>' + text.vat + '</dt><dd id="mrvVat"></dd><dt>' + text.gross + '</dt><dd id="mrvGross"></dd></dl><div class="gnv-actions"><button class="gnv-button" type="button" id="mrvPdf">' + text.pdf + '</button><button class="gnv-button" type="button" id="mrvShare">' + text.share + '</button></div></section><div class="gnv-status" id="mrvStatus" role="status" aria-live="polite"></div></form>' +
      '<aside class="gnv-card" data-tool-verification-panel data-tool-id="mr-vat"><h2>' + text.rules + '</h2><ul class="gnv-list"><li>' + text.r1 + '</li><li>' + text.r2 + '</li><li>' + text.r3 + '</li><li>' + text.r4 + '</li><li>' + text.r5 + '</li></ul><h2>' + text.verify + '</h2><p class="gnv-note"><a href="https://finances.gov.mr/sites/default/files/2023-03/CGI-Fr-2023.pdf">Mauritania Code général des impôts 2023</a><br><a href="https://www.finances.gov.mr/sites/default/files/2023-08/LFR%202023-FR%20Final%201%20-%20Copie_0.pdf">Loi de finances rectificative 2023</a><br><a href="https://finances.gov.mr/fr/node/745">Loi de finances 2026</a></p><p class="gnv-note">' + text.disclaimer + '</p><p class="gnv-note"><a href="mailto:hello@afrotools.com?subject=Mauritania%20VAT%20calculation%20error">' + text.report + '</a></p></aside></div></div>';

    var state = { mode: 'add', result: null };
    function byId(id) { return document.getElementById(id); }
    function money(value) {
      return new Intl.NumberFormat(lang === 'fr' ? 'fr-MR' : lang === 'sw' ? 'sw-TZ' : 'en-MR', { style: 'currency', currency: 'MRU', minimumFractionDigits: 2 }).format(value);
    }
    function evidenceFor(kind) {
      if (kind === 'confirmed-telephony') return engine.TELEPHONY_EVIDENCE;
      if (kind === 'confirmed-export-zero') return engine.EXPORT_EVIDENCE;
      if (kind === 'confirmed-article-215-exempt') return engine.EXEMPT_EVIDENCE;
      return null;
    }
    function calculate() {
      var kind = byId('mrvRate').value;
      try {
        state.result = engine.calculate({ amount: byId('mrvAmount').value, mode: state.mode, rateKind: kind, rateEvidenceConfirmed: byId('mrvEvidence').checked, rateEvidenceType: evidenceFor(kind) });
        byId('mrvError').textContent = '';
        byId('mrvNet').textContent = money(state.result.net);
        byId('mrvVat').textContent = money(state.result.vat);
        byId('mrvGross').textContent = money(state.result.gross);
        byId('mrvResult').classList.add('on');
      } catch (error) {
        state.result = null;
        byId('mrvResult').classList.remove('on');
        byId('mrvError').textContent = error.code === 'RATE_EVIDENCE_REQUIRED' ? text.evidence : text.error;
      }
      byId('mrvStatus').textContent = byId('mrvError').textContent || text.calculate + '.';
    }
    document.querySelectorAll('[data-mode]').forEach(function (button) {
      button.onclick = function () {
        state.mode = button.dataset.mode;
        document.querySelectorAll('[data-mode]').forEach(function (item) { item.setAttribute('aria-pressed', String(item === button)); });
        calculate();
      };
    });
    byId('mrvForm').onsubmit = function (event) { event.preventDefault(); calculate(); };
    byId('mrvAmount').oninput = calculate;
    byId('mrvRate').onchange = function () {
      byId('mrvEvidenceWrap').hidden = this.value === 'standard';
      byId('mrvEvidence').checked = false;
      calculate();
    };
    byId('mrvEvidence').onchange = calculate;
    byId('mrvShare').onclick = async function () {
      var url = location.origin + location.pathname;
      try {
        if (navigator.share) await navigator.share({ title: document.title, url: url });
        else await navigator.clipboard.writeText(url);
      } catch (error) {}
    };
    byId('mrvPdf').onclick = function () {
      if (!state.result || !window.jspdf) return;
      var pdf = new window.jspdf.jsPDF();
      pdf.text(text.title, 20, 20);
      pdf.text(text.rate + ': ' + byId('mrvRate').selectedOptions[0].textContent, 20, 32);
      pdf.text(text.net + ': ' + money(state.result.net), 20, 46);
      pdf.text(text.vat + ': ' + money(state.result.vat), 20, 56);
      pdf.text(text.gross + ': ' + money(state.result.gross), 20, 66);
      pdf.text(pdf.splitTextToSize(text.disclaimer, 170), 20, 84);
      pdf.save('mauritania-vat-estimate.pdf');
    };
    calculate();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
