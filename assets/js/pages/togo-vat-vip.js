(function () {
  "use strict";

  function init() {
    var engine = window.AfroTools && window.AfroTools.TGVatEngine;
    if (!engine) return;
    var locale = (document.documentElement.lang || "en").slice(0, 2);
    if (!/^(en|fr|sw)$/.test(locale)) locale = "en";
    var copy = {
      en: {
        title: "Togo VAT calculator",
        lead: "Add or extract Togo's official 18% standard VAT locally in West African CFA francs. The rate is anchored to Article 195 of the OTR tax code and checked against the 2026 fiscal handbook.",
        kicker: "Office Togolais des Recettes · reviewed 23 July 2026",
        add: "Add VAT", extract: "Extract VAT", amount: "Amount", calculate: "Calculate",
        net: "Amount before VAT", vat: "VAT at 18%", gross: "Amount including VAT",
        pdf: "Download local PDF", share: "Share safe link", rules: "What this calculator does",
        r1: "Uses the official fixed standard VAT rate of 18% for standard-rate planning arithmetic.",
        r2: "Add mode multiplies the net amount by 18%; extract mode divides the VAT-inclusive amount by 1.18.",
        r3: "Amounts stay in this browser. They are not stored, sent to AfroTools, or placed in the shared link.",
        r4: "Article 180 exemptions, later 2026 measures, exports, prepayment, leasing, registration, filing, invoice compliance and input-tax eligibility are outside this calculator.",
        sources: "Sources & verification", report: "Report calculation error",
        sourceCode: "OTR General Tax Code updated 2025 · Article 195", sourceBook: "OTR Fiscal Handbook 2026", sourceOtr: "Office Togolais des Recettes",
        error: "Enter a non-negative amount.", ready: "Result updated.",
        disclaimer: "Planning estimate for a standard-rated transaction only. Confirm the exact transaction treatment and current obligations with OTR or a qualified adviser."
      },
      fr: {
        title: "Calculateur TVA Togo",
        lead: "Ajoutez ou extrayez localement la TVA normale officielle de 18 % en francs CFA BCEAO. Le taux suit l'article 195 du CGI de l'OTR et le cahier fiscal 2026.",
        kicker: "Office Togolais des Recettes · vérifié le 23 juillet 2026",
        add: "Ajouter la TVA", extract: "Extraire la TVA", amount: "Montant", calculate: "Calculer",
        net: "Montant hors TVA", vat: "TVA à 18 %", gross: "Montant TVA comprise",
        pdf: "Télécharger le PDF local", share: "Partager le lien sûr", rules: "Ce que fait ce calculateur",
        r1: "Utilise le taux normal officiel fixe de 18 % pour une estimation au taux normal.",
        r2: "Le mode Ajouter multiplie le montant HT par 18 % ; le mode Extraire divise le montant TTC par 1,18.",
        r3: "Les montants restent dans ce navigateur. Ils ne sont ni stockés, ni envoyés à AfroTools, ni ajoutés au lien partagé.",
        r4: "Exonérations de l'article 180, mesures ultérieures de 2026, exportations, précompte, crédit-bail, immatriculation, déclaration, conformité des factures et droit à déduction restent hors périmètre.",
        sources: "Sources et vérification", report: "Signaler une erreur de calcul",
        sourceCode: "Code général des impôts OTR mis à jour en 2025 · article 195", sourceBook: "Cahier fiscal OTR 2026", sourceOtr: "Office Togolais des Recettes",
        error: "Saisissez un montant positif ou nul.", ready: "Résultat mis à jour.",
        disclaimer: "Estimation de préparation pour une opération au taux normal uniquement. Confirmez le traitement exact et les obligations actuelles auprès de l'OTR ou d'un conseil qualifié."
      },
      sw: {
        title: "Kikokotoo cha VAT Togo",
        lead: "Ongeza au toa VAT rasmi ya kawaida ya Togo ya 18% kwa faragha kwa faranga za CFA za Afrika Magharibi. Kiwango kinategemea Kifungu cha 195 cha Kanuni ya Kodi ya OTR na Kitabu cha Fedha 2026.",
        kicker: "Office Togolais des Recettes · imekaguliwa 23 Julai 2026",
        add: "Ongeza VAT", extract: "Toa VAT", amount: "Kiasi", calculate: "Kokotoa",
        net: "Kiasi kabla ya VAT", vat: "VAT kwa 18%", gross: "Kiasi pamoja na VAT",
        pdf: "Pakua PDF kwenye kifaa", share: "Shiriki kiungo salama", rules: "Kikokotoo hiki kinafanya nini",
        r1: "Kinatumia kiwango rasmi cha kawaida cha VAT cha 18% kwa makadirio ya kiwango cha kawaida.",
        r2: "Hali ya Kuongeza huzidisha kiasi kabla ya VAT kwa 18%; hali ya Kutoa hugawa kiasi chenye VAT kwa 1.18.",
        r3: "Kiasi hubaki kwenye kivinjari hiki. Hakihifadhiwi, hakitumwi AfroTools, wala kuwekwa kwenye kiungo cha kushiriki.",
        r4: "Misamaha ya Kifungu cha 180, hatua za baadaye za 2026, mauzo ya nje, malipo ya awali, leasing, usajili, uwasilishaji, kanuni za ankara na haki ya makato haviamuliwi hapa.",
        sources: "Vyanzo na uthibitisho", report: "Ripoti hitilafu ya hesabu",
        sourceCode: "Kanuni ya Kodi ya OTR iliyosasishwa 2025 · Kifungu cha 195", sourceBook: "Kitabu cha Fedha cha OTR 2026", sourceOtr: "Office Togolais des Recettes",
        error: "Weka kiasi kisicho hasi.", ready: "Matokeo yamesasishwa.",
        disclaimer: "Makadirio ya kupanga muamala wa kiwango cha kawaida pekee. Thibitisha matibabu halisi na wajibu wa sasa na OTR au mshauri mwenye sifa."
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
      '<form class="gnv-card" id="tgVatForm"><div class="gnv-switch" role="group" aria-label="VAT calculation mode"><button class="gnv-button" type="button" data-mode="add" aria-pressed="true">' + copy.add + '</button><button class="gnv-button" type="button" data-mode="extract" aria-pressed="false">' + copy.extract + '</button></div><label class="gnv-field" for="tgVatAmount">' + copy.amount + ' (XOF)</label><input class="gnv-input" id="tgVatAmount" name="amount" type="number" min="0" step="1" inputmode="numeric" value="10000" autocomplete="off"><button class="gnv-button gnv-primary" type="submit">' + copy.calculate + '</button><p class="gnv-error" id="tgVatError"></p><section class="gnv-result" id="tgVatResult" aria-label="VAT result"><dl><dt>' + copy.net + '</dt><dd id="tgVatNet"></dd><dt>' + copy.vat + '</dt><dd id="tgVatTax"></dd><dt>' + copy.gross + '</dt><dd id="tgVatGross"></dd></dl><div class="gnv-actions"><button class="gnv-button" type="button" id="tgVatPdf">' + copy.pdf + '</button><button class="gnv-button" type="button" id="tgVatShare">' + copy.share + '</button></div></section><div class="gnv-status" id="tgVatStatus" role="status" aria-live="polite"></div></form>' +
      '<aside class="gnv-card" data-tool-verification-panel data-tool-id="tg-vat"><h2>' + copy.rules + '</h2><ul class="gnv-list"><li>' + copy.r1 + '</li><li>' + copy.r2 + '</li><li>' + copy.r3 + '</li><li>' + copy.r4 + '</li></ul><h2>' + copy.sources + '</h2><p class="gnv-note"><a href="https://www.otr.tg/index.php/fr/documentation/sur-les-impots/code-general-des-impots/600-code-general-des-impots-livre-des-procedures-fiscales-mis-a-jour-2025/file.html">' + copy.sourceCode + '</a><br><a href="https://www.otr.tg/index.php/fr/documentation/sur-les-impots/code-general-des-impots/628-cahier-fiscal-2026/file.html">' + copy.sourceBook + '</a><br><a href="https://www.otr.tg/">' + copy.sourceOtr + '</a></p><p class="gnv-note">' + copy.disclaimer + '</p><p class="gnv-note"><a href="mailto:hello@afrotools.com?subject=Togo%20VAT%20calculation%20error">' + copy.report + '</a></p></aside></div></div>';

    var state = { mode: "add", result: null };
    function byId(id) { return document.getElementById(id); }
    function money(value) {
      return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : locale === "sw" ? "sw-TZ" : "en-GB", {
        style: "currency", currency: "XOF", currencyDisplay: "code", maximumFractionDigits: 0
      }).format(value);
    }
    function calculate() {
      try {
        state.result = engine.calculate({ amount: byId("tgVatAmount").value, mode: state.mode });
        byId("tgVatError").textContent = "";
        byId("tgVatNet").textContent = money(state.result.net);
        byId("tgVatTax").textContent = money(state.result.vat);
        byId("tgVatGross").textContent = money(state.result.gross);
        byId("tgVatResult").classList.add("on");
        byId("tgVatStatus").textContent = copy.ready;
      } catch (error) {
        state.result = null;
        byId("tgVatResult").classList.remove("on");
        byId("tgVatError").textContent = copy.error;
        byId("tgVatStatus").textContent = copy.error;
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
    byId("tgVatForm").onsubmit = function (event) { event.preventDefault(); calculate(); };
    byId("tgVatAmount").oninput = calculate;
    byId("tgVatShare").onclick = async function () {
      var url = location.origin + location.pathname;
      try {
        if (navigator.share) await navigator.share({ title: document.title, url: url });
        else await navigator.clipboard.writeText(url);
        byId("tgVatStatus").textContent = copy.share + ".";
      } catch (error) {
        if (error.name !== "AbortError") byId("tgVatStatus").textContent = copy.error;
      }
    };
    byId("tgVatPdf").onclick = function () {
      if (!state.result || !window.jspdf) return;
      var pdf = new window.jspdf.jsPDF();
      pdf.setProperties({ title: copy.title, subject: "Togo standard VAT planning estimate at 18%" });
      pdf.text(copy.title, 20, 20);
      pdf.text("Official standard rate: 18% | Currency: XOF", 20, 32);
      pdf.text(copy.net + ": " + money(state.result.net), 20, 48);
      pdf.text(copy.vat + ": " + money(state.result.vat), 20, 59);
      pdf.text(copy.gross + ": " + money(state.result.gross), 20, 70);
      pdf.text(pdf.splitTextToSize(copy.disclaimer, 170), 20, 88);
      pdf.text("Sources reviewed 2026-07-23: OTR CGI Article 195 and Fiscal Handbook 2026", 20, 116);
      pdf.save("togo-vat-18-percent-estimate.pdf");
      byId("tgVatStatus").textContent = copy.pdf + ".";
    };
    calculate();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
