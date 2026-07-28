(function () {
  "use strict";

  function init() {
    var engine = window.AfroTools && window.AfroTools.GWVatEngine;
    if (!engine) return;

    var requested = (document.documentElement.lang || "en").slice(0, 2);
    var lang = requested === "sw" ? "sw" : requested === "fr" ? "fr" : "en";
    var copy = {
      en: {
        title: "Guinea-Bissau VAT calculator",
        lead: "Add or extract VAT locally in CFA francs using the current DGCI 19% standard rate. Reduced and zero rates stay locked until exact CIVA evidence is confirmed.",
        amount: "Amount",
        add: "Add VAT",
        extract: "Extract VAT",
        rate: "VAT treatment",
        standard: "Standard taxable supply — 19%",
        reduced: "Exact Article 18 Annex I supply — 10%",
        zero: "Confirmed export under Article 18 — 0%",
        confirm: "I confirmed the transaction exactly matches the selected CIVA treatment and retained supporting evidence.",
        calc: "Calculate",
        net: "Amount before VAT",
        vat: "VAT",
        gross: "Amount including VAT",
        pdf: "Download local PDF",
        share: "Share safe link",
        rules: "Current DGCI boundaries",
        source: "Official sources",
        sourceOne: "DGCI Kontaktu — current IVA notices",
        sourceTwo: "Ministry of Finance — legislation",
        r1: "CIVA Article 18 sets 19% for supplies not listed in Annex I.",
        r2: "10% requires an exact Annex I product or service match.",
        r3: "0% applies to exports and requires export evidence.",
        r4: "Exemptions are not zero-rated and are not calculated here.",
        err: "Enter a non-negative amount.",
        evidence: "Confirm the exact CIVA evidence before using this treatment.",
        done: "Result updated.",
        shared: "Safe link ready.",
        disclaimer: "Planning estimate only. Confirm classification, registration, invoicing, deduction and filing with DGCI or a qualified adviser.",
      },
      fr: {
        title: "Calculateur de TVA Guinée-Bissau",
        lead: "Ajoutez ou extrayez la TVA localement en francs CFA au taux normal DGCI de 19 %. Les taux de 10 % et 0 % restent verrouillés tant que la preuve CIVA exacte n’est pas confirmée.",
        amount: "Montant",
        add: "Ajouter la TVA",
        extract: "Extraire la TVA",
        rate: "Traitement TVA",
        standard: "Opération taxable au taux normal — 19 %",
        reduced: "Opération exacte de l’annexe I, article 18 — 10 %",
        zero: "Exportation confirmée selon l’article 18 — 0 %",
        confirm: "Je confirme que l’opération correspond exactement au traitement CIVA choisi et que j’ai conservé les justificatifs.",
        calc: "Calculer",
        net: "Montant hors TVA",
        vat: "TVA",
        gross: "Montant TVA comprise",
        pdf: "Télécharger le PDF local",
        share: "Partager un lien sans données",
        rules: "Règles DGCI actuellement vérifiées",
        source: "Sources officielles",
        sourceOne: "DGCI Kontaktu — avis IVA en vigueur",
        sourceTwo: "Ministère des Finances — législation",
        r1: "L’article 18 du CIVA fixe 19 % pour les opérations absentes de l’annexe I.",
        r2: "Le taux de 10 % exige une correspondance exacte avec un bien ou service de l’annexe I.",
        r3: "Le taux de 0 % s’applique aux exportations et exige un justificatif d’exportation.",
        r4: "Une exonération n’est pas un taux zéro et n’est pas calculée ici.",
        err: "Saisissez un montant positif ou nul.",
        evidence: "Confirmez la preuve CIVA exacte avant d’utiliser ce traitement.",
        done: "Résultat mis à jour.",
        shared: "Lien sans données prêt.",
        disclaimer: "Estimation de planification uniquement. Confirmez la classification, l’immatriculation, la facturation, la déduction et la déclaration auprès de la DGCI ou d’un conseiller qualifié.",
      },
      sw: {
        title: "Kikokotoo cha VAT Guinea-Bissau",
        lead: "Ongeza au toa VAT kwenye kifaa chako kwa faranga za CFA kwa kiwango cha kawaida cha DGCI cha 19%. Viwango maalum vimefungwa hadi uthibitishe ushahidi halisi wa CIVA.",
        amount: "Kiasi",
        add: "Ongeza VAT",
        extract: "Toa VAT",
        rate: "Aina ya VAT",
        standard: "Muamala wa kawaida unaotozwa — 19%",
        reduced: "Bidhaa au huduma halisi ya Kiambatisho I, Kifungu 18 — 10%",
        zero: "Usafirishaji uliothibitishwa chini ya Kifungu 18 — 0%",
        confirm: "Nimethibitisha muamala unalingana kabisa na aina iliyochaguliwa ya CIVA na nimehifadhi ushahidi.",
        calc: "Kokotoa",
        net: "Kiasi kabla ya VAT",
        vat: "VAT",
        gross: "Kiasi pamoja na VAT",
        pdf: "Pakua PDF kwenye kifaa",
        share: "Shiriki kiungo salama",
        rules: "Mipaka ya sasa ya DGCI",
        source: "Vyanzo rasmi",
        sourceOne: "DGCI Kontaktu — taarifa za sasa za IVA",
        sourceTwo: "Wizara ya Fedha — sheria",
        r1: "Kifungu cha 18 kinaweka 19% kwa miamala isiyo kwenye Kiambatisho I.",
        r2: "10% inahitaji mstari halisi wa bidhaa au huduma katika Kiambatisho I.",
        r3: "0% ni kwa usafirishaji nje na inahitaji ushahidi.",
        r4: "Misamaha si VAT ya 0% na haikokotolewi hapa.",
        err: "Weka kiasi kisicho hasi.",
        evidence: "Thibitisha ushahidi halisi wa CIVA kabla ya kutumia aina hii.",
        done: "Matokeo yamesasishwa.",
        shared: "Kiungo salama kiko tayari.",
        disclaimer: "Makadirio ya kupanga tu. Thibitisha aina, usajili, ankara, makato na uwasilishaji na DGCI au mshauri mwenye sifa.",
      },
    }[lang];

    var navbar = document.querySelector("afro-navbar");
    var footer = document.querySelector("afro-footer");
    var main = document.createElement("main");
    if (navbar && footer) {
      var node = navbar.nextSibling;
      while (node && node !== footer) {
        var next = node.nextSibling;
        node.remove();
        node = next;
      }
      footer.parentNode.insertBefore(main, footer);
    } else {
      var old = document.querySelector("main");
      if (!old) return;
      old.replaceWith(main);
    }

    main.id = "main-content";
    document.title = copy.title + " | AfroTools";
    main.innerHTML =
      '<div class="gnv-shell"><section class="gnv-hero"><div class="gnv-kicker">DGCI · ' +
      copy.rules +
      "</div><h1>" +
      copy.title +
      '</h1><p class="gnv-lede">' +
      copy.lead +
      '</p></section><div class="gnv-grid"><form class="gnv-card" id="gwvForm"><div class="gnv-switch"><button class="gnv-button" type="button" data-mode="add" aria-pressed="true">' +
      copy.add +
      '</button><button class="gnv-button" type="button" data-mode="extract" aria-pressed="false">' +
      copy.extract +
      '</button></div><label class="gnv-field" for="gwvAmount">' +
      copy.amount +
      ' (XOF)</label><input class="gnv-input" id="gwvAmount" type="number" min="0" step="1" inputmode="numeric" value="100000"><label class="gnv-field" for="gwvRate">' +
      copy.rate +
      '</label><select class="gnv-select" id="gwvRate"><option value="standard">' +
      copy.standard +
      '</option><option value="confirmed-annex-1-ten">' +
      copy.reduced +
      '</option><option value="confirmed-export-zero">' +
      copy.zero +
      '</option></select><label class="gnv-evidence" id="gwvEvidenceWrap" hidden><input id="gwvEvidence" type="checkbox"><span>' +
      copy.confirm +
      '</span></label><button class="gnv-button gnv-primary" type="submit">' +
      copy.calc +
      '</button><p class="gnv-error" id="gwvError"></p><section class="gnv-result" id="gwvResult" aria-label="' +
      copy.calc +
      '"><dl><dt>' +
      copy.net +
      '</dt><dd id="gwvNet"></dd><dt>' +
      copy.vat +
      '</dt><dd id="gwvVat"></dd><dt>' +
      copy.gross +
      '</dt><dd id="gwvGross"></dd></dl><div class="gnv-actions"><button class="gnv-button" type="button" id="gwvPdf">' +
      copy.pdf +
      '</button><button class="gnv-button" type="button" id="gwvShare">' +
      copy.share +
      '</button></div></section><div class="gnv-status" id="gwvStatus" aria-live="polite"></div></form><aside class="gnv-card"><h2>' +
      copy.rules +
      '</h2><ul class="gnv-list"><li>' +
      copy.r1 +
      "</li><li>" +
      copy.r2 +
      "</li><li>" +
      copy.r3 +
      "</li><li>" +
      copy.r4 +
      "</li></ul><h2>" +
      copy.source +
      '</h2><p class="gnv-note"><a href="https://kontaktu.mef.gw/" rel="noopener">' +
      copy.sourceOne +
      '</a><br><a href="https://kontaktu.mef.gw/legislation" rel="noopener">' +
      copy.sourceTwo +
      '</a></p><p class="gnv-note">' +
      copy.disclaimer +
      "</p></aside></div></div>";

    var state = { mode: "add", result: null };
    function id(value) {
      return document.getElementById(value);
    }
    function money(value) {
      var locale = lang === "sw" ? "sw-TZ" : lang === "fr" ? "fr-FR" : "en-GB";
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "XOF",
        maximumFractionDigits: 0,
      }).format(value);
    }
    function calculate() {
      var kind = id("gwvRate").value;
      var evidenceType =
        kind === "confirmed-annex-1-ten"
          ? engine.REDUCED_EVIDENCE
          : kind === "confirmed-export-zero"
            ? engine.ZERO_EVIDENCE
            : null;
      try {
        state.result = engine.calculate({
          amount: id("gwvAmount").value,
          mode: state.mode,
          rateKind: kind,
          rateEvidenceConfirmed: id("gwvEvidence").checked,
          rateEvidenceType: evidenceType,
        });
        id("gwvError").textContent = "";
        id("gwvNet").textContent = money(state.result.net);
        id("gwvVat").textContent = money(state.result.vat);
        id("gwvGross").textContent = money(state.result.gross);
        id("gwvResult").classList.add("on");
      } catch (error) {
        state.result = null;
        id("gwvResult").classList.remove("on");
        id("gwvError").textContent =
          error.code === "RATE_EVIDENCE_REQUIRED" ? copy.evidence : copy.err;
      }
      id("gwvStatus").textContent = id("gwvError").textContent || copy.done;
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
    id("gwvForm").onsubmit = function (event) {
      event.preventDefault();
      calculate();
    };
    id("gwvAmount").oninput = calculate;
    id("gwvRate").onchange = function () {
      id("gwvEvidenceWrap").hidden = this.value === "standard";
      id("gwvEvidence").checked = false;
      calculate();
    };
    id("gwvEvidence").onchange = calculate;
    id("gwvShare").onclick = async function () {
      var url = location.origin + location.pathname;
      try {
        if (navigator.share) await navigator.share({ title: document.title, url: url });
        else await navigator.clipboard.writeText(url);
        id("gwvStatus").textContent = copy.shared;
      } catch (error) {
        if (error.name !== "AbortError") id("gwvStatus").textContent = copy.err;
      }
    };
    id("gwvPdf").onclick = function () {
      if (!state.result || !window.jspdf) return;
      var documentPdf = new window.jspdf.jsPDF();
      documentPdf.text(copy.title, 20, 20);
      documentPdf.text(copy.net + ": " + money(state.result.net), 20, 40);
      documentPdf.text(copy.vat + ": " + money(state.result.vat), 20, 50);
      documentPdf.text(copy.gross + ": " + money(state.result.gross), 20, 60);
      documentPdf.text(documentPdf.splitTextToSize(copy.disclaimer, 170), 20, 80);
      documentPdf.save("guinea-bissau-tva-estimation.pdf");
    };
    calculate();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
