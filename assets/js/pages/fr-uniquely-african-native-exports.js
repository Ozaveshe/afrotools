(function installFrenchUniquelyAfricanNativeExports(window, document) {
  "use strict";
  if (!window || !document || !document.body) return;

  var toolId = document.body.getAttribute("data-fr-ua-app");

  function text(selector) {
    var node = document.querySelector(selector);
    return node ? String(node.innerText || node.textContent || "").trim() : "";
  }

  function value(selector) {
    var node = document.querySelector(selector);
    return node ? String(node.value || "").trim() : "";
  }

  function rows(selector) {
    return Array.prototype.map.call(document.querySelectorAll(selector), function (row) {
      return Array.prototype.map.call(row.querySelectorAll("th,td"), function (cell) {
        return String(cell.innerText || cell.textContent || "").trim();
      });
    }).filter(function (row) { return row.length; });
  }

  /*
   * The contracts intentionally remain route-specific. The shared code below
   * owns safe export primitives only; each owner decides what its result is.
   */
  var contracts = {
    "japa-calculator": {
      anchor: 'button[onclick="calculate()"]',
      resultSelector: "#totUsd",
      missing: ["copy", "txt", "json", "pdf"],
      payload: function () {
        return {
          title: "Calculateur Japa",
          route: "/fr/tools/calculateur-japa/",
          origin: value("#oCtry") + " / " + value("#oCity"),
          destination: value("#dCtry") + " / " + value("#dCity"),
          totalUsd: text("#totUsd"),
          totalLocal: text("#totLocal"),
          targetDate: value("#targetDate"),
          planningRange: text("#pwNote"),
          ownerSource: "/tools/japa-calculator/",
          breakdown: text("#breakdown")
        };
      }
    },
    "mobile-money-fees": {
      anchor: 'button[onclick="compare()"]',
      resultSelector: "#mmTableBody",
      missing: ["copy", "json"],
      payload: function () {
        return {
          route: "/fr/tools/frais-mobile-money/",
          country: value("#mmCountry"),
          transaction: value("#mmTxType"),
          amount: value("#mmAmount"),
          comparison: rows("#mmTableBody tr"),
          cheapest: text("#cheapestTag"),
          tips: text("#mmTips")
        };
      }
    },
    "burial-cost": {
      anchor: "#saveBtn",
      resultSelector: "#result",
      missing: ["json"],
      payload: function () {
        return {
          route: "/fr/tools/cout-funerailles/",
          country: value("#country"),
          currency: value("#currency"),
          guests: value("#guests"),
          total: text("#result"),
          breakdown: text("#breakdown"),
          advice: text("#advice")
        };
      }
    },
    "naira-to-words": {
      anchor: "#save-result",
      resultSelector: "#summary-output",
      missing: ["json"],
      payload: function () {
        return {
          route: "/fr/tools/naira-en-lettres/",
          amount: value("#amount"),
          numeric: text("#numeric-output"),
          englishWords: text("#english-output"),
          frenchWords: text("#french-output"),
          summary: text("#summary-output")
        };
      }
    },
    "amount-words-ke": {
      anchor: "#saveBtn",
      resultSelector: "#result",
      missing: ["json"],
      payload: function () {
        return {
          route: "/fr/tools/montant-lettres-ke/",
          amount: value("#amount"),
          mode: value("#mode"),
          style: value("#style"),
          result: text("#result")
        };
      }
    },
    "amount-words-gh": {
      anchor: "#saveBtn",
      resultSelector: "#wordsOutput",
      missing: ["json"],
      payload: function () {
        return {
          route: "/fr/tools/montant-lettres-gh/",
          amount: value("#amount"),
          ending: value("#ending"),
          words: text("#wordsOutput"),
          cheque: text("#chequeOutput"),
          invoice: text("#invoiceOutput")
        };
      }
    },
    "susu-tracker": {
      anchor: "#saveSusu",
      resultSelector: "#susuSummary",
      missing: ["csv", "json"],
      payload: function () {
        return {
          route: "/fr/tools/suivi-susu/",
          group: value("#groupName"),
          contribution: value("#contribution"),
          pot: text("#potAmount"),
          receiver: text("#receiverName"),
          arrears: text("#arrearsList"),
          schedule: rows("#scheduleBody tr"),
          summary: text("#susuSummary")
        };
      }
    },
    "whatsapp-link": {
      anchor: "#saveWa",
      resultSelector: "#waLink",
      missing: ["json"],
      payload: function () {
        return {
          route: "/fr/tools/lien-whatsapp/",
          countryCode: value("#countryCode"),
          phone: value("#phone"),
          message: value("#message"),
          link: text("#waLink"),
          encodedMessage: text("#encodedMessage"),
          htmlSnippet: text("#htmlSnippet")
        };
      }
    },
    "remittance-compare": {
      anchor: "#frRemitJson",
      resultSelector: "#providerCards",
      missing: [],
      payload: function () {
        return window.frRemittancePayload || {
          route: "/fr/tools/transfert-argent/",
          amount: value("#amount"),
          providers: text("#providerCards"),
          savings: text("#savingsNote")
        };
      }
    },
    "remittance-v2": {
      anchor: "#saveLocal",
      resultSelector: "#resultPanel",
      missing: ["json"],
      payload: function () {
        return {
          route: "/fr/tools/transfert-v2/",
          amount: value("#amount"),
          fromCurrency: value("#fromCurrency"),
          toCurrency: value("#toCurrency"),
          midRate: value("#midRate"),
          priority: value("#priority"),
          result: text("#resultPanel")
        };
      }
    },
    "brideprice-advisor": {
      anchor: "#saveBtn",
      resultSelector: "#ua-bp-result",
      missing: ["json"],
      payload: function () {
        return window.AfroToolsFrenchBridePricePayload || {
          route: "/fr/tools/conseiller-dot/",
          guide: text("#ua-bp-result")
        };
      }
    },
    "ajo-interest": {
      anchor: "#saveBtn",
      resultSelector: "#summaryOut",
      missing: ["json"],
      payload: function () {
        return {
          route: "/fr/tools/interet-tontine/",
          members: value("#members"),
          contribution: value("#contribution"),
          position: value("#position"),
          pot: text("#potOut"),
          paidOut: text("#paidOut"),
          net: text("#netOut"),
          annualizedRate: text("#aprOut"),
          risk: text("#riskOut"),
          schedule: rows("#scheduleBody tr"),
          summary: text("#summaryOut")
        };
      }
    },
    "market-days": {
      anchor: "#save-result",
      resultSelector: "#summary-output",
      missing: ["json"],
      payload: function () {
        return {
          route: "/fr/tools/jours-marche/",
          country: value("#country"),
          market: value("#market-name"),
          cycle: value("#cycle"),
          knownDate: value("#known-date"),
          nextDates: text("#next-output"),
          summary: text("#summary-output")
        };
      }
    },
    "ajo-chama-calc": {
      anchor: "#saveBtn",
      resultSelector: "#summary",
      missing: ["json", "print"],
      payload: function () {
        return {
          route: "/fr/tools/ajo-chama/",
          group: value("#groupName"),
          currency: value("#currency"),
          contribution: value("#contribution"),
          members: value("#members"),
          pot: text("#potValue"),
          payout: text("#payoutValue"),
          risk: text("#riskNote"),
          schedule: rows("#scheduleBody tr"),
          summary: text("#summary")
        };
      }
    }
  };

  var contract = contracts[toolId];
  if (!contract) return;

  function hasMeaningfulResult(payload) {
    return Object.keys(payload).some(function (key) {
      if (key === "route") return false;
      var item = payload[key];
      return Array.isArray(item) ? item.length > 0 : String(item || "").trim().length > 0;
    });
  }

  function status(message, error) {
    var actions = document.querySelector("[data-native-export-actions]");
    if (!actions) return;
    var node = actions.querySelector("[data-native-export-status]");
    if (!node) {
      node = document.createElement("p");
      node.setAttribute("data-native-export-status", "");
      node.setAttribute("role", "status");
      node.setAttribute("aria-live", "polite");
      actions.appendChild(node);
    }
    node.textContent = message;
    node.classList.toggle("ua-native-error", Boolean(error));
  }

  function currentPayload() {
    if (!text(contract.resultSelector)) {
      status("Calculez d’abord un résultat avant de l’exporter.", true);
      return null;
    }
    var payload = contract.payload();
    if (!hasMeaningfulResult(payload)) {
      status("Calculez d’abord un résultat avant de l’exporter.", true);
      return null;
    }
    return payload;
  }

  function plainText(payload) {
    return Object.keys(payload).map(function (key) {
      var item = payload[key];
      if (Array.isArray(item)) {
        return key + ":\n" + item.map(function (row) {
          return Array.isArray(row) ? row.join(" | ") : String(row);
        }).join("\n");
      }
      return key + ": " + item;
    }).join("\n\n");
  }

  function download(name, content, type) {
    var blob = new Blob([content], { type: type });
    var href = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = href;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(href); }, 1000);
  }

  var jsPdfPromise = null;
  function ensureJsPdf() {
    if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
    if (jsPdfPromise) return jsPdfPromise;
    jsPdfPromise = new Promise(function (resolve, reject) {
      var existing = document.querySelector("script[data-fr-ua-jspdf]");
      var script = existing || document.createElement("script");
      function ready() {
        if (window.jspdf && window.jspdf.jsPDF) resolve(window.jspdf.jsPDF);
        else reject(new Error("jspdf_unavailable"));
      }
      script.addEventListener("load", ready, { once: true });
      script.addEventListener("error", reject, { once: true });
      if (!existing) {
        script.src = "/assets/vendor/jspdf/jspdf.umd.min.js";
        script.setAttribute("data-fr-ua-jspdf", "");
        document.head.appendChild(script);
      }
    });
    return jsPdfPromise;
  }

  function pdfBlob(payload) {
    var safe = plainText(payload).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E\n]/g, "?");
    return ensureJsPdf().then(function (JsPdf) {
      var pdf = new JsPdf({ unit: "pt", format: "a4", compress: false });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      var lines = pdf.splitTextToSize(safe, 495);
      var y = 50;
      lines.forEach(function (line) {
        if (y > 790) {
          pdf.addPage();
          y = 50;
        }
        pdf.text(line || " ", 50, y);
        y += 14;
      });
      return pdf.output("blob");
    });
  }

  function csv(payload) {
    var schedule = payload.schedule || [];
    return schedule.map(function (row) {
      return row.map(function (cell) {
        return '"' + String(cell).replace(/"/g, '""') + '"';
      }).join(",");
    }).join("\r\n");
  }

  var labels = {
    copy: "Copier le résultat",
    txt: "Télécharger TXT",
    json: "Télécharger JSON",
    csv: "Télécharger CSV",
    pdf: "Télécharger PDF",
    print: "Imprimer"
  };

  function run(format) {
    var payload = currentPayload();
    if (!payload) return;
    var base = "afrotools-" + toolId;
    if (format === "copy") {
      navigator.clipboard.writeText(plainText(payload)).then(function () {
        status("Résultat copié.");
      }, function () {
        status("La copie a échoué. Utilisez un navigateur autorisant le presse-papiers.", true);
      });
    } else if (format === "txt") {
      download(base + ".txt", plainText(payload), "text/plain;charset=utf-8");
      status("Export TXT préparé.");
    } else if (format === "json") {
      download(base + ".json", JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
      status("Export JSON préparé.");
    } else if (format === "csv") {
      download(base + ".csv", csv(payload), "text/csv;charset=utf-8");
      status("Export CSV préparé.");
    } else if (format === "pdf") {
      pdfBlob(payload).then(function (blob) {
        download(base + ".pdf", blob, "application/pdf");
        status("Export PDF préparé.");
      }).catch(function () {
        status("L’export PDF a échoué.", true);
      });
    } else if (format === "print") {
      window.print();
      status("Dialogue d’impression ouvert.");
    }
  }

  if (contract.missing.length) {
    var actions = document.createElement("div");
    actions.className = "ua-native-export-actions";
    actions.setAttribute("data-native-export-actions", "");
    contract.missing.forEach(function (format) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-secondary";
      button.setAttribute("data-native-export", format);
      button.textContent = labels[format];
      button.addEventListener("click", function () { run(format); });
      actions.appendChild(button);
    });
    var anchor = document.querySelector(contract.anchor);
    (anchor && anchor.parentElement || document.body).appendChild(actions);
  }

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.frenchUniquelyAfricanNativeExports = {
    toolId: toolId,
    contract: contract,
    payload: contract.payload
  };
})(window, document);
