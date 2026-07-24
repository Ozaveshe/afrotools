(function () {
  "use strict";

  function init() {
    var engine = window.AfroTools && window.AfroTools.ZMVatEngine;
    if (!engine) return;
    var locale = (document.documentElement.lang || "en").slice(0, 2);
    if (!/^(en|fr|sw)$/.test(locale)) locale = "en";
    var copy = {
      en: {
        title: "Zambia VAT calculator", lead: "Add or extract Zambia's official 16% standard VAT locally in Zambian kwacha.",
        kicker: "Zambia Revenue Authority · reviewed 23 July 2026", add: "Add VAT", extract: "Extract VAT",
        amount: "Amount", calculate: "Calculate", net: "Amount before VAT", vat: "VAT at 16%", gross: "Amount including VAT",
        pdf: "Download local PDF", share: "Share safe link", rules: "What this calculator does",
        r1: "Uses the ZRA standard VAT rate of 16% for standard-rated planning arithmetic.",
        r2: "Add mode multiplies the net amount by 16%; extract mode divides the VAT-inclusive amount by 1.16.",
        r3: "Amounts stay in this browser and are not stored, sent to AfroTools, or placed in the shared link.",
        r4: "ZRA invoice codes distinguish standard, export, LPO/project, zero-rated-by-nature and exempt supplies. This calculator does not classify those special treatments.",
        sources: "Sources & verification", tax: "ZRA current tax information", codes: "ZRA VSDC API specification", act: "National Assembly VAT Amendment Act 2025",
        report: "Report calculation error", error: "Enter a non-negative amount.", ready: "Result updated.",
        disclaimer: "Planning estimate for a standard-rated transaction only. Confirm the exact statutory schedule, invoice code and evidence with ZRA or a qualified adviser."
      },
      fr: {
        title: "Calculateur TVA Zambie", lead: "Ajoutez ou extrayez localement la TVA normale officielle de 16 % en kwachas zambiens.",
        kicker: "Zambia Revenue Authority · vérifié le 23 juillet 2026", add: "Ajouter la TVA", extract: "Extraire la TVA",
        amount: "Montant", calculate: "Calculer", net: "Montant hors TVA", vat: "TVA à 16 %", gross: "Montant TVA comprise",
        pdf: "Télécharger le PDF local", share: "Partager le lien sûr", rules: "Ce que fait ce calculateur",
        r1: "Utilise le taux normal de TVA de la ZRA, 16 %, pour une estimation au taux normal.",
        r2: "Le mode Ajouter multiplie le montant HT par 16 % ; le mode Extraire divise le montant TTC par 1,16.",
        r3: "Les montants restent dans ce navigateur : ni stockage, ni envoi à AfroTools, ni ajout au lien partagé.",
        r4: "Les codes de facture ZRA distinguent taux normal, exportation, LPO/projet, taux zéro par nature et exonération. Ce calculateur ne classe pas ces traitements.",
        sources: "Sources et vérification", tax: "Informations fiscales actuelles de la ZRA", codes: "Spécification API VSDC de la ZRA", act: "Loi modificative TVA 2025 du Parlement",
        report: "Signaler une erreur de calcul", error: "Saisissez un montant positif ou nul.", ready: "Résultat mis à jour.",
        disclaimer: "Estimation pour une opération au taux normal uniquement. Confirmez le texte, le code de facture et les preuves exactes auprès de la ZRA ou d'un conseil qualifié."
      },
      sw: {
        title: "Kikokotoo cha VAT Zambia", lead: "Ongeza au toa VAT rasmi ya kawaida ya Zambia ya 16% kwa faragha kwa kwacha za Zambia.",
        kicker: "Zambia Revenue Authority · imekaguliwa 23 Julai 2026", add: "Ongeza VAT", extract: "Toa VAT",
        amount: "Kiasi", calculate: "Kokotoa", net: "Kiasi kabla ya VAT", vat: "VAT kwa 16%", gross: "Kiasi pamoja na VAT",
        pdf: "Pakua PDF kwenye kifaa", share: "Shiriki kiungo salama", rules: "Kikokotoo hiki kinafanya nini",
        r1: "Kinatumia kiwango cha kawaida cha ZRA cha 16% kwa makadirio ya muamala wa kiwango cha kawaida.",
        r2: "Hali ya Kuongeza huzidisha kiasi kabla ya VAT kwa 16%; hali ya Kutoa hugawa kiasi chenye VAT kwa 1.16.",
        r3: "Kiasi hubaki kwenye kivinjari hiki; hakihifadhiwi, hakitumwi AfroTools, wala kuwekwa kwenye kiungo.",
        r4: "Misimbo ya ankara ya ZRA hutenganisha kiwango cha kawaida, mauzo ya nje, LPO/mradi, kiwango sifuri kwa asili na msamaha. Kikokotoo hiki hakiamui matibabu hayo.",
        sources: "Vyanzo na uthibitisho", tax: "Taarifa za sasa za kodi za ZRA", codes: "Vipimo vya API ya VSDC ya ZRA", act: "Sheria ya Marekebisho ya VAT 2025",
        report: "Ripoti hitilafu ya hesabu", error: "Weka kiasi kisicho hasi.", ready: "Matokeo yamesasishwa.",
        disclaimer: "Makadirio ya muamala wa kiwango cha kawaida pekee. Thibitisha jedwali la sheria, msimbo wa ankara na ushahidi na ZRA au mshauri mwenye sifa."
      }
    }[locale];

    var main = document.querySelector("main");
    if (!main) return;
    main.id = "main-content";
    main.tabIndex = -1;
    main.innerHTML = '<div class="gnv-shell"><section class="gnv-hero"><div class="gnv-kicker">' + copy.kicker + '</div><h1>' + copy.title + '</h1><p class="gnv-lede">' + copy.lead + '</p></section><div class="gnv-grid">' +
      '<form class="gnv-card" id="zmVatForm"><div class="gnv-switch" role="group" aria-label="VAT calculation mode"><button class="gnv-button" type="button" data-mode="add" aria-pressed="true">' + copy.add + '</button><button class="gnv-button" type="button" data-mode="extract" aria-pressed="false">' + copy.extract + '</button></div><label class="gnv-field" for="zmVatAmount">' + copy.amount + ' (ZMW)</label><input class="gnv-input" id="zmVatAmount" name="amount" type="number" min="0" step="0.01" inputmode="decimal" value="1000" autocomplete="off"><button class="gnv-button gnv-primary" type="submit">' + copy.calculate + '</button><p class="gnv-error" id="zmVatError"></p><section class="gnv-result" id="zmVatResult" aria-label="VAT result"><dl><dt>' + copy.net + '</dt><dd id="zmVatNet"></dd><dt>' + copy.vat + '</dt><dd id="zmVatTax"></dd><dt>' + copy.gross + '</dt><dd id="zmVatGross"></dd></dl><div class="gnv-actions"><button class="gnv-button" type="button" id="zmVatPdf">' + copy.pdf + '</button><button class="gnv-button" type="button" id="zmVatShare">' + copy.share + '</button></div></section><div class="gnv-status" id="zmVatStatus" role="status" aria-live="polite"></div></form>' +
      '<aside class="gnv-card" data-tool-verification-panel data-tool-id="zm-vat"><h2>' + copy.rules + '</h2><ul class="gnv-list"><li>' + copy.r1 + '</li><li>' + copy.r2 + '</li><li>' + copy.r3 + '</li><li>' + copy.r4 + '</li></ul><h2>' + copy.sources + '</h2><p class="gnv-note"><a href="https://www.zra.org.zm/tax-information/">' + copy.tax + '</a><br><a href="https://www.zra.org.zm/wp-content/uploads/2024/08/VSDC-API-Specification-Document-v1.0.7-1.pdf">' + copy.codes + '</a><br><a href="https://www.parliament.gov.zm/node/12767">' + copy.act + '</a></p><p class="gnv-note">' + copy.disclaimer + '</p><p class="gnv-note"><a href="mailto:hello@afrotools.com?subject=Zambia%20VAT%20calculation%20error">' + copy.report + '</a></p></aside></div></div>';

    var state = { mode: "add", result: null };
    function byId(id) { return document.getElementById(id); }
    function money(value) {
      return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : locale === "sw" ? "sw-TZ" : "en-ZM", {
        style: "currency", currency: "ZMW", currencyDisplay: "code", minimumFractionDigits: 2, maximumFractionDigits: 2
      }).format(value);
    }
    function calculate() {
      try {
        state.result = engine.calculate({ amount: byId("zmVatAmount").value, mode: state.mode });
        byId("zmVatError").textContent = "";
        byId("zmVatNet").textContent = money(state.result.net);
        byId("zmVatTax").textContent = money(state.result.vat);
        byId("zmVatGross").textContent = money(state.result.gross);
        byId("zmVatResult").classList.add("on");
        byId("zmVatStatus").textContent = copy.ready;
      } catch (error) {
        state.result = null;
        byId("zmVatResult").classList.remove("on");
        byId("zmVatError").textContent = copy.error;
        byId("zmVatStatus").textContent = copy.error;
      }
    }
    document.querySelectorAll("[data-mode]").forEach(function (button) {
      button.onclick = function () {
        state.mode = button.dataset.mode;
        document.querySelectorAll("[data-mode]").forEach(function (item) { item.setAttribute("aria-pressed", String(item === button)); });
        calculate();
      };
    });
    byId("zmVatForm").onsubmit = function (event) { event.preventDefault(); calculate(); };
    byId("zmVatAmount").oninput = calculate;
    byId("zmVatShare").onclick = async function () {
      var url = location.origin + location.pathname;
      try {
        if (navigator.share) await navigator.share({ title: document.title, url: url });
        else await navigator.clipboard.writeText(url);
        byId("zmVatStatus").textContent = copy.share + ".";
      } catch (error) {
        if (error.name !== "AbortError") byId("zmVatStatus").textContent = copy.error;
      }
    };
    byId("zmVatPdf").onclick = function () {
      if (!state.result || !window.jspdf) return;
      var pdf = new window.jspdf.jsPDF();
      pdf.setProperties({ title: copy.title, subject: "Zambia standard VAT planning estimate at 16%" });
      pdf.text(copy.title, 20, 20);
      pdf.text("Official standard rate: 16% | Currency: ZMW", 20, 32);
      pdf.text(copy.net + ": " + money(state.result.net), 20, 48);
      pdf.text(copy.vat + ": " + money(state.result.vat), 20, 59);
      pdf.text(copy.gross + ": " + money(state.result.gross), 20, 70);
      pdf.text(pdf.splitTextToSize(copy.disclaimer, 170), 20, 88);
      pdf.text("Sources reviewed 2026-07-23: ZRA tax information, VSDC specification, VAT Amendment Act 2025", 20, 116);
      pdf.save("zambia-vat-16-percent-estimate.pdf");
      byId("zmVatStatus").textContent = copy.pdf + ".";
    };
    calculate();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
