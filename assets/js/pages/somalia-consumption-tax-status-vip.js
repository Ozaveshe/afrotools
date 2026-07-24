(function() {
  'use strict';
  function init() {
    var engine = window.AfroTools && window.AfroTools.SOConsumptionTaxStatus;
    if (!engine) return;
    var lang = (document.documentElement.lang || 'en').slice(0, 2);
    if (!/^(en|fr|sw)$/.test(lang)) lang = 'en';
    var copy = {
      en: {
        title: 'Somalia VAT status & consumption-tax evidence', lead: 'No current nationwide VAT rate could be verified from the Federal Government primary sources reviewed. This route is therefore an evidence reference, not a tax calculator.',
        status: 'Calculation disabled — no verified national VAT', current: 'What the 2026 federal evidence supports', currentBody: 'The FY2026 Budget Policy Framework lists named sales taxes for sectors such as hotels, telecommunications, electricity, airline tickets and imported goods. It does not establish one nationwide VAT rate.',
        historical: 'Separate 2023 turnover-tax publication', historicalBody: 'The federal turnover-tax policy publishes a USD-denominated small-business table. It is not VAT, and the evidence reviewed does not establish that table as a current 2026 liability rule.',
        low: 'Annual turnover of USD 10,000 or less', lowCharge: 'Published 2023 charge: USD 150 fixed', high: 'Annual turnover of USD 10,001 to 50,000', highCharge: 'Published 2023 charge: 1.5% of gross turnover',
        boundaries: 'Safety boundaries', b1: 'No zero-percent national VAT rate is asserted.', b2: 'No nationwide invoice currency is inferred.', b3: 'Budget proposals and collection estimates are not treated as enacted rates.', b4: 'Federal evidence does not determine Federal Member State or Somaliland treatment.',
        pdf: 'Download evidence-status PDF', share: 'Share safe link', verify: 'Sources & verification', report: 'Report an evidence error', note: 'For a real transaction, obtain the current written assessment, invoice requirement or rule from the competent revenue authority for the exact sector and jurisdiction.'
      },
      fr: {
        title: 'Statut TVA Somalie & preuves fiscales', lead: 'Aucun taux national de TVA actuel n’a pu être vérifié dans les sources primaires fédérales consultées. Cette route est donc une référence de preuves, pas un calculateur.',
        status: 'Calcul désactivé — aucun taux national vérifié', current: 'Ce que prouvent les données fédérales 2026', currentBody: 'Le cadre budgétaire 2026 énumère des taxes de vente par secteur, notamment hôtels, télécommunications, électricité, billets d’avion et importations. Il n’établit pas un taux national unique de TVA.',
        historical: 'Publication séparée de 2023 sur la taxe sur le chiffre d’affaires', historicalBody: 'La politique fédérale publie un tableau en USD pour les petites entreprises. Ce n’est pas une TVA et les preuves examinées ne l’établissent pas comme règle de dette fiscale actuelle en 2026.',
        low: 'Chiffre d’affaires annuel inférieur ou égal à 10 000 USD', lowCharge: 'Montant publié en 2023 : forfait de 150 USD', high: 'Chiffre d’affaires annuel de 10 001 à 50 000 USD', highCharge: 'Montant publié en 2023 : 1,5 % du chiffre d’affaires brut',
        boundaries: 'Limites de sécurité', b1: 'Aucun taux national nul de TVA n’est affirmé.', b2: 'Aucune monnaie nationale de facturation n’est déduite.', b3: 'Les propositions et prévisions budgétaires ne sont pas traitées comme des taux promulgués.', b4: 'Les preuves fédérales ne déterminent pas le traitement des États membres fédéraux ni du Somaliland.',
        pdf: 'Télécharger le PDF de statut', share: 'Partager le lien sûr', verify: 'Sources et vérification', report: 'Signaler une erreur de preuve', note: 'Pour une opération réelle, obtenez l’avis écrit, la règle de facture ou le texte actuel de l’autorité compétente pour le secteur et la juridiction exacts.'
      },
      sw: {
        title: 'Hali ya VAT Somalia & ushahidi wa kodi', lead: 'Hakuna kiwango cha sasa cha VAT ya taifa lote kilichothibitishwa katika vyanzo vya msingi vya Serikali ya Shirikisho vilivyokaguliwa. Hii ni rejea ya ushahidi, si kikokotoo.',
        status: 'Hesabu imezimwa — hakuna VAT ya taifa iliyothibitishwa', current: 'Ushahidi wa shirikisho wa 2026 unaunga mkono nini', currentBody: 'Mfumo wa Bajeti wa FY2026 unaorodhesha kodi za mauzo kwa sekta kama hoteli, mawasiliano, umeme, tiketi za ndege na bidhaa zilizoagizwa. Hauweki kiwango kimoja cha VAT ya taifa.',
        historical: 'Chapisho tofauti la kodi ya mauzo ya jumla la 2023', historicalBody: 'Sera ya shirikisho ina jedwali la biashara ndogo kwa USD. Si VAT, na ushahidi uliokaguliwa haujathibitisha jedwali hilo kama kanuni ya deni la sasa la 2026.',
        low: 'Mauzo ya mwaka ya USD 10,000 au chini', lowCharge: 'Tozo iliyochapishwa 2023: USD 150 ya kudumu', high: 'Mauzo ya mwaka ya USD 10,001 hadi 50,000', highCharge: 'Tozo iliyochapishwa 2023: 1.5% ya mauzo ghafi',
        boundaries: 'Mipaka ya usalama', b1: 'Hakuna VAT ya taifa yenye kiwango sifuri inayodaiwa.', b2: 'Hakuna sarafu ya ankara ya taifa inayokadiriwa.', b3: 'Mapendekezo na makadirio ya bajeti hayachukuliwi kuwa viwango vilivyotungwa.', b4: 'Ushahidi wa shirikisho hauamui matibabu ya Majimbo ya Shirikisho au Somaliland.',
        pdf: 'Pakua PDF ya hali ya ushahidi', share: 'Shiriki kiungo salama', verify: 'Vyanzo na uthibitisho', report: 'Ripoti hitilafu ya ushahidi', note: 'Kwa muamala halisi, pata tathmini, sharti la ankara au sheria ya sasa kwa maandishi kutoka mamlaka inayohusika na sekta na eneo hilo.'
      }
    };
    var t = copy[lang];
    document.querySelector('main').innerHTML =
      '<div class="gnv-shell"><section class="gnv-hero"><div class="gnv-kicker">Federal Government of Somalia · reviewed 23 July 2026</div><h1>' + t.title + '</h1><p class="gnv-lede">' + t.lead + '</p></section><div class="gnv-grid"><div>' +
      '<section class="gnv-card"><p class="gnv-error" role="status" aria-live="polite">' + t.status + '</p><h2>' + t.current + '</h2><p class="gnv-note">' + t.currentBody + '</p></section>' +
      '<section class="gnv-card"><h2>' + t.historical + '</h2><p class="gnv-note">' + t.historicalBody + '</p><dl><dt>' + t.low + '</dt><dd>' + t.lowCharge + '</dd><dt>' + t.high + '</dt><dd>' + t.highCharge + '</dd></dl></section>' +
      '<section class="gnv-card"><h2>' + t.boundaries + '</h2><ul class="gnv-list"><li>' + t.b1 + '</li><li>' + t.b2 + '</li><li>' + t.b3 + '</li><li>' + t.b4 + '</li></ul><p class="gnv-note">' + t.note + '</p><div class="gnv-actions"><button class="gnv-button gnv-primary" id="soPdf" type="button">' + t.pdf + '</button><button class="gnv-button" id="soShare" type="button">' + t.share + '</button></div><div id="soStatus" class="gnv-status" role="status" aria-live="polite"></div></section></div>' +
      '<aside class="gnv-card" data-tool-verification-panel data-tool-id="so-vat"><h2>' + t.verify + '</h2><p class="gnv-note"><strong>Reviewed: 23 July 2026</strong><br><a href="https://mof.gov.so/publications/fiscal-year-2026-budget-policy-framework-paper">Federal MoF · FY2026 Budget Policy Framework</a><br><a href="https://mof.gov.so/publications/xeer-nidaamiyaha-canshuurta-gedis-layda-turnover-tax">Federal MoF · 2023 Turnover Tax policy</a><br><a href="https://mof.gov.so/publications/inland-revenue">Federal MoF · Inland Revenue publications</a></p><p class="gnv-note"><a href="mailto:hello@afrotools.com?subject=Somalia%20consumption-tax%20evidence%20error">' + t.report + '</a></p></aside></div></div>';
    document.title = t.title + ' | AfroTools';
    document.getElementById('soShare').onclick = async function() { var url = location.origin + location.pathname; try { if (navigator.share) await navigator.share({ title: document.title, url: url }); else await navigator.clipboard.writeText(url); } catch (error) {} };
    document.getElementById('soPdf').onclick = function() {
      if (!window.jspdf) return;
      var pdf = new window.jspdf.jsPDF();
      pdf.text(t.title, 20, 20); pdf.text(pdf.splitTextToSize(t.lead, 170), 20, 32);
      pdf.text(t.current, 20, 58); pdf.text(pdf.splitTextToSize(t.currentBody, 170), 20, 68);
      pdf.text(t.historical, 20, 96); pdf.text(pdf.splitTextToSize(t.historicalBody, 170), 20, 106);
      pdf.text(t.low, 20, 134); pdf.text(t.lowCharge, 25, 144); pdf.text(t.high, 20, 156); pdf.text(t.highCharge, 25, 166);
      pdf.text(pdf.splitTextToSize(t.note, 170), 20, 184); pdf.save('somalia-consumption-tax-evidence-status.pdf');
      document.getElementById('soStatus').textContent = t.pdf + '.';
    };
    engine.getStatus();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
