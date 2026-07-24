(function () {
  "use strict";
  function init() {
    var engine = window.AfroTools && window.AfroTools.ZWVatEngine;
    if (!engine) return;
    var locale = (document.documentElement.lang || "en").slice(0, 2);
    if (!/^(en|fr|sw)$/.test(locale)) locale = "en";
    var copy = {
      en: {
        title: "Zimbabwe VAT calculator", lead: "Add or extract Zimbabwe's official 15.5% standard VAT locally. Choose ZWG (ZiG) or USD for the invoice amount.",
        kicker: "ZIMRA · effective 1 January 2026 · reviewed 23 July 2026", add: "Add VAT", extract: "Extract VAT",
        amount: "Amount", currency: "Invoice currency", calculate: "Calculate", net: "Amount before VAT", vat: "VAT at 15.5%", gross: "Amount including VAT",
        pdf: "Download local PDF", share: "Share safe link", rules: "What this calculator does",
        r1: "Uses the 15.5% standard VAT rate enacted by Finance Act 7 of 2025 from 1 January 2026.",
        r2: "Add mode multiplies the net amount by 15.5%; extract mode divides the VAT-inclusive amount by 1.155.",
        r3: "Choose ZWG, the current ZiG ISO code, or USD. Amounts stay in this browser and are excluded from shared links.",
        r4: "Zero-rated, exempt, tourism, food, medical, agriculture, export and other special treatments require exact current evidence and are not classified here.",
        sources: "Sources & verification", notice: "ZIMRA VAT-rate change notice 07 of 2026", mechanics: "ZIMRA Mechanics of VAT", act: "Finance Act 7 of 2025 · section 34", rbz: "RBZ ZWG currency-code statement",
        report: "Report calculation error", error: "Enter a non-negative amount and supported currency.", ready: "Result updated.",
        disclaimer: "Planning estimate for a standard-rated transaction only. Confirm the exact treatment, time of supply, invoice and return obligations with ZIMRA or a qualified adviser."
      },
      fr: {
        title: "Calculateur TVA Zimbabwe", lead: "Ajoutez ou extrayez localement la TVA normale officielle de 15,5 %. Choisissez ZWG (ZiG) ou USD pour la facture.",
        kicker: "ZIMRA · en vigueur le 1er janvier 2026 · vérifié le 23 juillet 2026", add: "Ajouter la TVA", extract: "Extraire la TVA",
        amount: "Montant", currency: "Devise de la facture", calculate: "Calculer", net: "Montant hors TVA", vat: "TVA à 15,5 %", gross: "Montant TVA comprise",
        pdf: "Télécharger le PDF local", share: "Partager le lien sûr", rules: "Ce que fait ce calculateur",
        r1: "Utilise le taux normal de 15,5 % prévu par la loi de finances 7 de 2025 à compter du 1er janvier 2026.",
        r2: "Le mode Ajouter multiplie le montant HT par 15,5 % ; le mode Extraire divise le montant TTC par 1,155.",
        r3: "Choisissez ZWG, code ISO actuel du ZiG, ou USD. Les montants restent dans le navigateur et hors des liens.",
        r4: "Taux zéro, exonérations, tourisme, alimentation, santé, agriculture, exportation et autres traitements exigent une preuve actuelle exacte et ne sont pas classés ici.",
        sources: "Sources et vérification", notice: "Avis ZIMRA 07 de 2026 sur le changement de taux", mechanics: "Mécanique de la TVA ZIMRA", act: "Loi de finances 7 de 2025 · article 34", rbz: "Communiqué RBZ sur le code ZWG",
        report: "Signaler une erreur de calcul", error: "Saisissez un montant positif ou nul et une devise prise en charge.", ready: "Résultat mis à jour.",
        disclaimer: "Estimation pour une opération au taux normal uniquement. Confirmez le traitement, la date d'exigibilité, la facture et la déclaration auprès de la ZIMRA ou d'un conseil qualifié."
      },
      sw: {
        title: "Kikokotoo cha VAT Zimbabwe", lead: "Ongeza au toa VAT rasmi ya kawaida ya Zimbabwe ya 15.5% kwa faragha. Chagua ZWG (ZiG) au USD ya ankara.",
        kicker: "ZIMRA · kuanzia 1 Januari 2026 · imekaguliwa 23 Julai 2026", add: "Ongeza VAT", extract: "Toa VAT",
        amount: "Kiasi", currency: "Sarafu ya ankara", calculate: "Kokotoa", net: "Kiasi kabla ya VAT", vat: "VAT kwa 15.5%", gross: "Kiasi pamoja na VAT",
        pdf: "Pakua PDF kwenye kifaa", share: "Shiriki kiungo salama", rules: "Kikokotoo hiki kinafanya nini",
        r1: "Kinatumia kiwango cha kawaida cha 15.5% kilichowekwa na Finance Act 7 ya 2025 kuanzia 1 Januari 2026.",
        r2: "Hali ya Kuongeza huzidisha kiasi kwa 15.5%; hali ya Kutoa hugawa kiasi chenye VAT kwa 1.155.",
        r3: "Chagua ZWG, msimbo wa sasa wa ISO wa ZiG, au USD. Kiasi hubaki kwenye kivinjari na nje ya kiungo.",
        r4: "Kiwango sifuri, msamaha, utalii, chakula, afya, kilimo, mauzo ya nje na matibabu mengine yanahitaji ushahidi halisi wa sasa na hayaamuliwi hapa.",
        sources: "Vyanzo na uthibitisho", notice: "Taarifa ya ZIMRA 07 ya 2026 kuhusu kiwango", mechanics: "Maelezo ya VAT ya ZIMRA", act: "Finance Act 7 ya 2025 · kifungu 34", rbz: "Taarifa ya RBZ kuhusu msimbo ZWG",
        report: "Ripoti hitilafu ya hesabu", error: "Weka kiasi kisicho hasi na sarafu inayokubalika.", ready: "Matokeo yamesasishwa.",
        disclaimer: "Makadirio ya muamala wa kiwango cha kawaida pekee. Thibitisha matibabu, muda wa kodi, ankara na wajibu wa uwasilishaji na ZIMRA au mshauri mwenye sifa."
      }
    }[locale];
    var main = document.querySelector("main");
    if (!main) return;
    main.id = "main-content"; main.tabIndex = -1;
    main.innerHTML = '<div class="gnv-shell"><section class="gnv-hero"><div class="gnv-kicker">' + copy.kicker + '</div><h1>' + copy.title + '</h1><p class="gnv-lede">' + copy.lead + '</p></section><div class="gnv-grid">' +
      '<form class="gnv-card" id="zwVatForm"><div class="gnv-switch" role="group" aria-label="VAT calculation mode"><button class="gnv-button" type="button" data-mode="add" aria-pressed="true">' + copy.add + '</button><button class="gnv-button" type="button" data-mode="extract" aria-pressed="false">' + copy.extract + '</button></div><label class="gnv-field" for="zwVatCurrency">' + copy.currency + '</label><select class="gnv-input" id="zwVatCurrency" name="currency"><option value="ZWG">ZWG (ZiG)</option><option value="USD">USD</option></select><label class="gnv-field" for="zwVatAmount">' + copy.amount + '</label><input class="gnv-input" id="zwVatAmount" name="amount" type="number" min="0" step="0.01" inputmode="decimal" value="1000" autocomplete="off"><button class="gnv-button gnv-primary" type="submit">' + copy.calculate + '</button><p class="gnv-error" id="zwVatError"></p><section class="gnv-result" id="zwVatResult" aria-label="VAT result"><dl><dt>' + copy.net + '</dt><dd id="zwVatNet"></dd><dt>' + copy.vat + '</dt><dd id="zwVatTax"></dd><dt>' + copy.gross + '</dt><dd id="zwVatGross"></dd></dl><div class="gnv-actions"><button class="gnv-button" type="button" id="zwVatPdf">' + copy.pdf + '</button><button class="gnv-button" type="button" id="zwVatShare">' + copy.share + '</button></div></section><div class="gnv-status" id="zwVatStatus" role="status" aria-live="polite"></div></form>' +
      '<aside class="gnv-card" data-tool-verification-panel data-tool-id="zw-vat"><h2>' + copy.rules + '</h2><ul class="gnv-list"><li>' + copy.r1 + '</li><li>' + copy.r2 + '</li><li>' + copy.r3 + '</li><li>' + copy.r4 + '</li></ul><h2>' + copy.sources + '</h2><p class="gnv-note"><a href="https://www.zimra.co.zw/public-notices?download=4441%3Apublic-notice-07-of-2026-change-of-vat-rate-on-submission-of-return-category-a">' + copy.notice + '</a><br><a href="https://zimra.co.zw/domestic-taxes/vat/mechanics-of-vat">' + copy.mechanics + '</a><br><a href="https://zimlii.org/akn/zw/act/2025/7/eng%402025-12-29">' + copy.act + '</a><br><a href="https://www.rbz.co.zw/documents/press/2024/July/PRESS_STATEMENT_ON_ZiG_CURRENCY_CODE.pdf">' + copy.rbz + '</a></p><p class="gnv-note">' + copy.disclaimer + '</p><p class="gnv-note"><a href="mailto:hello@afrotools.com?subject=Zimbabwe%20VAT%20calculation%20error">' + copy.report + '</a></p></aside></div></div>';
    var state = { mode: "add", result: null };
    function byId(id) { return document.getElementById(id); }
    function money(value, currency) {
      return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : locale === "sw" ? "sw-TZ" : "en-ZW", {
        style: "currency", currency: currency, currencyDisplay: "code", minimumFractionDigits: 2, maximumFractionDigits: 2
      }).format(value);
    }
    function calculate() {
      try {
        state.result = engine.calculate({ amount: byId("zwVatAmount").value, currency: byId("zwVatCurrency").value, mode: state.mode });
        byId("zwVatError").textContent = "";
        byId("zwVatNet").textContent = money(state.result.net, state.result.currency);
        byId("zwVatTax").textContent = money(state.result.vat, state.result.currency);
        byId("zwVatGross").textContent = money(state.result.gross, state.result.currency);
        byId("zwVatResult").classList.add("on"); byId("zwVatStatus").textContent = copy.ready;
      } catch (error) {
        state.result = null; byId("zwVatResult").classList.remove("on");
        byId("zwVatError").textContent = copy.error; byId("zwVatStatus").textContent = copy.error;
      }
    }
    document.querySelectorAll("[data-mode]").forEach(function (button) {
      button.onclick = function () {
        state.mode = button.dataset.mode;
        document.querySelectorAll("[data-mode]").forEach(function (item) { item.setAttribute("aria-pressed", String(item === button)); });
        calculate();
      };
    });
    byId("zwVatForm").onsubmit = function (event) { event.preventDefault(); calculate(); };
    byId("zwVatAmount").oninput = calculate; byId("zwVatCurrency").onchange = calculate;
    byId("zwVatShare").onclick = async function () {
      var url = location.origin + location.pathname;
      try {
        if (navigator.share) await navigator.share({ title: document.title, url: url }); else await navigator.clipboard.writeText(url);
        byId("zwVatStatus").textContent = copy.share + ".";
      } catch (error) { if (error.name !== "AbortError") byId("zwVatStatus").textContent = copy.error; }
    };
    byId("zwVatPdf").onclick = function () {
      if (!state.result || !window.jspdf) return;
      var pdf = new window.jspdf.jsPDF();
      pdf.setProperties({ title: copy.title, subject: "Zimbabwe standard VAT planning estimate at 15.5%" });
      pdf.text(copy.title, 20, 20); pdf.text("Official standard rate: 15.5% | Currency: " + state.result.currency, 20, 32);
      pdf.text(copy.net + ": " + money(state.result.net, state.result.currency), 20, 48);
      pdf.text(copy.vat + ": " + money(state.result.vat, state.result.currency), 20, 59);
      pdf.text(copy.gross + ": " + money(state.result.gross, state.result.currency), 20, 70);
      pdf.text(pdf.splitTextToSize(copy.disclaimer, 170), 20, 88);
      pdf.text("Sources reviewed 2026-07-23: ZIMRA Notice 07/2026, Finance Act 7/2025 s34, RBZ ZWG statement", 20, 116);
      pdf.save("zimbabwe-vat-15-5-percent-estimate.pdf"); byId("zwVatStatus").textContent = copy.pdf + ".";
    };
    calculate();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
