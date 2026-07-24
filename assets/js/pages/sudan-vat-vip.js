(function () {
  "use strict";

  function init() {
    var engine = window.AfroTools && window.AfroTools.SDVatEngine;
    if (!engine) return;
    var locale = (document.documentElement.lang || "en").slice(0, 2);
    if (!/^(en|fr|sw)$/.test(locale)) locale = "en";
    var copy = {
      en: {
        title: "Sudan VAT calculator",
        lead: "Add or extract Sudan's standard 17% VAT locally in Sudanese pounds. The rate is anchored to the Tax Authority's 28 March 2026 clarification.",
        kicker: "Sudan Tax Authority · reviewed 23 July 2026",
        add: "Add VAT", extract: "Extract VAT", amount: "Amount", calculate: "Calculate",
        net: "Amount before VAT", vat: "VAT at 17%", gross: "Amount including VAT",
        pdf: "Download local PDF", share: "Share safe link", rules: "What this calculator does",
        r1: "Uses the official fixed standard VAT rate of 17% for standard-rate planning arithmetic.",
        r2: "Add mode multiplies the net amount by 17%; extract mode divides the VAT-inclusive amount by 1.17.",
        r3: "Amounts stay in this browser. They are not stored, sent to AfroTools, or placed in the shared link.",
        r4: "Exemptions, zero-rating, registration, filing, invoice compliance and input-tax eligibility are outside this calculator.",
        sources: "Sources & verification", report: "Report calculation error", sourceNews: "Tax Authority clarification · 28 March 2026",
        sourceVat: "Tax Authority VAT scope and procedure", sourceLaw: "VAT laws and regulations",
        error: "Enter a non-negative amount.", ready: "Result updated.", disclaimer: "Planning estimate only. Confirm the exact transaction treatment and current obligations with the Sudan Tax Authority or a qualified adviser."
      },
      fr: {
        title: "Calculateur TVA Soudan",
        lead: "Ajoutez ou extrayez localement la TVA normale soudanaise de 17 % en livres soudanaises. Le taux suit la clarification de l'Autorité fiscale du 28 mars 2026.",
        kicker: "Autorité fiscale du Soudan · vérifié le 23 juillet 2026",
        add: "Ajouter la TVA", extract: "Extraire la TVA", amount: "Montant", calculate: "Calculer",
        net: "Montant hors TVA", vat: "TVA à 17 %", gross: "Montant TVA comprise",
        pdf: "Télécharger le PDF local", share: "Partager le lien sûr", rules: "Ce que fait ce calculateur",
        r1: "Utilise le taux normal fixe officiel de 17 % pour une estimation au taux normal.",
        r2: "Le mode Ajouter multiplie le montant HT par 17 % ; le mode Extraire divise le montant TTC par 1,17.",
        r3: "Les montants restent dans ce navigateur. Ils ne sont ni stockés, ni envoyés à AfroTools, ni ajoutés au lien partagé.",
        r4: "Exonérations, taux zéro, immatriculation, déclaration, conformité des factures et droit à déduction restent hors périmètre.",
        sources: "Sources et vérification", report: "Signaler une erreur de calcul", sourceNews: "Clarification de l'Autorité fiscale · 28 mars 2026",
        sourceVat: "Champ et procédures de TVA", sourceLaw: "Lois et règlements de TVA",
        error: "Saisissez un montant positif ou nul.", ready: "Résultat mis à jour.", disclaimer: "Estimation de préparation uniquement. Confirmez le traitement exact et les obligations actuelles auprès de l'Autorité fiscale du Soudan ou d'un conseil qualifié."
      },
      sw: {
        title: "Kikokotoo cha VAT Sudan",
        lead: "Ongeza au toa VAT ya kawaida ya Sudan ya 17% kwa faragha katika pauni za Sudan. Kiwango kinategemea ufafanuzi wa Mamlaka ya Kodi wa 28 Machi 2026.",
        kicker: "Mamlaka ya Kodi Sudan · imekaguliwa 23 Julai 2026",
        add: "Ongeza VAT", extract: "Toa VAT", amount: "Kiasi", calculate: "Kokotoa",
        net: "Kiasi kabla ya VAT", vat: "VAT kwa 17%", gross: "Kiasi pamoja na VAT",
        pdf: "Pakua PDF kwenye kifaa", share: "Shiriki kiungo salama", rules: "Kikokotoo hiki kinafanya nini",
        r1: "Kinatumia kiwango rasmi cha kawaida cha VAT cha 17% kwa makadirio ya kiwango cha kawaida.",
        r2: "Hali ya Kuongeza huzidisha kiasi kabla ya VAT kwa 17%; hali ya Kutoa hugawa kiasi chenye VAT kwa 1.17.",
        r3: "Kiasi hubaki kwenye kivinjari hiki. Hakihifadhiwi, hakitumwi AfroTools, wala kuwekwa kwenye kiungo cha kushiriki.",
        r4: "Misamaha, kiwango sifuri, usajili, uwasilishaji, ufuataji wa ankara na haki ya makato haviamuliwi hapa.",
        sources: "Vyanzo na uthibitisho", report: "Ripoti hitilafu ya hesabu", sourceNews: "Ufafanuzi wa Mamlaka ya Kodi · 28 Machi 2026",
        sourceVat: "Wigo na taratibu za VAT", sourceLaw: "Sheria na kanuni za VAT",
        error: "Weka kiasi kisicho hasi.", ready: "Matokeo yamesasishwa.", disclaimer: "Makadirio ya kupanga tu. Thibitisha aina ya muamala na wajibu wa sasa na Mamlaka ya Kodi Sudan au mshauri mwenye sifa."
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
      '<form class="gnv-card" id="sdVatForm"><div class="gnv-switch" role="group" aria-label="VAT calculation mode"><button class="gnv-button" type="button" data-mode="add" aria-pressed="true">' + copy.add + '</button><button class="gnv-button" type="button" data-mode="extract" aria-pressed="false">' + copy.extract + '</button></div><label class="gnv-field" for="sdVatAmount">' + copy.amount + ' (SDG)</label><input class="gnv-input" id="sdVatAmount" name="amount" type="number" min="0" step="0.01" inputmode="decimal" value="1000" autocomplete="off"><button class="gnv-button gnv-primary" type="submit">' + copy.calculate + '</button><p class="gnv-error" id="sdVatError"></p><section class="gnv-result" id="sdVatResult" aria-label="VAT result"><dl><dt>' + copy.net + '</dt><dd id="sdVatNet"></dd><dt>' + copy.vat + '</dt><dd id="sdVatTax"></dd><dt>' + copy.gross + '</dt><dd id="sdVatGross"></dd></dl><div class="gnv-actions"><button class="gnv-button" type="button" id="sdVatPdf">' + copy.pdf + '</button><button class="gnv-button" type="button" id="sdVatShare">' + copy.share + '</button></div></section><div class="gnv-status" id="sdVatStatus" role="status" aria-live="polite"></div></form>' +
      '<aside class="gnv-card" data-tool-verification-panel data-tool-id="sd-vat"><h2>' + copy.rules + '</h2><ul class="gnv-list"><li>' + copy.r1 + '</li><li>' + copy.r2 + '</li><li>' + copy.r3 + '</li><li>' + copy.r4 + '</li></ul><h2>' + copy.sources + '</h2><p class="gnv-note"><a href="https://tax.gov.sd/en/newsen/">' + copy.sourceNews + '</a><br><a href="https://tax.gov.sd/en/value-added-tax-vat/">' + copy.sourceVat + '</a><br><a href="https://tax.gov.sd/en/tax-laws/">' + copy.sourceLaw + '</a></p><p class="gnv-note">' + copy.disclaimer + '</p><p class="gnv-note"><a href="mailto:hello@afrotools.com?subject=Sudan%20VAT%20calculation%20error">' + copy.report + '</a></p></aside></div></div>';

    var state = { mode: "add", result: null };
    function byId(id) { return document.getElementById(id); }
    function money(value) {
      return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : locale === "sw" ? "sw-TZ" : "en-GB", {
        style: "currency", currency: "SDG", currencyDisplay: "code", maximumFractionDigits: 2
      }).format(value);
    }
    function calculate() {
      try {
        state.result = engine.calculate({ amount: byId("sdVatAmount").value, mode: state.mode });
        byId("sdVatError").textContent = "";
        byId("sdVatNet").textContent = money(state.result.net);
        byId("sdVatTax").textContent = money(state.result.vat);
        byId("sdVatGross").textContent = money(state.result.gross);
        byId("sdVatResult").classList.add("on");
        byId("sdVatStatus").textContent = copy.ready;
      } catch (error) {
        state.result = null;
        byId("sdVatResult").classList.remove("on");
        byId("sdVatError").textContent = copy.error;
        byId("sdVatStatus").textContent = copy.error;
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
    byId("sdVatForm").onsubmit = function (event) { event.preventDefault(); calculate(); };
    byId("sdVatAmount").oninput = calculate;
    byId("sdVatShare").onclick = async function () {
      var url = location.origin + location.pathname;
      try {
        if (navigator.share) await navigator.share({ title: document.title, url: url });
        else await navigator.clipboard.writeText(url);
        byId("sdVatStatus").textContent = copy.share + ".";
      } catch (error) {
        if (error.name !== "AbortError") byId("sdVatStatus").textContent = copy.error;
      }
    };
    byId("sdVatPdf").onclick = function () {
      if (!state.result || !window.jspdf) return;
      var pdf = new window.jspdf.jsPDF();
      pdf.setProperties({ title: copy.title, subject: "Sudan standard VAT planning estimate at 17%" });
      pdf.text(copy.title, 20, 20);
      pdf.text("Official standard rate: 17% | Currency: SDG", 20, 32);
      pdf.text(copy.net + ": " + money(state.result.net), 20, 48);
      pdf.text(copy.vat + ": " + money(state.result.vat), 20, 59);
      pdf.text(copy.gross + ": " + money(state.result.gross), 20, 70);
      pdf.text(pdf.splitTextToSize(copy.disclaimer, 170), 20, 88);
      pdf.text("Source reviewed 2026-07-23: https://tax.gov.sd/en/newsen/", 20, 116);
      pdf.save("sudan-vat-17-percent-estimate.pdf");
      byId("sdVatStatus").textContent = copy.pdf + ".";
    };
    calculate();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
