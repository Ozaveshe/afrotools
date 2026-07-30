(function installFrenchUniquelyAfricanNativeGuards(document) {
  "use strict";
  if (!document || !document.body) return;

  var toolId = document.body.getAttribute("data-fr-ua-app");
  if (toolId && !document.getElementById("fr-ua-native-reflow")) {
    var reflowStyle = document.createElement("style");
    reflowStyle.id = "fr-ua-native-reflow";
    reflowStyle.textContent = [
      "@media (max-width:480px){",
      "body[data-fr-ua-app] :where(main,section,article,aside,form,div){min-width:0;max-width:100%}",
      "body[data-fr-ua-app] :where(h1,h2,h3,p,pre,a,span,strong,small,button,label,th,td){overflow-wrap:anywhere}",
      "body[data-fr-ua-app] pre{max-width:100%;white-space:pre-wrap;word-break:break-word}",
      "body[data-fr-ua-app] :where(img,svg,canvas){max-width:100%}",
      "body[data-fr-ua-app] :where(table,thead,tbody,tr,th,td){box-sizing:border-box;display:block!important;max-width:100%!important;width:100%!important}",
      "body[data-fr-ua-app] :where(.mm-table-wrap,.table-wrap,.table-scroll,.table-responsive){overflow:visible!important}",
      "body[data-fr-ua-app] figure.ua-native-artwork{box-sizing:border-box;margin:16px 0;max-width:100%;min-width:0}",
      "body[data-fr-ua-app] figure.ua-native-artwork img{display:block;height:auto;max-width:100%;width:320px}",
      "body[data-fr-ua-app] #numeric-output{overflow-wrap:anywhere;word-break:break-word}",
      "body[data-fr-ua-app] :where(a,button,input,select,textarea,[tabindex]):focus-visible{outline:3px solid #0062cc!important;outline-offset:3px!important}",
      "body[data-fr-ua-app=\"japa-calculator\"] #results .tot-card{background:#111827}",
      "body[data-fr-ua-app=\"japa-calculator\"] #results :where(.tot-lbl,.tot-sub,.range-bar-title,.range-labels,.range-labels span,.sp-bar-title){color:#f8fafc!important}",
      "body[data-fr-ua-app=\"japa-calculator\"] .stats-bar{display:grid!important;grid-template-columns:1fr!important;overflow:visible!important}",
      "body[data-fr-ua-app=\"japa-calculator\"] .stats-bar .stat-item{box-sizing:border-box;min-width:0;width:100%!important}",
      "body[data-fr-ua-app=\"mobile-money-fees\"] #resultsSection :where(.mm-bk-lbl,.mm-table th,.fee-bar-cell>span){color:#4b5563!important}",
      "body[data-fr-ua-app=\"remittance-compare\"] #providerCards .provider-card{color:#0f172a}",
      "body[data-fr-ua-app=\"remittance-compare\"] #results .card{overflow:visible!important}",
      "body[data-fr-ua-app=\"remittance-compare\"] #providerCards .provider-card{grid-template-columns:1fr!important}",
      "body[data-fr-ua-app=\"remittance-compare\"] #providerCards .provider-card :where(div,span,strong){color:#334155!important}",
      "body[data-fr-ua-app=\"remittance-compare\"] #providerCards .provider-card :where(.provider-name,strong,.total-cost){color:#0f172a!important}",
      "body[data-fr-ua-app=\"remittance-compare\"] #providerCards .provider-card .best-badge{background:#166534!important;color:#fff!important}",
      "body[data-fr-ua-app=\"remittance-v2\"] :where(.rank-table,.rank-row){box-sizing:border-box;max-width:100%!important;width:100%!important}",
      "body[data-fr-ua-app=\"remittance-v2\"] .rank-table{display:block!important;overflow:visible!important}",
      "body[data-fr-ua-app=\"remittance-v2\"] .rank-row{display:grid!important;grid-template-columns:1fr!important}",
      "}"
    ].join("");
    document.head.appendChild(reflowStyle);
  }
  if (toolId && window.customElements && typeof window.customElements.whenDefined === "function") {
    window.customElements.whenDefined("afro-business-cta").then(function () {
      document.querySelectorAll("afro-business-cta").forEach(function (host) {
        if (!host.shadowRoot || host.shadowRoot.getElementById("fr-ua-business-reflow")) return;
        var style = document.createElement("style");
        style.id = "fr-ua-business-reflow";
        style.textContent = [
          "@media (max-width:480px){",
          ":host,.wrap,.wrap>*{min-width:0;max-width:100%}",
          ".wrap{padding:16px;width:100%}",
          "h2,p,a,.save-note{overflow-wrap:anywhere}",
          "}"
        ].join("");
        host.shadowRoot.appendChild(style);
      });
    });
    window.customElements.whenDefined("afro-newsletter-cta").then(function () {
      document.querySelectorAll("afro-newsletter-cta").forEach(function (host) {
        if (!host.shadowRoot || host.shadowRoot.getElementById("fr-ua-newsletter-focus")) return;
        var style = document.createElement("style");
        style.id = "fr-ua-newsletter-focus";
        style.textContent = "input:focus-visible,button:focus-visible{outline:3px solid #0062cc!important;outline-offset:3px!important}";
        host.shadowRoot.appendChild(style);
      });
    });
    window.customElements.whenDefined("afro-footer").then(function () {
      document.querySelectorAll("afro-footer").forEach(function (host) {
        if (!host.shadowRoot || host.shadowRoot.getElementById("fr-ua-footer-focus")) return;
        var style = document.createElement("style");
        style.id = "fr-ua-footer-focus";
        style.textContent = "a:focus-visible,input:focus-visible,button:focus-visible{outline:3px solid #0062cc!important;outline-offset:3px!important}";
        host.shadowRoot.appendChild(style);
      });
    });
  }
  var contracts = {
    "japa-calculator": {
      action: 'button[onclick="calculate()"]',
      fields: [{ selector: "#monthlyIncome", min: 0, optional: true }, { selector: "#savingsRate", min: 0, max: 100 }],
      clear: ["#results"],
      message: "Le revenu mensuel et le taux d’épargne ne peuvent pas être négatifs."
    },
    "mobile-money-fees": {
      action: 'button[onclick="compare()"]',
      fields: [{ selector: "#mmAmount", minExclusive: 0 }],
      clear: ["#resultsSection"],
      message: "Saisissez un montant Mobile Money strictement supérieur à zéro."
    },
    "burial-cost": {
      action: '#funeralForm button[type="submit"]',
      fields: [{ selector: "#contributors", min: 1 }, { selector: "#deadlineDays", min: 1 }],
      clear: ["#result", "#breakdown", "#advice"],
      message: "Saisissez au moins un foyer contributeur et un jour avant l’échéance."
    },
    "naira-to-words": {
      action: '#ngn-form button[type="submit"]',
      fields: [{ selector: "#amount", numericText: true, min: 0 }],
      clear: ["#summary-output", "#english-output", "#numeric-output"],
      message: "Saisissez un montant numérique valide en nairas."
    },
    "amount-words-ke": {
      action: '#amountForm button[type="submit"]',
      fields: [{ selector: "#amount", numericText: true, min: 0 }],
      clear: ["#result"],
      message: "Saisissez un montant numérique valide en shillings kényans."
    },
    "amount-words-gh": {
      action: '#wordsForm button[type="submit"]',
      fields: [{ selector: "#amount", numericText: true, min: 0 }],
      clear: ["#wordsOutput", "#chequeOutput", "#invoiceOutput"],
      message: "Saisissez un montant numérique valide en cedis."
    },
    "susu-tracker": {
      action: '#susuForm button[type="submit"]',
      fields: [{ selector: "#contribution", minExclusive: 0 }, { selector: "#members", nonEmptyLines: 2 }],
      clear: ["#potAmount", "#receiverName", "#arrearsCount", "#arrearsList", "#scheduleBody", "#susuSummary"],
      message: "Saisissez une cotisation positive et au moins deux membres."
    },
    "whatsapp-link": {
      action: '#waForm button[type="submit"]',
      fields: [{ selector: "#phone", digits: { min: 8, max: 15 } }],
      clear: ["#waLink", "#encodedMessage", "#htmlSnippet", "#waQr"],
      message: "Saisissez un numéro WhatsApp de 8 à 15 chiffres après nettoyage."
    },
    "remittance-compare": {
      action: 'button[onclick="compare()"]',
      fields: [{ selector: "#amount", minExclusive: 0 }],
      clear: ["#providerCards", "#savingsNote", "#results"],
      message: "Saisissez un montant de transfert strictement supérieur à zéro."
    },
    "remittance-v2": {
      action: '#remittanceForm button[type="submit"], form button[type="submit"]',
      fields: [{ selector: "#amount", minExclusive: 0 }, { selector: "#midRate", minExclusive: 0 }],
      clear: ["#resultPanel"],
      message: "Saisissez un montant et un taux de référence strictement supérieurs à zéro."
    },
    "brideprice-advisor": {
      action: '#advisorForm button[type="submit"], form button[type="submit"]',
      fields: [{ selector: "#symbolicGift", min: 0 }, { selector: "#familyGifts", min: 0 }, { selector: "#months", minExclusive: 0 }],
      clear: ["#ua-bp-result", "#totalOut", "#gapOut", "#monthlyOut", "#shareOut", "#checkOut", "#riskBox", "#summaryOut"],
      message: "Les coûts ne peuvent pas être négatifs et la durée doit être positive."
    },
    "ajo-interest": {
      action: '#ajoForm button[type="submit"], form button[type="submit"]',
      fields: [{ selector: "#members", min: 3 }, { selector: "#contribution", minExclusive: 0 }, { selector: "#position", minExclusive: 0 }],
      clear: ["#result", "#summaryOut", "#scheduleBody"],
      message: "Saisissez au moins trois membres, une cotisation positive et un rang valide."
    },
    "market-days": {
      action: '#market-form button[type="submit"]',
      fields: [{ selector: "#known-date", required: true }, { selector: "#count", minExclusive: 0 }],
      clear: ["#summary-output", "#next-output", "#count-output"],
      message: "Saisissez une date connue et un nombre positif de jours de marché."
    },
    "ajo-chama-calc": {
      action: "#planBtn",
      fields: [{ selector: "#contribution", minExclusive: 0 }, { selector: "#members", nonEmptyLines: 2 }],
      clear: ["#summary", "#scheduleBody"],
      message: "Saisissez une cotisation positive et au moins deux membres."
    }
  };

  var contract = contracts[toolId];
  if (!contract) return;
  contract.clear.forEach(function (selector) {
    document.querySelectorAll(selector).forEach(function (node) {
      if (!node.hasAttribute("role")) node.setAttribute("role", "region");
      if (!node.hasAttribute("aria-live")) node.setAttribute("aria-live", "polite");
      if (!node.hasAttribute("aria-atomic")) node.setAttribute("aria-atomic", "false");
    });
  });

  function numericValue(field) {
    var normalized = String(field.value || "").replace(/[\s,]/g, "");
    return normalized === "" ? NaN : Number(normalized);
  }

  function invalidField(rule) {
    var field = document.querySelector(rule.selector);
    if (!field) return null;
    var raw = String(field.value || "").trim();
    if (rule.optional && raw === "") return null;
    if (rule.required && raw === "") return field;
    if (rule.nonEmptyLines && raw.split(/\n+/).map(function (line) { return line.trim(); }).filter(Boolean).length < rule.nonEmptyLines) return field;
    if (rule.digits) {
      var digits = raw.replace(/\D/g, "");
      if (digits.length < rule.digits.min || digits.length > rule.digits.max) return field;
      return null;
    }
    if (rule.numericText || rule.min != null || rule.minExclusive != null || rule.max != null) {
      var value = numericValue(field);
      if (!Number.isFinite(value)) return field;
      if (rule.min != null && value < rule.min) return field;
      if (rule.minExclusive != null && value <= rule.minExclusive) return field;
      if (rule.max != null && value > rule.max) return field;
    }
    return null;
  }

  function statusNode() {
    var selectors = ["[data-native-guard-status]", "#status", "#susuStatus", "#waLine", "#remitStatus", "[role=status]"];
    for (var index = 0; index < selectors.length; index += 1) {
      var existing = document.querySelector(selectors[index]);
      if (existing) return existing;
    }
    var node = document.createElement("p");
    node.setAttribute("data-native-guard-status", "");
    node.setAttribute("role", "status");
    node.setAttribute("aria-live", "assertive");
    var action = document.querySelector(contract.action);
    (action && action.parentElement || document.body).appendChild(node);
    return node;
  }

  function failClosed(event) {
    var invalid = null;
    for (var index = 0; index < contract.fields.length; index += 1) {
      invalid = invalidField(contract.fields[index]);
      if (invalid) break;
    }
    if (!invalid) return false;
    event.preventDefault();
    event.stopImmediatePropagation();
    contract.clear.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (node) {
        if (node.id === "results" || node.id === "resultsSection") node.style.display = "none";
        else node.textContent = "";
      });
    });
    var status = statusNode();
    status.textContent = contract.message;
    status.classList.add("ua-native-error");
    invalid.setAttribute("aria-invalid", "true");
    invalid.focus();
    return true;
  }

  document.addEventListener("click", function (event) {
    var action = event.target && event.target.closest && event.target.closest(contract.action);
    if (action) failClosed(event);
  }, true);
  document.addEventListener("submit", function (event) {
    var action = document.querySelector(contract.action);
    if (action && event.target && (action.form === event.target || event.target.contains(action))) failClosed(event);
  }, true);
})(document);
