(function () {
  "use strict";

  var engine = window.AfroTools && window.AfroTools.cryptoProfit;
  var form = document.getElementById("cryptoProfitForm");
  if (!engine || !form) return;

  var lang = document.documentElement.lang === "fr" ? "fr" : "en";
  var locale = lang === "fr" ? "fr-FR" : "en";
  var copy = {
    en: {
      ready: "Enter one trade in a single display currency, then calculate.",
      calculated: "Calculation ready. Review the method before exporting.",
      invalid: "Check the highlighted inputs. ",
      noResult: "Calculate a valid result before exporting.",
      csv: "CSV downloaded locally.",
      json: "JSON downloaded locally.",
      pdf: "PDF downloaded locally.",
      pdfUnavailable: "PDF creation is unavailable in this browser. Use Print / Save PDF instead.",
      print: "Opening the print dialog. Choose Save as PDF to keep a second PDF copy.",
      title: "Crypto profit or loss worksheet",
      method: "Method",
      methodText: "Net P/L = net sale proceeds - total acquisition cost. ROI = net P/L / total acquisition cost. Percentage sell fees are recalculated at each user-entered scenario price.",
      inputSource: "Input source: all prices, quantity and fees were entered by the user. No live price, conversion, forecast or recommendation was used.",
      planning: "Planning arithmetic only; not financial, tax or trading advice.",
      percentError: "A percentage fee must be below 100.",
      limitError: "One or more values exceed the supported safe calculation limit.",
      profit: "Net profit",
      loss: "Net loss",
      result: "Result",
      scenarioCaption: "User-entered sell-price scenarios",
      noScenarios: "Add one or more optional scenario prices to compare them.",
      labels: {
        currency: "Display currency",
        buyPrice: "Buy price per unit",
        sellPrice: "Sell price per unit",
        quantity: "Quantity",
        buyFee: "Buy fee",
        sellFee: "Sell fee",
        acquisitionValue: "Acquisition value before fee",
        buyFeeAmount: "Buy fee amount",
        totalCost: "Total acquisition cost",
        disposalValue: "Gross sale proceeds",
        sellFeeAmount: "Sell fee amount",
        netProceeds: "Net sale proceeds",
        netProfit: "Net profit / loss",
        roi: "ROI on total acquisition cost",
        breakEven: "Break-even sell price"
      },
      columns: {
        price: "Entered sell price",
        proceeds: "Net proceeds",
        fees: "Total fees",
        profit: "Net profit / loss",
        roi: "ROI"
      }
    },
    fr: {
      ready: "Saisissez une opération dans une seule devise d'affichage, puis calculez.",
      calculated: "Calcul terminé. Vérifiez la méthode avant d'exporter.",
      invalid: "Vérifiez les champs signalés. ",
      noResult: "Calculez un résultat valide avant d'exporter.",
      csv: "CSV téléchargé localement.",
      json: "JSON téléchargé localement.",
      pdf: "PDF téléchargé localement.",
      pdfUnavailable: "La création du PDF n'est pas disponible dans ce navigateur. Utilisez Imprimer / Enregistrer en PDF.",
      print: "Ouverture de la boîte d'impression. Choisissez Enregistrer en PDF pour conserver une seconde copie PDF.",
      title: "Feuille de calcul du profit ou de la perte crypto",
      method: "Méthode",
      methodText: "P/L net = produit net de la vente - coût total d'acquisition. ROI = P/L net / coût total d'acquisition. Les frais de vente en pourcentage sont recalculés pour chaque scénario saisi.",
      inputSource: "Source des données : tous les prix, la quantité et les frais ont été saisis par l'utilisateur. Aucun prix en direct, conversion, prévision ou conseil n'a été utilisé.",
      planning: "Calcul de planification uniquement ; pas un conseil financier, fiscal ou de trading.",
      percentError: "Un frais en pourcentage doit être inférieur à 100.",
      limitError: "Une ou plusieurs valeurs dépassent la limite de calcul prise en charge.",
      profit: "Profit net",
      loss: "Perte nette",
      result: "Résultat",
      scenarioCaption: "Scénarios de prix de vente saisis par l'utilisateur",
      noScenarios: "Ajoutez un ou plusieurs prix de scénario facultatifs pour les comparer.",
      labels: {
        currency: "Devise d'affichage",
        buyPrice: "Prix d'achat par unité",
        sellPrice: "Prix de vente par unité",
        quantity: "Quantité",
        buyFee: "Frais d'achat",
        sellFee: "Frais de vente",
        acquisitionValue: "Valeur d'acquisition avant frais",
        buyFeeAmount: "Montant des frais d'achat",
        totalCost: "Coût total d'acquisition",
        disposalValue: "Produit brut de la vente",
        sellFeeAmount: "Montant des frais de vente",
        netProceeds: "Produit net de la vente",
        netProfit: "Profit / perte net",
        roi: "ROI sur le coût total d'acquisition",
        breakEven: "Prix de vente au seuil de rentabilité"
      },
      columns: {
        price: "Prix de vente saisi",
        proceeds: "Produit net",
        fees: "Total des frais",
        profit: "Profit / perte net",
        roi: "ROI"
      }
    }
  }[lang];

  var result = null;
  var scenarioResults = [];
  var status = document.getElementById("cryptoProfitStatus");
  var output = document.getElementById("cryptoProfitResults");
  var scenarioBody = document.getElementById("cryptoProfitScenarioBody");
  var scenarioEmpty = document.getElementById("cryptoProfitScenarioEmpty");
  var scenarioInputs = ["scenarioPrice1", "scenarioPrice2", "scenarioPrice3"].map(function (id) {
    return document.getElementById(id);
  });
  var exportButtons = Array.prototype.slice.call(document.querySelectorAll("[data-profit-export]"));

  function value(id) {
    return document.getElementById(id).value;
  }

  function input() {
    return {
      buyPrice: value("buyPrice"),
      sellPrice: value("sellPrice"),
      quantity: value("quantity"),
      buyFee: { type: value("buyFeeType"), value: value("buyFeeValue") },
      sellFee: { type: value("sellFeeType"), value: value("sellFeeValue") }
    };
  }

  function currency() {
    return value("currencyCode").trim().toUpperCase();
  }

  function money(amount) {
    var number = Number(amount);
    var sign = number < 0 ? "-" : "";
    return sign + currency() + " " + Math.abs(number).toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function percent(amount) {
    return Number(amount).toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + "%";
  }

  function feeText(fee) {
    return fee.type === "percent" ? percent(fee.value) : money(fee.value);
  }

  function setStatus(message, error) {
    status.textContent = message;
    status.dataset.state = error ? "error" : "ok";
  }

  function localizedError(error) {
    var message = error && error.message ? error.message : String(error || "");
    if (/percentage must be below 100/.test(message)) return copy.percentError;
    if (/exceeds the (supported|safe calculation) limit/.test(message)) return copy.limitError;
    return message;
  }

  function enableExports(enabled) {
    exportButtons.forEach(function (button) {
      button.disabled = !enabled;
    });
  }

  function row(label, formatted, className) {
    return '<div class="profit-result-row' + (className ? " " + className : "") + '"><dt>' +
      label + "</dt><dd>" + formatted + "</dd></div>";
  }

  function renderResult() {
    var isProfit = result.netProfit >= 0;
    output.innerHTML =
      '<div class="profit-result-hero ' + (isProfit ? "is-profit" : "is-loss") + '">' +
        '<span>' + (isProfit ? copy.profit : copy.loss) + "</span>" +
        "<strong>" + money(result.netProfit) + "</strong>" +
        "<small>" + percent(result.roi) + " ROI</small>" +
      "</div>" +
      '<dl class="profit-result-list">' +
        row(copy.labels.acquisitionValue, money(result.acquisitionValue)) +
        row(copy.labels.buyFeeAmount, money(result.buyFee.amount)) +
        row(copy.labels.totalCost, money(result.totalCost), "is-total") +
        row(copy.labels.disposalValue, money(result.disposalValue)) +
        row(copy.labels.sellFeeAmount, money(result.sellFee.amount)) +
        row(copy.labels.netProceeds, money(result.netProceeds), "is-total") +
        row(copy.labels.breakEven, money(result.breakEvenPrice), "is-emphasis") +
      "</dl>";
  }

  function scenarioPrices() {
    return ["scenarioPrice1", "scenarioPrice2", "scenarioPrice3"].map(function (id) {
      return value(id).trim();
    }).filter(Boolean);
  }

  function renderScenarios() {
    var prices = scenarioPrices();
    scenarioBody.innerHTML = "";
    scenarioResults = [];
    if (!prices.length) {
      scenarioEmpty.hidden = false;
      return;
    }
    scenarioResults = engine.scenarios(input(), prices);
    scenarioResults.forEach(function (item) {
      var tr = document.createElement("tr");
      [
        money(item.sellPrice),
        money(item.netProceeds),
        money(item.totalFees),
        money(item.netProfit),
        percent(item.roi)
      ].forEach(function (text) {
        var td = document.createElement("td");
        td.textContent = text;
        tr.appendChild(td);
      });
      scenarioBody.appendChild(tr);
    });
    scenarioEmpty.hidden = true;
  }

  function calculate(event) {
    if (event) event.preventDefault();
    delete output.dataset.resultSettled;
    if (!form.reportValidity()) {
      setStatus(copy.invalid, true);
      return;
    }
    try {
      result = engine.calculate(input());
      renderResult();
      renderScenarios();
      enableExports(true);
      setStatus(copy.calculated, false);
      if (window.innerWidth <= 780) {
        var card = output.closest(".profit-card");
        if (card) card.scrollIntoView({ block: "start", behavior: "auto" });
        var heading = document.getElementById("resultsTitle");
        if (heading) heading.focus({ preventScroll: true });
      }
      output.dataset.resultSettled = "true";
    } catch (error) {
      result = null;
      scenarioResults = [];
      enableExports(false);
      setStatus(copy.invalid + localizedError(error), true);
    }
  }

  function snapshot() {
    if (!result) return null;
    return {
      schemaVersion: 1,
      tool: "crypto-profit",
      language: lang,
      currency: currency(),
      generatedAt: new Date().toISOString(),
      inputSource: "user_entered",
      inputs: {
        buyPrice: result.buyPrice,
        sellPrice: result.sellPrice,
        quantity: result.quantity,
        buyFee: { type: result.buyFee.type, value: result.buyFee.value },
        sellFee: { type: result.sellFee.type, value: result.sellFee.value },
        scenarioSellPrices: scenarioResults.map(function (item) { return item.sellPrice; })
      },
      result: {
        acquisitionValue: result.acquisitionValue,
        buyFeeAmount: result.buyFee.amount,
        totalCost: result.totalCost,
        disposalValue: result.disposalValue,
        sellFeeAmount: result.sellFee.amount,
        netProceeds: result.netProceeds,
        netProfit: result.netProfit,
        roi: result.roi,
        breakEvenPrice: result.breakEvenPrice
      },
      scenarios: scenarioResults.map(function (item) {
        return {
          sellPrice: item.sellPrice,
          netProceeds: item.netProceeds,
          totalFees: item.totalFees,
          netProfit: item.netProfit,
          roi: item.roi
        };
      }),
      method: copy.methodText,
      source: copy.inputSource,
      disclaimer: copy.planning
    };
  }

  function download(name, type, content) {
    var url = URL.createObjectURL(new Blob([content], { type: type }));
    var link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function csvCell(value) {
    return '"' + String(value == null ? "" : value).replace(/"/g, '""') + '"';
  }

  function exportCsv(data) {
    var rows = [
      ["field", "value"],
      [copy.labels.currency, data.currency],
      [copy.labels.buyPrice, result.buyPrice],
      [copy.labels.sellPrice, result.sellPrice],
      [copy.labels.quantity, result.quantity],
      [copy.labels.buyFee, feeText(result.buyFee)],
      [copy.labels.sellFee, feeText(result.sellFee)],
      [copy.labels.totalCost, result.totalCost],
      [copy.labels.netProceeds, result.netProceeds],
      [copy.labels.netProfit, result.netProfit],
      [copy.labels.roi, result.roi],
      [copy.labels.breakEven, result.breakEvenPrice],
      [copy.method, copy.methodText],
      ["Source", copy.inputSource],
      ["Disclaimer", copy.planning]
    ];
    if (scenarioResults.length) {
      rows.push([]);
      rows.push([copy.scenarioCaption, copy.columns.profit, copy.columns.roi]);
      scenarioResults.forEach(function (item) {
        rows.push([item.sellPrice, item.netProfit, item.roi]);
      });
    }
    download("crypto-profit-" + data.currency.toLowerCase() + ".csv", "text/csv;charset=utf-8", rows.map(function (cells) {
      return cells.map(csvCell).join(",");
    }).join("\r\n"));
    setStatus(copy.csv, false);
  }

  function exportJson(data) {
    download("crypto-profit-" + data.currency.toLowerCase() + ".json", "application/json;charset=utf-8", JSON.stringify(data, null, 2));
    setStatus(copy.json, false);
  }

  function exportPdf(data) {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      setStatus(copy.pdfUnavailable, true);
      return;
    }
    var doc = new window.jspdf.jsPDF({ unit: "pt", format: "a4" });
    var y = 48;
    var lines = [
      copy.title,
      "",
      copy.labels.currency + ": " + data.currency,
      copy.labels.buyPrice + ": " + money(result.buyPrice),
      copy.labels.sellPrice + ": " + money(result.sellPrice),
      copy.labels.quantity + ": " + result.quantity,
      copy.labels.buyFee + ": " + feeText(result.buyFee) + " = " + money(result.buyFee.amount),
      copy.labels.sellFee + ": " + feeText(result.sellFee) + " = " + money(result.sellFee.amount),
      copy.labels.totalCost + ": " + money(result.totalCost),
      copy.labels.netProceeds + ": " + money(result.netProceeds),
      copy.labels.netProfit + ": " + money(result.netProfit),
      copy.labels.roi + ": " + percent(result.roi),
      copy.labels.breakEven + ": " + money(result.breakEvenPrice),
      "",
      copy.method + ": " + copy.methodText,
      copy.inputSource,
      copy.planning,
      "Generated: " + data.generatedAt
    ];
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(lines.shift(), 48, y);
    y += 26;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    lines.forEach(function (line) {
      var wrapped = doc.splitTextToSize(line, 500);
      if (y + wrapped.length * 14 > 790) {
        doc.addPage();
        y = 48;
      }
      doc.text(wrapped, 48, y);
      y += Math.max(14, wrapped.length * 14);
    });
    doc.save("crypto-profit-" + data.currency.toLowerCase() + ".pdf");
    setStatus(copy.pdf, false);
  }

  form.addEventListener("submit", calculate);
  form.addEventListener("input", function () {
    result = null;
    scenarioResults = [];
    enableExports(false);
    setStatus(copy.ready, false);
  });
  scenarioInputs.forEach(function (field) {
    field.addEventListener("input", function () {
      if (!result) return;
      try {
        renderScenarios();
        enableExports(true);
        setStatus(copy.calculated, false);
      } catch (error) {
        scenarioResults = [];
        enableExports(false);
        setStatus(copy.invalid + localizedError(error), true);
      }
    });
  });
  document.getElementById("currencyCode").addEventListener("input", function () {
    this.value = this.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3);
  });

  exportButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      var data = snapshot();
      if (!data) {
        setStatus(copy.noResult, true);
        return;
      }
      var type = button.dataset.profitExport;
      if (type === "csv") exportCsv(data);
      if (type === "json") exportJson(data);
      if (type === "pdf") exportPdf(data);
      if (type === "print") {
        setStatus(copy.print, false);
        window.print();
      }
    });
  });

  enableExports(false);
  setStatus(copy.ready, false);
})();
