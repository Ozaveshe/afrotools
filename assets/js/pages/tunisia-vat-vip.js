(function () {
  "use strict";

  function init() {
    var engine = window.AfroTools && window.AfroTools.TNVatEngine;
    if (!engine) return;
    var locale = (document.documentElement.lang || "en").slice(0, 2);
    if (!/^(en|fr|sw)$/.test(locale)) locale = "en";
    var copy = {
      en: {
        title: "Tunisia VAT calculator",
        lead: "Add or extract Tunisia's official 19% general VAT rate locally in Tunisian dinars. The rate follows the Ministry of Finance's current tax overview and the 2026 Finance Law publication.",
        kicker: "Tunisia Ministry of Finance · reviewed 23 July 2026",
        add: "Add VAT", extract: "Extract VAT", amount: "Amount", calculate: "Calculate",
        net: "Amount before VAT", vat: "VAT at 19%", gross: "Amount including VAT",
        pdf: "Download local PDF", share: "Share safe link", rules: "What this calculator does",
        r1: "Uses the official 19% general VAT rate for transactions already confirmed as subject to that rate.",
        r2: "Add mode multiplies the net amount by 19%; extract mode divides the VAT-inclusive amount by 1.19.",
        r3: "Amounts stay in this browser. They are not stored, sent to AfroTools, or placed in the shared link.",
        r4: "Reduced-rate eligibility, exemptions, exports, suspension regimes, withholding, registration, filing, invoice compliance and input-tax eligibility are outside this calculator.",
        sources: "Sources & verification", report: "Report calculation error",
        sourceOverview: "Ministry current tax overview", sourceLaw: "Tunisia Finance Law 2026", sourceCode: "Official VAT Code framework",
        error: "Enter a non-negative amount.", ready: "Result updated.",
        disclaimer: "Planning estimate for a general-rate transaction only. Confirm the exact transaction treatment and current obligations with the Ministry of Finance, tax administration or a qualified adviser."
      },
      fr: {
        title: "Calculateur TVA Tunisie",
        lead: "Ajoutez ou extrayez localement le taux général officiel de TVA de 19 % en dinars tunisiens. Le taux suit l'aperçu fiscal actuel du ministère des Finances et la publication de la loi de finances 2026.",
        kicker: "Ministère des Finances tunisien · vérifié le 23 juillet 2026",
        add: "Ajouter la TVA", extract: "Extraire la TVA", amount: "Montant", calculate: "Calculer",
        net: "Montant hors TVA", vat: "TVA à 19 %", gross: "Montant TVA comprise",
        pdf: "Télécharger le PDF local", share: "Partager le lien sûr", rules: "Ce que fait ce calculateur",
        r1: "Utilise le taux général officiel de 19 % pour les opérations déjà confirmées comme soumises à ce taux.",
        r2: "Le mode Ajouter multiplie le montant HT par 19 % ; le mode Extraire divise le montant TTC par 1,19.",
        r3: "Les montants restent dans ce navigateur. Ils ne sont ni stockés, ni envoyés à AfroTools, ni ajoutés au lien partagé.",
        r4: "Éligibilité aux taux réduits, exonérations, exportations, régimes suspensifs, retenues, immatriculation, déclaration, conformité des factures et droit à déduction restent hors périmètre.",
        sources: "Sources et vérification", report: "Signaler une erreur de calcul",
        sourceOverview: "Aperçu fiscal actuel du ministère", sourceLaw: "Loi de finances tunisienne 2026", sourceCode: "Cadre officiel du Code de la TVA",
        error: "Saisissez un montant positif ou nul.", ready: "Résultat mis à jour.",
        disclaimer: "Estimation de préparation pour une opération au taux général uniquement. Confirmez le traitement exact et les obligations actuelles auprès du ministère des Finances, de l'administration fiscale ou d'un conseil qualifié."
      },
      sw: {
        title: "Kikokotoo cha VAT Tunisia",
        lead: "Ongeza au toa kiwango rasmi cha jumla cha VAT cha Tunisia cha 19% kwa faragha kwa dinari za Tunisia. Kiwango kinafuata muhtasari wa sasa wa kodi wa Wizara ya Fedha na chapisho la Sheria ya Fedha 2026.",
        kicker: "Wizara ya Fedha Tunisia · imekaguliwa 23 Julai 2026",
        add: "Ongeza VAT", extract: "Toa VAT", amount: "Kiasi", calculate: "Kokotoa",
        net: "Kiasi kabla ya VAT", vat: "VAT kwa 19%", gross: "Kiasi pamoja na VAT",
        pdf: "Pakua PDF kwenye kifaa", share: "Shiriki kiungo salama", rules: "Kikokotoo hiki kinafanya nini",
        r1: "Kinatumia kiwango rasmi cha jumla cha VAT cha 19% kwa miamala iliyothibitishwa kuwa chini ya kiwango hicho.",
        r2: "Hali ya Kuongeza huzidisha kiasi kabla ya VAT kwa 19%; hali ya Kutoa hugawa kiasi chenye VAT kwa 1.19.",
        r3: "Kiasi hubaki kwenye kivinjari hiki. Hakihifadhiwi, hakitumwi AfroTools, wala kuwekwa kwenye kiungo cha kushiriki.",
        r4: "Uhalali wa viwango vilivyopunguzwa, misamaha, mauzo ya nje, kusimamishwa kwa kodi, zuio, usajili, uwasilishaji, kanuni za ankara na haki ya makato haviamuliwi hapa.",
        sources: "Vyanzo na uthibitisho", report: "Ripoti hitilafu ya hesabu",
        sourceOverview: "Muhtasari wa sasa wa kodi wa Wizara", sourceLaw: "Sheria ya Fedha ya Tunisia 2026", sourceCode: "Mfumo rasmi wa Kanuni ya VAT",
        error: "Weka kiasi kisicho hasi.", ready: "Matokeo yamesasishwa.",
        disclaimer: "Makadirio ya kupanga muamala wa kiwango cha jumla pekee. Thibitisha matibabu halisi na wajibu wa sasa na Wizara ya Fedha, mamlaka ya kodi au mshauri mwenye sifa."
      }
    }[locale];

    var nav = document.querySelector("afro-navbar");
    var footer = document.querySelector("afro-footer");
    var main = document.createElement("main");
    if (nav && footer) {
      var node = nav.nextSibling;
      while (node && node !== footer) {
        var next = node.nextSibling;
        node.remove();
        node = next;
      }
      footer.parentNode.insertBefore(main, footer);
    } else {
      var oldMain = document.querySelector("main");
      if (!oldMain) return;
      oldMain.replaceWith(main);
    }
    main.id = "main-content";
    main.tabIndex = -1;
    document.title = copy.title + " | AfroTools";
    main.innerHTML =
      '<div class="gnv-shell"><section class="gnv-hero"><div class="gnv-kicker">' + copy.kicker + '</div><h1>' + copy.title + '</h1><p class="gnv-lede">' + copy.lead + '</p></section><div class="gnv-grid">' +
      '<form class="gnv-card" id="tnVatForm"><div class="gnv-switch" role="group" aria-label="VAT calculation mode"><button class="gnv-button" type="button" data-mode="add" aria-pressed="true">' + copy.add + '</button><button class="gnv-button" type="button" data-mode="extract" aria-pressed="false">' + copy.extract + '</button></div><label class="gnv-field" for="tnVatAmount">' + copy.amount + ' (TND)</label><input class="gnv-input" id="tnVatAmount" name="amount" type="number" min="0" step="0.001" inputmode="decimal" value="1000" autocomplete="off"><button class="gnv-button gnv-primary" type="submit">' + copy.calculate + '</button><p class="gnv-error" id="tnVatError"></p><section class="gnv-result" id="tnVatResult" aria-label="VAT result"><dl><dt>' + copy.net + '</dt><dd id="tnVatNet"></dd><dt>' + copy.vat + '</dt><dd id="tnVatTax"></dd><dt>' + copy.gross + '</dt><dd id="tnVatGross"></dd></dl><div class="gnv-actions"><button class="gnv-button" type="button" id="tnVatPdf">' + copy.pdf + '</button><button class="gnv-button" type="button" id="tnVatShare">' + copy.share + '</button></div></section><div class="gnv-status" id="tnVatStatus" role="status" aria-live="polite"></div></form>' +
      '<aside class="gnv-card" data-tool-verification-panel data-tool-id="tn-vat"><h2>' + copy.rules + '</h2><ul class="gnv-list"><li>' + copy.r1 + '</li><li>' + copy.r2 + '</li><li>' + copy.r3 + '</li><li>' + copy.r4 + '</li></ul><h2>' + copy.sources + '</h2><p class="gnv-note"><a href="https://www.finances.gov.tn/ar/lmht-amwt">' + copy.sourceOverview + '</a><br><a href="https://www.finances.gov.tn/fr/document/loi-des-finances-pour-lannee-2026-ar">' + copy.sourceLaw + '</a><br><a href="https://www.finances.gov.tn/sites/default/files/CODE%20TVA%202017%20FR.pdf">' + copy.sourceCode + '</a></p><p class="gnv-note">' + copy.disclaimer + '</p><p class="gnv-note"><a href="mailto:hello@afrotools.com?subject=Tunisia%20VAT%20calculation%20error">' + copy.report + '</a></p></aside></div></div>';

    var state = { mode: "add", result: null };
    function byId(id) { return document.getElementById(id); }
    function money(value) {
      return new Intl.NumberFormat(locale === "fr" ? "fr-TN" : locale === "sw" ? "sw-TZ" : "en-TN", {
        style: "currency", currency: "TND", currencyDisplay: "code", minimumFractionDigits: 3, maximumFractionDigits: 3
      }).format(value);
    }
    function calculate() {
      try {
        state.result = engine.calculate({ amount: byId("tnVatAmount").value, mode: state.mode });
        byId("tnVatError").textContent = "";
        byId("tnVatNet").textContent = money(state.result.net);
        byId("tnVatTax").textContent = money(state.result.vat);
        byId("tnVatGross").textContent = money(state.result.gross);
        byId("tnVatResult").classList.add("on");
        byId("tnVatStatus").textContent = copy.ready;
      } catch (error) {
        state.result = null;
        byId("tnVatResult").classList.remove("on");
        byId("tnVatError").textContent = copy.error;
        byId("tnVatStatus").textContent = copy.error;
      }
    }
    document.querySelectorAll("[data-mode]").forEach(function (button) {
      button.onclick = function () {
        state.mode = button.dataset.mode;
        document.querySelectorAll("[data-mode]").forEach(function (item) {
          item.setAttribute("aria-pressed", String(item === button));
        });
        calculate();
      };
    });
    byId("tnVatForm").onsubmit = function (event) { event.preventDefault(); calculate(); };
    byId("tnVatAmount").oninput = calculate;
    byId("tnVatShare").onclick = async function () {
      var url = location.origin + location.pathname;
      try {
        if (navigator.share) await navigator.share({ title: document.title, url: url });
        else await navigator.clipboard.writeText(url);
        byId("tnVatStatus").textContent = copy.share + ".";
      } catch (error) {
        if (error.name !== "AbortError") byId("tnVatStatus").textContent = copy.error;
      }
    };
    byId("tnVatPdf").onclick = function () {
      if (!state.result || !window.jspdf) return;
      var pdf = new window.jspdf.jsPDF();
      pdf.setProperties({ title: copy.title, subject: "Tunisia general VAT planning estimate at 19%" });
      pdf.text(copy.title, 20, 20);
      pdf.text("Official general rate: 19% | Currency: TND", 20, 32);
      pdf.text(copy.net + ": " + money(state.result.net), 20, 48);
      pdf.text(copy.vat + ": " + money(state.result.vat), 20, 59);
      pdf.text(copy.gross + ": " + money(state.result.gross), 20, 70);
      pdf.text(pdf.splitTextToSize(copy.disclaimer, 170), 20, 88);
      pdf.text("Sources reviewed 2026-07-23: Tunisia Ministry of Finance", 20, 116);
      pdf.save("tunisia-vat-19-percent-estimate.pdf");
      byId("tnVatStatus").textContent = copy.pdf + ".";
    };
    calculate();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
