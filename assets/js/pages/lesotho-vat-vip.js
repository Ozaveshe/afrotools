(function () {
  "use strict";
  function init() {
    var e = window.AfroTools && window.AfroTools.LSVatEngine;
    if (!e) return;
    var lang = (document.documentElement.lang || "en").slice(0, 2);
    if (!/^(en|fr|sw)$/.test(lang)) lang = "en";
    var t = {
      en: {
        title: "Lesotho VAT calculator",
        lead: "Add or extract VAT locally in loti using the current RSL 15% standard rate. Electricity and zero-rated treatments stay locked until exact evidence is confirmed.",
        amount: "Amount",
        add: "Add VAT",
        extract: "Extract VAT",
        rate: "VAT treatment",
        standard: "Standard taxable supply — 15%",
        ten: "Confirmed electricity treatment — 10%",
        zero: "Confirmed Fourth Schedule or export treatment — 0%",
        confirm:
          "I confirmed the selected treatment against current RSL guidance or the exact VAT Act schedule and retained evidence.",
        calc: "Calculate",
        net: "Amount before VAT",
        vat: "VAT",
        gross: "Amount including VAT",
        pdf: "Download local PDF",
        share: "Share safe link",
        rules: "Current RSL boundaries",
        verification: "Sources & verification",
        report: "Report a calculation error",
        r1: "RSL publishes 15% for telecommunications and other goods and services.",
        r2: "10% is limited to electricity and requires current treatment evidence.",
        r3: "0% requires an exact Fourth Schedule item or export evidence.",
        r4: "RSL pages currently conflict on the general registration threshold; confirm it directly before acting.",
        err: "Enter a non-negative amount.",
        evidence: "Confirm the exact RSL evidence first.",
        disclaimer:
          "Planning estimate only. Confirm classification, registration, invoicing, deduction and filing with RSL or a qualified adviser.",
      },
      fr: {
        title: "Calculateur TVA Lesotho",
        lead: "Ajoutez ou extrayez la TVA localement en loti au taux normal actuel de 15 % de la RSL. Les traitements électricité et taux zéro exigent une preuve exacte.",
        amount: "Montant",
        add: "Ajouter la TVA",
        extract: "Extraire la TVA",
        rate: "Traitement TVA",
        standard: "Opération taxable normale — 15 %",
        ten: "Traitement électricité confirmé — 10 %",
        zero: "Annexe IV ou exportation confirmée — 0 %",
        confirm:
          "J’ai confirmé le traitement sélectionné dans les indications actuelles de la RSL ou l’annexe exacte de la loi et conservé la preuve.",
        calc: "Calculer",
        net: "Montant hors TVA",
        vat: "TVA",
        gross: "Montant TVA comprise",
        pdf: "Télécharger le PDF local",
        share: "Partager le lien sûr",
        rules: "Limites RSL actuelles",
        verification: "Sources et vérification",
        report: "Signaler une erreur de calcul",
        r1: "La RSL publie 15 % pour les télécommunications et les autres biens et services.",
        r2: "Le taux de 10 % est limité à l’électricité et exige une preuve actuelle.",
        r3: "Le taux de 0 % exige un élément exact de l’annexe IV ou une preuve d’exportation.",
        r4: "Les pages RSL se contredisent actuellement sur le seuil général d’immatriculation ; confirmez-le directement.",
        err: "Saisissez un montant positif ou nul.",
        evidence: "Confirmez d’abord la preuve RSL exacte.",
        disclaimer:
          "Estimation de préparation uniquement. Confirmez le classement, l’immatriculation, la facturation, la déduction et la déclaration auprès de la RSL ou d’un conseil qualifié.",
      },
      sw: {
        title: "Kikokotoo cha VAT Lesotho",
        lead: "Ongeza au toa VAT kwenye kifaa chako kwa loti kwa kiwango cha kawaida cha sasa cha RSL cha 15%. Umeme na njia ya 0% zinahitaji ushahidi halisi.",
        amount: "Kiasi",
        add: "Ongeza VAT",
        extract: "Toa VAT",
        rate: "Aina ya VAT",
        standard: "Muamala wa kawaida — 15%",
        ten: "Matibabu ya umeme yaliyothibitishwa — 10%",
        zero: "Kiambatisho cha Nne au usafirishaji uliothibitishwa — 0%",
        confirm:
          "Nimethibitisha aina iliyochaguliwa kwa mwongozo wa sasa wa RSL au ratiba halisi ya sheria na nimehifadhi ushahidi.",
        calc: "Kokotoa",
        net: "Kiasi kabla ya VAT",
        vat: "VAT",
        gross: "Kiasi pamoja na VAT",
        pdf: "Pakua PDF kwenye kifaa",
        share: "Shiriki kiungo salama",
        rules: "Mipaka ya sasa ya RSL",
        verification: "Vyanzo na uthibitisho",
        report: "Ripoti hitilafu ya hesabu",
        r1: "RSL inachapisha 15% kwa mawasiliano na bidhaa na huduma nyingine.",
        r2: "10% ni kwa umeme na inahitaji ushahidi wa sasa.",
        r3: "0% inahitaji mstari halisi wa Kiambatisho cha Nne au ushahidi wa usafirishaji.",
        r4: "Kurasa za RSL zinapingana kuhusu kizingiti cha jumla cha usajili; thibitisha moja kwa moja.",
        err: "Weka kiasi kisicho hasi.",
        evidence: "Thibitisha kwanza ushahidi halisi wa RSL.",
        disclaimer:
          "Makadirio ya kupanga tu. Thibitisha aina, usajili, ankara, makato na uwasilishaji na RSL au mshauri mwenye sifa.",
      },
    }[lang];
    var nav = document.querySelector("afro-navbar"),
      footer = document.querySelector("afro-footer"),
      main = document.createElement("main");
    if (nav && footer) {
      var n = nav.nextSibling;
      while (n && n !== footer) {
        var next = n.nextSibling;
        n.remove();
        n = next;
      }
      footer.parentNode.insertBefore(main, footer);
    } else {
      var old = document.querySelector("main");
      if (!old) return;
      old.replaceWith(main);
    }
    main.id = "main-content";
    document.title = t.title + " | AfroTools";
    main.innerHTML =
      '<div class="gnv-shell"><section class="gnv-hero"><div class="gnv-kicker">RSL · ' +
      t.rules +
      "</div><h1>" +
      t.title +
      '</h1><p class="gnv-lede">' +
      t.lead +
      '</p></section><div class="gnv-grid"><form class="gnv-card" id="lsvForm"><div class="gnv-switch"><button class="gnv-button" type="button" data-mode="add" aria-pressed="true">' +
      t.add +
      '</button><button class="gnv-button" type="button" data-mode="extract" aria-pressed="false">' +
      t.extract +
      '</button></div><label class="gnv-field" for="lsvAmount">' +
      t.amount +
      ' (LSL)</label><input class="gnv-input" id="lsvAmount" type="number" min="0" step="0.01" inputmode="decimal" value="1000"><label class="gnv-field" for="lsvRate">' +
      t.rate +
      '</label><select class="gnv-select" id="lsvRate"><option value="standard">' +
      t.standard +
      '</option><option value="confirmed-electricity-ten">' +
      t.ten +
      '</option><option value="confirmed-zero">' +
      t.zero +
      '</option></select><label class="gnv-evidence" id="lsvEvidenceWrap" hidden><input id="lsvEvidence" type="checkbox"><span>' +
      t.confirm +
      '</span></label><button class="gnv-button gnv-primary" type="submit">' +
      t.calc +
      '</button><p class="gnv-error" id="lsvError"></p><section class="gnv-result" id="lsvResult" aria-label="Result"><dl><dt>' +
      t.net +
      '</dt><dd id="lsvNet"></dd><dt>' +
      t.vat +
      '</dt><dd id="lsvVat"></dd><dt>' +
      t.gross +
      '</dt><dd id="lsvGross"></dd></dl><div class="gnv-actions"><button class="gnv-button" type="button" id="lsvPdf">' +
      t.pdf +
      '</button><button class="gnv-button" type="button" id="lsvShare">' +
      t.share +
      '</button></div></section><div class="gnv-status" id="lsvStatus" aria-live="polite"></div></form><aside class="gnv-card" data-tool-verification-panel data-tool-id="ls-vat"><h2>' +
      t.rules +
      '</h2><ul class="gnv-list"><li>' +
      t.r1 +
      "</li><li>" +
      t.r2 +
      "</li><li>" +
      t.r3 +
      "</li><li>" +
      t.r4 +
      "</li></ul><h2>" +
      t.verification +
      '</h2><p class="gnv-note"><a href="https://www.rsl.org.ls/tax-rates">RSL tax rates</a><br><a href="https://www.rsl.org.ls/registrationde-registration">RSL VAT registration guidance</a><br><a href="https://www.rsl.org.ls/publications">RSL current publications</a></p><p class="gnv-note">' +
      t.disclaimer +
      '</p><p class="gnv-note"><a href="mailto:hello@afrotools.com?subject=Lesotho%20VAT%20calculation%20error">' +
      t.report +
      "</a></p></aside></div></div>";
    var state = { mode: "add", result: null };
    function id(x) {
      return document.getElementById(x);
    }
    function money(x) {
      return new Intl.NumberFormat(
        lang === "fr" ? "fr-FR" : lang === "sw" ? "sw-TZ" : "en-LS",
        { style: "currency", currency: "LSL", minimumFractionDigits: 2 },
      ).format(x);
    }
    function calc() {
      var kind = id("lsvRate").value,
        ev =
          kind === "confirmed-electricity-ten"
            ? e.ELECTRICITY_EVIDENCE
            : kind === "confirmed-zero"
              ? e.ZERO_EVIDENCE
              : null;
      try {
        state.result = e.calculate({
          amount: id("lsvAmount").value,
          mode: state.mode,
          rateKind: kind,
          rateEvidenceConfirmed: id("lsvEvidence").checked,
          rateEvidenceType: ev,
        });
        id("lsvError").textContent = "";
        id("lsvNet").textContent = money(state.result.net);
        id("lsvVat").textContent = money(state.result.vat);
        id("lsvGross").textContent = money(state.result.gross);
        id("lsvResult").classList.add("on");
      } catch (error) {
        state.result = null;
        id("lsvResult").classList.remove("on");
        id("lsvError").textContent =
          error.code === "RATE_EVIDENCE_REQUIRED" ? t.evidence : t.err;
      }
      id("lsvStatus").textContent = id("lsvError").textContent || t.calc + ".";
    }
    document.querySelectorAll("[data-mode]").forEach(function (b) {
      b.onclick = function () {
        state.mode = b.dataset.mode;
        document.querySelectorAll("[data-mode]").forEach(function (x) {
          x.setAttribute("aria-pressed", String(x === b));
        });
        calc();
      };
    });
    id("lsvForm").onsubmit = function (ev) {
      ev.preventDefault();
      calc();
    };
    id("lsvAmount").oninput = calc;
    id("lsvRate").onchange = function () {
      id("lsvEvidenceWrap").hidden = this.value === "standard";
      id("lsvEvidence").checked = false;
      calc();
    };
    id("lsvEvidence").onchange = calc;
    id("lsvShare").onclick = async function () {
      var url = location.origin + location.pathname;
      try {
        if (navigator.share)
          await navigator.share({ title: document.title, url: url });
        else await navigator.clipboard.writeText(url);
      } catch (error) {}
    };
    id("lsvPdf").onclick = function () {
      if (!state.result || !window.jspdf) return;
      var d = new window.jspdf.jsPDF();
      d.text(t.title, 20, 20);
      d.text(t.net + ": " + money(state.result.net), 20, 40);
      d.text(t.vat + ": " + money(state.result.vat), 20, 50);
      d.text(t.gross + ": " + money(state.result.gross), 20, 60);
      d.text(d.splitTextToSize(t.disclaimer, 170), 20, 80);
      d.save("lesotho-vat-estimate.pdf");
    };
    calc();
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})();
